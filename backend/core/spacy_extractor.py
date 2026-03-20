import spacy
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

nlp = spacy.load("en_core_web_sm")

ABBREVIATIONS: dict[str, str] = {
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "nlp": "Natural Language Processing",
    "cv": "Computer Vision",
    "js": "JavaScript",
    "ts": "TypeScript",
    "k8s": "Kubernetes",
    "sql": "SQL",
    "aws": "AWS",
    "gcp": "Google Cloud Platform",
}


def normalize(text: str) -> str:
    t = text.lower().strip()
    return ABBREVIATIONS.get(t, t)


def infer_level(text: str, skill: str) -> str:
    text_lower = text.lower()
    if any(p in text_lower for p in ["senior", "lead", "expert", "5+ years", "7+ years"]):
        return "advanced"
    if any(p in text_lower for p in ["2 years", "3 years", "intermediate", "proficient"]):
        return "intermediate"
    return "beginner"


def extract_skills(text: str, onet_skills: list, model: SentenceTransformer) -> list:
    """
    Extract skills from text using spaCy noun-phrase chunking matched
    against the O*NET taxonomy via cosine similarity.

    Args:
        text:        Raw resume or JD text (capped at 5000 chars internally).
        onet_skills: List of dicts with at least {name, category}.
        model:       SentenceTransformer instance for encoding.

    Returns:
        List of {name, category, level, confidence} dicts, deduplicated.
    """
    text = text[:5000]
    doc = nlp(text)

    # Multi-word noun chunks (2–4 words, minimum length 3 chars)
    chunks = list(set(
        normalize(c.text)
        for c in doc.noun_chunks
        if 2 <= len(c.text.split()) <= 4 and len(c.text) > 3
    ))

    # Single proper/common nouns that may be tech terms
    single_words = [
        normalize(t.text)
        for t in doc
        if t.pos_ in ("PROPN", "NOUN") and len(t.text) > 2
    ]

    candidates = list(set(chunks + single_words))
    if not candidates:
        return []

    # Batch encode for efficiency
    cand_vecs = model.encode(candidates, batch_size=32)
    onet_vecs = model.encode(
        [s["name"].lower() for s in onet_skills], batch_size=32
    )

    # Shape: (num_candidates, num_onet_skills)
    sims = cosine_similarity(cand_vecs, onet_vecs)

    extracted: list[dict] = []
    seen: set[str] = set()

    for i, cand in enumerate(candidates):
        best_j = int(np.argmax(sims[i]))
        best_sim = float(sims[i][best_j])

        if best_sim > 0.75:
            skill = onet_skills[best_j]
            if skill["name"] not in seen:
                seen.add(skill["name"])
                extracted.append({
                    "name": skill["name"],
                    "category": skill.get("category", "unknown"),
                    "level": infer_level(text, skill["name"]),
                    "confidence": round(best_sim, 2),
                })

    return extracted