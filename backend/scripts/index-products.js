// index_products_replace_embeddings.js
require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('../src/config/env'); // keep your env loader
// fallback if you prefer .env MONGO_URI
// const MONGODB_URI = process.env.MONGO_URI;

const DB_NAME = process.env.DB_NAME || 'AiEcommerce';
const COLL = process.env.COLL || 'products';
const EMBED_URL = process.env.EMBED_URL || 'http://127.0.0.1:8000/embed';
const AUTH_TOKEN = process.env.EMBED_AUTH_TOKEN || process.env.EMBED_AUTH;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
const EXPECTED_DIM = parseInt(process.env.EMBED_DIM || '384', 10); // adjust if you use different model
const DRY_RUN = (process.env.DRY_RUN || 'false').toLowerCase() === 'true';

const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

function safeJoin(arr) {
  return (arr && Array.isArray(arr)) ? arr.join(', ') : '';
}

function analyticsSummary(analytics) {
  if (!analytics) return '';
  const { viewCount, cartAddCount, purchaseCount, averageRating, reviewCount } = analytics;
  return `views:${viewCount ?? 0} carts:${cartAddCount ?? 0} purchases:${purchaseCount ?? 0} rating:${averageRating ?? 0} reviews:${reviewCount ?? 0}`;
}

function metadataSummary(metadata) {
  if (!metadata) return '';
  const parts = [];
  if (metadata.modelSample) {
    const s = metadata.modelSample;
    parts.push(`modelSample(height:${s.heightCm ?? ''} bust:${s.bustCm ?? ''} waist:${s.waistCm ?? ''} hips:${s.hipsCm ?? ''})`);
  }
  if (metadata.inclusive) {
    const inc = metadata.inclusive;
    parts.push(`bodyType:${inc.bodyType ?? ''} isMaternity:${inc.isMaternity ?? false}`);
  }
  if (metadata.batch) parts.push(`batch:${metadata.batch}`);
  return parts.join(' | ');
}

function productTextForEmbedding(p) {
  // Build a rich single-line text summary for embedding
  const pieces = [
    p.name || '',
    p.description || '',
    p.aiDescription || '',
    `colors: ${safeJoin(p.color)}`,
    `sizes: ${safeJoin(p.sizes)}`,
    `material: ${p.material || ''}`,
    `brand: ${p.brand || ''}`,
    `style: ${p.style || ''}`,
    `fit: ${p.fit || ''}`,
    `occasion: ${p.occasion || ''}`,
    `season: ${safeJoin(p.season)}`,
    `care: ${p.careInstructions || ''}`,
    `styleTips: ${p.styleTips || ''}`,
    `targetAudience: ${p.targetAudience || ''}`,
    `tags: ${safeJoin(p.tags)}`,
    `sku: ${p.sku || ''}`,
    `stock: ${p.stockQuantity ?? ''}`,
    analyticsSummary(p.analytics),
    metadataSummary(p.metadata)
  ];
  // join with delimiter to keep tokens clear
  return pieces.filter(Boolean).join(' | ');
}

async function getEmbeddingBatch(texts) {
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  const resp = await axios.post(EMBED_URL, { texts }, { headers, timeout: 120000 });
  return resp.data; // { embeddings: [...], dim: N, count: ... }
}

async function run() {
  console.log('Connecting to MongoDB...');
  await client.connect();
  const db = client.db(DB_NAME);
  const products = db.collection(COLL);

  // Check embed service health and embedding dim when possible
  try {
    const h = await axios.get(`${EMBED_URL.replace(/\/embed\/?$/, '')}/health`, {
      headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : undefined,
      timeout: 5000
    }).catch(() => null);
    if (h && h.data) {
      console.log('Embed service health:', h.data);
      if (h.data.dim && h.data.dim !== EXPECTED_DIM) {
        console.warn(`Warning: embed service dim (${h.data.dim}) != EXPECTED_DIM (${EXPECTED_DIM}). Consider updating EXPECTED_DIM.`);
      }
    }
  } catch (err) {
    console.warn('Could not fetch embed service /health (continuing)...', err.message);
  }

  console.log('Scanning products and preparing batches...');
  const cursor = products.find({});
  let batch = [];
  let ids = [];
  let total = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length === EXPECTED_DIM) {
      continue;
    }
    const text = productTextForEmbedding(doc);
    ids.push(doc._id);
    batch.push(text);

    if (batch.length >= BATCH_SIZE) {
      console.log(`Sending batch of ${batch.length} to embed service...`);
      if (!DRY_RUN) {
        const resp = await getEmbeddingBatch(batch);
        const vectors = resp.embeddings;
        if (!vectors || vectors.length !== batch.length) {
          throw new Error('Embedding service returned wrong number of vectors');
        }
        // validate dims optionally
        if (vectors[0].length !== EXPECTED_DIM) {
          console.warn(`Warning: returned embedding dim ${vectors[0].length} doesn't match EXPECTED_DIM ${EXPECTED_DIM}`);
        }

        const ops = ids.map((id, i) => ({
          updateOne: {
            filter: { _id: id },
            update: { $set: { embedding: vectors[i], embeddings: vectors[i] } } // write both fields to be compatible
          }
        }));
        await products.bulkWrite(ops);
        console.log(`Indexed batch of ${ops.length}`);
      } else {
        console.log('DRY_RUN enabled — not writing to DB');
      }

      total += batch.length;
      batch = [];
      ids = [];
    }
  }

  // final batch
  if (batch.length) {
    console.log(`Sending final batch of ${batch.length} to embed service...`);
    if (!DRY_RUN) {
      const resp = await getEmbeddingBatch(batch);
      const vectors = resp.embeddings;
      if (!vectors || vectors.length !== batch.length) {
        throw new Error('Embedding service returned wrong number of vectors (final)');
      }
      if (vectors[0].length !== EXPECTED_DIM) {
        console.warn(`Warning: returned embedding dim ${vectors[0].length} doesn't match EXPECTED_DIM ${EXPECTED_DIM}`);
      }

      const ops = ids.map((id, i) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { embedding: vectors[i], embeddings: vectors[i] } }
        }
      }));
      await products.bulkWrite(ops);
      console.log(`Indexed final batch of ${ops.length}`);
    } else {
      console.log('DRY_RUN enabled — not writing final batch');
    }
    total += batch.length;
  }

  console.log(`Done indexing products. Total processed: ${total}`);
  await client.close();
}

run().catch(err => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
