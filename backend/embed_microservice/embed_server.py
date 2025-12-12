# embed_server.py
import os
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import numpy as np
import uvicorn

# Config via env
MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
HOST = os.getenv("HOST", "127.0.0.1")   # bind to localhost by default for security
PORT = int(os.getenv("PORT", "8000"))
AUTH_TOKEN = os.getenv("EMBED_AUTH_TOKEN")  # optional simple token
MAX_BATCH = int(os.getenv("MAX_BATCH", "256"))  # max texts per request

app = FastAPI(title="Embedding Service")

print(f"Loading model {MODEL_NAME} ... (this may take a moment)")
model = SentenceTransformer(MODEL_NAME)
EMBED_DIM = model.get_sentence_embedding_dimension()
print(f"Model loaded, embedding dim = {EMBED_DIM}")

class Texts(BaseModel):
    texts: List[str]
    truncate_to: Optional[int] = None   # optional truncation length in tokens/characters (if needed)

def check_auth(request: Request):
    if AUTH_TOKEN:
        header = request.headers.get("authorization")
        if not header or not header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid auth header")
        token = header.split(" ", 1)[1].strip()
        if token != AUTH_TOKEN:
            raise HTTPException(status_code=403, detail="Invalid token")

@app.post("/embed")
async def embed(payload: Texts, request: Request):
    """
    Embed a list of texts. Returns JSON: { embeddings: [[...], ...], dim: <int> }
    - Supports up to MAX_BATCH texts per request.
    - Secure with EMBED_AUTH_TOKEN if set (pass as Authorization: Bearer <token>).
    """
    check_auth(request)
    texts = payload.texts
    if not isinstance(texts, list) or len(texts) == 0:
        raise HTTPException(status_code=400, detail="`texts` must be a non-empty list of strings.")
    if len(texts) > MAX_BATCH:
        raise HTTPException(status_code=413, detail=f"Batch too large. Max {MAX_BATCH} texts per request.")

    if payload.truncate_to:
        texts = [t[:payload.truncate_to] for t in texts]

    # Use model.encode with convert_to_numpy True for performance
    vectors = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    # Ensure float32 -> convert to Python floats for JSON
    vectors = vectors.astype(np.float32).tolist()
    return {"embeddings": vectors, "dim": EMBED_DIM, "count": len(vectors)}


@app.get("/health")
async def health():
    return {"ok": True, "dim": EMBED_DIM, "model": MODEL_NAME}

if __name__ == "__main__":
    # uvicorn.run is used for local dev; in production prefer uvicorn CLI or Docker
    uvicorn.run("embed_server:app", host=HOST, port=PORT, log_level="info")
