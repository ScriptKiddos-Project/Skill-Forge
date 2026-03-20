import asyncio
from core import llm

EXPLAIN_PROMPT = """In exactly 2 sentences, explain:
1. Why {skill} matters for a {role} role.
2. Why it is placed at position {position} in this learning path.

User already knows: {known_skills}.
Be specific, not generic."""


def explain(step: dict, user_profile: dict) -> str:
    """
    Generate a 2-sentence reasoning trace for a pathway step.

    Args:
        step: pathway step dict with 'skill', 'order', 'stage'
        user_profile: dict with 'role', 'known_skills'

    Returns:
        A 2-sentence reasoning string from LLaMA.
    """
    known = user_profile.get("known_skills", [])
    known_str = ", ".join(known) if known else "nothing yet"

    prompt = EXPLAIN_PROMPT.format(
        skill=step["skill"],
        role=user_profile.get("role", "professional"),
        position=step["order"] + 1,
        known_skills=known_str,
    )
    result = llm.generate(prompt)
    return result.strip() if result else _fallback(step)


async def explain_async(step: dict, user_profile: dict) -> str:
    """
    Non-blocking wrapper — runs the blocking Groq call in a thread pool
    so asyncio.gather can parallelize all explainer calls simultaneously.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, explain, step, user_profile)


def _fallback(step: dict) -> str:
    """Hardcoded fallback if LLaMA fails, so the UI never shows a blank trace."""
    return (
        f"{step['skill']} is a core competency required for this role. "
        f"It appears at step {step['order'] + 1} because it builds on earlier foundational skills."
    )
