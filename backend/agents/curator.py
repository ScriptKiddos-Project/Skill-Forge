import asyncio
from agents import retriever

DIFFICULTY_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2}
DIFFICULTY_FOR_STATE = {
    # knowledge_state < 0.45 → missing → start with beginner
    "missing": "beginner",
    # knowledge_state 0.45–0.79 → weak → intermediate
    "weak": "intermediate",
    # Should not reach curator for 'known' (>= 0.80) skills
    "known": "advanced",
}


def _state_to_difficulty(knowledge_state: float) -> str:
    if knowledge_state < 0.45:
        return "beginner"
    if knowledge_state < 0.80:
        return "intermediate"
    return "advanced"


def fetch(skill_name: str, knowledge_state: float = 0.0, top_n: int = 3) -> list[dict]:
    """
    Retrieve and re-rank catalog resources for a skill.

    Re-ranks FAISS results by preferred difficulty, then returns top_n.
    Ensures beginners don't get advanced resources first.
    """
    preferred = _state_to_difficulty(knowledge_state)
    candidates = retriever.query(skill_name, top_k=10)

    # Partition by difficulty match
    exact: list[dict] = []
    others: list[dict] = []
    for c in candidates:
        if c.get("difficulty") == preferred:
            exact.append(c)
        else:
            others.append(c)

    # Sort others by closeness to preferred difficulty
    pref_rank = DIFFICULTY_ORDER.get(preferred, 1)
    others.sort(key=lambda c: abs(DIFFICULTY_ORDER.get(c.get("difficulty", "intermediate"), 1) - pref_rank))

    ranked = (exact + others)[:top_n]
    return _clean(ranked)


async def fetch_async(skill_name: str, knowledge_state: float = 0.0, top_n: int = 3) -> list[dict]:
    """Non-blocking wrapper for use with asyncio.gather in architect.py."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fetch, skill_name, knowledge_state, top_n)


def _clean(resources: list[dict]) -> list[dict]:
    """Strip internal scoring fields before returning to client."""
    keep = {"id", "title", "platform", "type", "duration", "url", "difficulty", "skills"}
    return [{k: v for k, v in r.items() if k in keep} for r in resources]
