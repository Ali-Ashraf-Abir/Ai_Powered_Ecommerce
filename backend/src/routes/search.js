// routes/search.js
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const router = express.Router();

const EMBED_URL = process.env.EMBED_URL || 'http://127.0.0.1:8000/embed';
const EMBED_AUTH = process.env.EMBED_AUTH_TOKEN;
const VECTOR_K = parseInt(process.env.VECTOR_K || '12', 10);
const EXPECTED_DIM = parseInt(process.env.EMBED_DIM || '384', 10);
const MAX_LIMIT = parseInt(process.env.SEARCH_MAX_LIMIT || '50', 10);
const REQUEST_TIMEOUT_MS = parseInt(process.env.EMBED_TIMEOUT_MS || '120000', 10);

// helper: call embed service for single text
async function embedText(text) {
  const headers = { 'Content-Type': 'application/json' };
  if (EMBED_AUTH) headers.Authorization = `Bearer ${EMBED_AUTH}`;
  const resp = await axios.post(EMBED_URL, { texts: [text] }, { headers, timeout: REQUEST_TIMEOUT_MS });
  if (!resp?.data?.embeddings?.[0]) throw new Error('No embedding returned');
  return resp.data.embeddings[0];
}

// normalize an array (min-max) - returns array with same length
function normalize(arr) {
  if (!arr || !arr.length) return arr || [];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 1);
  return arr.map(v => (v - min) / (max - min));
}

// re-rank results by combining vector score + analytics signals
function combineAndRerank(docs, opts = {}) {
  const alpha = parseFloat(process.env.RANK_ALPHA || '0.7');
  const beta = parseFloat(process.env.RANK_BETA || '0.2');
  const gamma = parseFloat(process.env.RANK_GAMMA || '0.1');

  const purchases = docs.map(d => d.analytics?.purchaseCount || 0);
  const ratings = docs.map(d => d.analytics?.averageRating || 0);

  const pNorm = normalize(purchases);
  const rNorm = normalize(ratings);

  return docs.map((d, i) => {
    const vec = d.score ?? 0;
    const p = pNorm[i] ?? 0;
    const rt = rNorm[i] ?? 0;
    return { ...d, finalScore: alpha * vec + beta * p + gamma * rt };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

// Fallback basic text search if vector search fails or embedding service down
async function fallbackTextSearch(productsColl, query, limit) {
  const pipeline = [
    {
      $search: {
        index: "default_text",
        text: { query, path: ["name", "description", "aiDescription", "tags", "color"] }
      }
    },
    { $project: { name: 1, price: 1, category: 1, aiDescription: 1, score: { $meta: "searchScore" } } },
    { $limit: limit }
  ];
  return productsColl.aggregate(pipeline).toArray();
}

// Main search route
router.post('/search', async (req, res) => {
  const t0 = Date.now();
  try {
    const {
      q,
      category, 
      priceMin, 
      priceMax,
      colors, 
      sizes,
      k = 10,
      limit = 10,
      debug = false
    } = req.body;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'q (non-empty string) is required' });
    }

    const finalLimit = Math.min(limit, MAX_LIMIT);

    // 1) embed query
    let qVec;
    try {
      qVec = await embedText(q);
      if (!Array.isArray(qVec) || qVec.length !== EXPECTED_DIM) {
        console.warn('Query embedding dim mismatch or invalid');
      }
    } catch (embedErr) {
      console.warn('Embedding failed:', embedErr.message);
      const productsColl = mongoose.connection.db.collection('products');
      const fallback = await fallbackTextSearch(productsColl, q, finalLimit);
      return res.json({ ok: true, results: fallback, fallback: true, tookMs: Date.now() - t0 });
    }

    // 2) build vector search pipeline
    const productsColl = mongoose.connection.db.collection('products');
    const knnK = Math.min(Math.max(1, parseInt(k, 10)), 100);

    // Build the vector search stage
    const searchStage = {
      $vectorSearch: {
        index: 'default',
        path: 'embedding',
        queryVector: qVec,
        numCandidates: knnK * 10,
        limit: knnK
      }
    };

    // Start building pipeline
    const pipeline = [searchStage];
    
    // Apply filters using $match stage (post-vector-search filtering)
    // This works without requiring filter fields in the Atlas index
    const matchConditions = {};
    
    if (category && typeof category === 'string' && category.trim()) {
      matchConditions.category = category;
    }
    
    if (priceMin !== undefined && priceMin !== null && !isNaN(priceMin)) {
      if (!matchConditions.price) matchConditions.price = {};
      matchConditions.price.$gte = Number(priceMin);
    }
    if (priceMax !== undefined && priceMax !== null && !isNaN(priceMax)) {
      if (!matchConditions.price) matchConditions.price = {};
      matchConditions.price.$lte = Number(priceMax);
    }
    
    if (Array.isArray(colors) && colors.length > 0) {
      const validColors = colors.filter(c => c && typeof c === 'string');
      if (validColors.length > 0) {
        matchConditions.color = { $in: validColors };
      }
    }
    
    if (Array.isArray(sizes) && sizes.length > 0) {
      const validSizes = sizes.filter(s => s && typeof s === 'string');
      if (validSizes.length > 0) {
        matchConditions.sizes = { $in: validSizes };
      }
    }
    
    // Add $match stage if we have any conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }
    
    // Add projection stage
    pipeline.push({
      $project: {
        score: { $meta: 'vectorSearchScore' },
        name: 1, 
        price: 1, 
        category: 1, 
        color: 1, 
        sizes: 1, 
        aiDescription: 1, 
        tags: 1, 
        sku: 1, 
        analytics: 1, 
        stockQuantity: 1,
        brand: 1,
        material: 1,
        occasion: 1,
        style: 1,
        fit: 1,
        description: 1
      }
    });

    // 3) run aggregation
    const docs = await productsColl.aggregate(pipeline, { maxTimeMS: 20000 }).toArray();

    // 4) rerank and trim
    let reranked = combineAndRerank(docs).slice(0, finalLimit);
    
    // If no results from vector search, try text search as fallback
    if (reranked.length === 0) {
      try {
        const textResults = await productsColl.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { aiDescription: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } }
          ]
        }).limit(finalLimit).toArray();
        
        if (textResults.length > 0) {
          reranked = textResults.map(doc => ({ ...doc, score: 0.5, finalScore: 0.5, fallbackSearch: true }));
        }
      } catch (textErr) {
        console.error('Text search fallback failed:', textErr.message);
      }
    }

    // 5) return result
    const took = Date.now() - t0;
    if (debug) {
      return res.json({ 
        ok: true, 
        results: reranked, 
        tookMs: took, 
        rawCount: docs.length,
        vectorDim: qVec.length,
        filtersApplied: Object.keys(matchConditions).length,
        filters: matchConditions,
        usedFallback: reranked.length > 0 && reranked[0]?.fallbackSearch === true
      });
    }
    return res.json({ ok: true, results: reranked, tookMs: took });

  } catch (err) {
    console.error('Search route error:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message, 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});

module.exports = router;