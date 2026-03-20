from sklearn.metrics.pairwise import cosine_similarity
from core.embeddings import get_model
from core.skill_graph import get_skill_graph

KNOWN_THRESHOLD = 0.80
WEAK_THRESHOLD = 0.45


def compute_knowledge_state(
    resume_skills: list[dict],
    target_skill: str,
    target_category: str,
    model,
) -> float:
    """
    Compute a knowledge_state float [0, 1] for target_skill against resume skills.

    Only compares skills within the same category to prevent false matches
    (e.g., Java scoring high against JavaScript).

    Returns 0.0 if no same-category resume skill exists.
    """
    same_cat = [s for s in resume_skills if s.get("category") == target_category]
    if not same_cat:
        return 0.0

    target_vec = model.encode(target_skill.lower())
    max_sim = 0.0
    for s in same_cat:
        sv = model.encode(s["name"].lower())
        sim = float(cosine_similarity([target_vec], [sv])[0][0])
        max_sim = max(max_sim, sim)
    return round(max_sim, 4)


def evaluate_gap(
    resume_skills: list[dict],
    jd_skills: list[dict],
) -> list[dict]:
    """
    Compute the skill gap between resume and job description.

    Returns a list of gap skills with their knowledge_state and priority,
    excluding skills the user already knows (>= KNOWN_THRESHOLD).

    Priority: missing (0) > weak (1). Within same priority, deeper DAG
    position means higher need — handled by the Architect.
    """
    model = get_model()
    skill_graph = get_skill_graph()
    gap: list[dict] = []

    for jd_skill in jd_skills:
        name = jd_skill["name"]
        category = jd_skill.get("category", skill_graph.get_category(name))

        ks = compute_knowledge_state(resume_skills, name, category, model)

        if ks >= KNOWN_THRESHOLD:
            # User already knows this — skip
            continue

        priority = 1 if ks >= WEAK_THRESHOLD else 0  # 0 = missing (higher priority)
        gap.append({
            "name": name,
            "category": category,
            "knowledge_state": ks,
            "priority": priority,
            "required_level": jd_skill.get("level", "intermediate"),
        })

    # Sort: missing before weak, then alphabetically for determinism
    gap.sort(key=lambda x: (x["priority"], x["name"]))
    return gap
