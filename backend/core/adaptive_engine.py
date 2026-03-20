import json
from collections import Counter
from sqlalchemy.orm import Session

from core.skill_graph import SkillGraph

KNOWN_THRESHOLD = 0.80   # >= this: skill is known, skip in pathway
WEAK_THRESHOLD = 0.45    # >= this and < KNOWN: needs reinforcement
                          # < WEAK: missing, full learning needed


# ------------------------------------------------------------------ #
# Pathway generation
# ------------------------------------------------------------------ #

def generate_pathway(
    gap_skills: list[str],
    skill_graph: SkillGraph,
    knowledge_states: dict[str, float],
) -> list[dict]:
    """
    Build an ordered list of pathway steps from gap skills.

    1. Expand each gap skill to include missing prerequisites.
    2. Add unknown skills as leaf nodes to prevent crashes.
    3. Topological sort for correct learning order.
    4. Return steps with status, stage, category, knowledge_state.
    """
    all_needed: set[str] = set()

    for skill in gap_skills:
        all_needed.add(skill)
        for prereq in skill_graph.get_prerequisites(skill):
            if knowledge_states.get(prereq, 0.0) < KNOWN_THRESHOLD:
                all_needed.add(prereq)

    # Register unknown skills so topological sort doesn't crash.
    for skill in list(all_needed):
        if skill not in skill_graph.nodes:
            skill_graph.add_leaf_node(skill)

    ordered = skill_graph.topological_order(list(all_needed))

    steps: list[dict] = []
    for i, skill in enumerate(ordered):
        steps.append({
            "skill": skill,
            "order": i,
            "stage": skill_graph.assign_stage(skill),
            "category": skill_graph.get_category(skill),
            "status": "active" if i == 0 else "locked",
            "knowledge_state": round(knowledge_states.get(skill, 0.0), 4),
            "resources": [],
            "reasoning": "",
            "latest_quiz_score": None,
            "quiz_attempts": 0,
        })

    return steps


# ------------------------------------------------------------------ #
# Adaptive quiz outcome handler
# ------------------------------------------------------------------ #

def update_pathway_after_quiz(
    user_id: str,
    skill_id: str,
    score: float,
    questions: list[dict],
    user_answers: list[str],
    db: Session,
) -> dict:
    """
    Apply PASS / REVISE / RETRY logic to the pathway after a quiz.

    Uses row-level locking (SELECT ... FOR UPDATE) to prevent race conditions
    when multiple requests hit the same pathway simultaneously.

    Returns a dict with action, message, next_topic, and weak_subtopic.
    """
    from models.pathway import Pathway  # local import to avoid circular

    with db.begin():
        # Row-level lock on this user's pathway row.
        row = (
            db.query(Pathway)
            .filter(Pathway.user_id == user_id)
            .with_for_update()
            .first()
        )
        if row is None:
            raise ValueError(f"No pathway found for user {user_id}")

        pathway: list[dict] = row.steps  # JSONB loaded as Python list

        step = _find_step(pathway, skill_id)
        if step is None:
            raise ValueError(f"Skill '{skill_id}' not in pathway for user {user_id}")

        step["latest_quiz_score"] = round(score, 4)
        step["quiz_attempts"] = step.get("quiz_attempts", 0) + 1

        if score >= 0.70:
            # PASS
            step["status"] = "complete"
            nxt = _find_next_locked(pathway, step["order"])
            if nxt:
                nxt["status"] = "active"
            action = "PASS"
            next_topic = nxt["skill"] if nxt else None
            message = (
                f"{skill_id} complete."
                + (f" {next_topic} is now unlocked." if next_topic else " You have finished the pathway!")
            )
            weak_subtopic = None

        elif score >= 0.40:
            # REVISE
            weak_subtopic = identify_weak_subtopics(questions, user_answers)
            step["status"] = "revise"
            action = "REVISE"
            next_topic = skill_id
            message = (
                f"Score {int(score * 100)}%. "
                f"Review: {weak_subtopic} before retaking."
            )

        else:
            # RETRY
            step["status"] = "retry"
            action = "RETRY"
            next_topic = skill_id
            weak_subtopic = None
            message = f"Score {int(score * 100)}%. Simpler resources loaded. Try again."

        row.steps = pathway
        db.add(row)

    return {
        "action": action,
        "message": message,
        "next_topic": next_topic,
        "weak_subtopic": weak_subtopic,
    }


# ------------------------------------------------------------------ #
# Weak subtopic identification
# ------------------------------------------------------------------ #

def identify_weak_subtopics(questions: list[dict], user_answers: list[str]) -> str:
    """
    Return the most frequently missed subtopic from quiz answers.
    Falls back to 'general review' when no wrong answers.
    """
    wrong_subtopics = [
        q.get("subtopic", "general concept")
        for q, ans in zip(questions, user_answers)
        if ans != q.get("correct_answer")
    ]
    if not wrong_subtopics:
        return "general review"
    return Counter(wrong_subtopics).most_common(1)[0][0]


# ------------------------------------------------------------------ #
# Helpers
# ------------------------------------------------------------------ #

def _find_step(pathway: list[dict], skill_id: str) -> dict | None:
    for step in pathway:
        if step["skill"] == skill_id:
            return step
    return None


def _find_next_locked(pathway: list[dict], current_order: int) -> dict | None:
    """Return the next locked step after the current step's order."""
    candidates = [s for s in pathway if s["order"] > current_order and s["status"] == "locked"]
    if not candidates:
        return None
    return min(candidates, key=lambda s: s["order"])