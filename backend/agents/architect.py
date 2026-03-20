import asyncio
import json
from sqlalchemy.orm import Session

from core.skill_graph import get_skill_graph
from core import adaptive_engine
from agents import curator, explainer


async def build_pathway(
    gap_skills: list[dict],
    knowledge_states: dict[str, float],
    user_profile: dict,
    db: Session,
) -> list[dict]:
    """
    Build and persist a complete learning pathway for a user.

    Steps:
    1. generate_pathway() — topological sort of gap skills + prereqs
    2. asyncio.gather — Curator + Explainer run concurrently for ALL steps
    3. Attach resources and reasoning to each step
    4. Persist to DB

    The parallelization means total time ≈ time of the single slowest LLM call,
    regardless of how many steps are in the pathway.
    """
    skill_graph = get_skill_graph()
    gap_skill_names = [s["name"] for s in gap_skills]

    steps = adaptive_engine.generate_pathway(
        gap_skills=gap_skill_names,
        skill_graph=skill_graph,
        knowledge_states=knowledge_states,
    )

    if not steps:
        return steps

    # Build async task lists — Curator and Explainer run fully in parallel
    curator_tasks = [
        curator.fetch_async(s["skill"], s["knowledge_state"])
        for s in steps
    ]
    explainer_tasks = [
        explainer.explain_async(s, user_profile)
        for s in steps
    ]

    # asyncio.gather runs ALL curator + ALL explainer calls concurrently
    resources_list, traces = await asyncio.gather(
        asyncio.gather(*curator_tasks),
        asyncio.gather(*explainer_tasks),
    )

    for step, resources, trace in zip(steps, resources_list, traces):
        step["resources"] = resources
        step["reasoning"] = trace

    # Persist to DB
    _save_pathway(user_id=user_profile["user_id"], steps=steps, db=db)

    return steps


def _save_pathway(user_id: str, steps: list[dict], db: Session) -> None:
    """
    Upsert the pathway in the DB.
    Creates a new row if none exists; updates + increments version if it does.
    """
    from models.pathway import Pathway  # local import to avoid circular

    existing = db.query(Pathway).filter(Pathway.user_id == user_id).first()
    if existing:
        existing.steps = steps
        existing.version = (existing.version or 1) + 1
        db.add(existing)
    else:
        row = Pathway(user_id=user_id, steps=steps, version=1)
        db.add(row)
    db.commit()


def get_pathway_edges(steps: list[dict]) -> list[tuple[str, str]]:
    """
    Return prerequisite edges between skills in the pathway (for DAG viz).
    """
    skill_graph = get_skill_graph()
    skill_names = [s["skill"] for s in steps]
    return skill_graph.get_edges_for(skill_names)
