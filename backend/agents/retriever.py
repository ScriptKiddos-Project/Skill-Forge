import asyncio
import json
import numpy as np
from pathlib import Path

import faiss
from sentence_transformers import SentenceTransformer

from core.embeddings import get_model

CATALOG_PATH = Path(__file__).parent.parent / "data" / "course_catalog.json"
INDEX_PATH = Path(__file__).parent.parent / "data" / "faiss.index"
META_PATH = Path(__file__).parent.parent / "data" / "faiss_meta.json"

_index: faiss.Index | None = None
_catalog: list[dict] = []


def build_index(force: bool = False) -> None:
    """
    Build FAISS index from course_catalog.json.
    Persists index to disk; rebuilds only when force=True or file missing.
    """
    global _index, _catalog

    _catalog = json.loads(CATALOG_PATH.read_text())

    if not force and INDEX_PATH.exists() and META_PATH.exists():
        _index = faiss.read_index(str(INDEX_PATH))
        # Verify size matches catalog
        stored_ids = json.loads(META_PATH.read_text())
        if len(stored_ids) == len(_catalog):
            return  # Cache valid

    model = get_model()

    # Build one embedding per course from title + skills joined
    texts = [
        f"{c['title']} {' '.join(c.get('skills', []))}"
        for c in _catalog
    ]
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=False)
    embeddings = np.array(embeddings, dtype="float32")

    dim = embeddings.shape[1]
    _index = faiss.IndexFlatIP(dim)   # Inner product = cosine sim after L2 norm
    faiss.normalize_L2(embeddings)
    _index.add(embeddings)

    faiss.write_index(_index, str(INDEX_PATH))
    META_PATH.write_text(json.dumps([c["id"] for c in _catalog]))


def _get_index() -> faiss.Index:
    global _index
    if _index is None:
        build_index()
    return _index


def query(skill_name: str, top_k: int = 5) -> list[dict]:
    """
    Return top_k catalog entries most relevant to skill_name.
    Uses cosine similarity via FAISS inner product on L2-normalized vectors.
    """
    model = get_model()
    vec = model.encode([skill_name.lower()], show_progress_bar=False)
    vec = np.array(vec, dtype="float32")
    faiss.normalize_L2(vec)

    index = _get_index()
    scores, indices = index.search(vec, top_k)

    results: list[dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        course = dict(_catalog[idx])
        course["relevance_score"] = round(float(score), 4)
        results.append(course)
    return results


async def query_async(skill_name: str, top_k: int = 5) -> list[dict]:
    """Non-blocking wrapper for use with asyncio.gather."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, query, skill_name, top_k)
