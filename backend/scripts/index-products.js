// index_products.js
require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('../src/config/env');
// const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'AiEcommerce';
const COLL = process.env.COLL || 'products';
const EMBED_URL = process.env.EMBED_URL || 'http://localhost:8000/embed';

const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

function productTextForEmbedding(p) {
  return [
    p.name || '',
    p.description || '',
    p.aiDescription || '',
    (p.tags || []).join(' '),
    p.category || '',
    p.brand || ''
  ].join(' ');
}

async function run() {
  await client.connect();
  const db = client.db(DB_NAME);
  const products = db.collection(COLL);

  const cursor = products.find({});
  const batchSize = 50;
  let batch = [];

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    // skip if embedding already exists (optional)
    if (doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length === 384) {
      continue;
    }
    batch.push({ _id: doc._id, text: productTextForEmbedding(doc) });

    if (batch.length >= batchSize) {
      const texts = batch.map(b => b.text);
      const resp = await axios.post(EMBED_URL, { texts });
      const vectors = resp.data.embeddings;
      const ops = [];
      for (let i = 0; i < batch.length; i++) {
        ops.push({
          updateOne: {
            filter: { _id: batch[i]._id },
            update: { $set: { embedding: vectors[i] } }
          }
        });
      }
      if (ops.length) {
        await products.bulkWrite(ops);
        console.log(`Indexed batch of ${ops.length}`);
      }
      batch = [];
    }
  }

  // final small batch
  if (batch.length) {
    const texts = batch.map(b => b.text);
    const resp = await axios.post(EMBED_URL, { texts });
    const vectors = resp.data.embeddings;
    const ops = [];
    for (let i = 0; i < batch.length; i++) {
      ops.push({
        updateOne: {
          filter: { _id: batch[i]._id },
          update: { $set: { embedding: vectors[i] } }
        }
      });
    }
    if (ops.length) {
      await products.bulkWrite(ops);
      console.log(`Indexed final batch of ${ops.length}`);
    }
  }

  console.log('Done indexing products.');
  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
