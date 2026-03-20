import json
from core.spacy_extractor import extract_skills
from core.embeddings import get_model
from core import llm
from pathlib import Path

ONET_PATH = Path(__file__).parent.parent / "data" / "onet_skills.json"
ONET_SKILLS: list[dict] = json.loads(ONET_PATH.read_text())

# Abbreviation normalization map (extend as needed)
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
    "bi": "Business Analytics",
    "pm": "Project Management",
    "rl": "Reinforcement Learning",
    "ci/cd": "CI/CD",
}

CONFIRM_PROMPT = """
You are a skill extraction assistant.
Given the following candidate skill phrase extracted from a resume or job description,
determine whether it is a genuine professional skill.
If it is a skill, return the canonical O*NET skill name from this list: {onet_names}.
If it is not a skill, return "NONE".

Candidate: "{candidate}"

Respond with ONLY the canonical skill name or "NONE". No explanation.
""".strip()


def normalize(text: str) -> str:
    t = text.lower().strip()
    return ABBREVIATIONS.get(t, t)


def analyze(resume_text: str, jd_text: str) -> dict:
    """
    Extract and confirm skills from resume and JD texts.

    Returns:
        {
            "resume_skills": [{name, level, confidence, category}],
            "jd_skills":     [{name, level, confidence, category}],
        }
    """
    model = get_model()
    onet_names = [s["name"] for s in ONET_SKILLS]

    # Step 1: spaCy noun-chunk extraction + O*NET cosine match
    resume_raw = extract_skills(resume_text, ONET_SKILLS, model)
    jd_raw = extract_skills(jd_text, ONET_SKILLS, model)

    # Step 2: LLaMA confirmation pass for low-confidence extractions
    resume_skills = _confirm_low_confidence(resume_raw, onet_names)
    jd_skills = _confirm_low_confidence(jd_raw, onet_names)

    # Step 3: Deduplicate by name
    return {
        "resume_skills": _deduplicate(resume_skills),
        "jd_skills": _deduplicate(jd_skills),
    }


def _confirm_low_confidence(skills: list[dict], onet_names: list[str]) -> list[dict]:
    """
    For skills with confidence < 0.80, ask LLaMA to confirm they are real skills.
    Skills with confidence >= 0.80 are kept as-is (spaCy is confident enough).
    """
    confirmed: list[dict] = []
    for skill in skills:
        if skill["confidence"] >= 0.80:
            confirmed.append(skill)
            continue
        # Ask LLaMA to confirm
        prompt = CONFIRM_PROMPT.format(
            onet_names=", ".join(onet_names[:50]),  # keep prompt short
            candidate=skill["name"],
        )
        response = llm.generate(prompt).strip()
        if response and response.upper() != "NONE" and response in onet_names:
            skill["name"] = response
            confirmed.append(skill)
    return confirmed


def _deduplicate(skills: list[dict]) -> list[dict]:
    seen: set[str] = set()
    result: list[dict] = []
    for s in skills:
        if s["name"] not in seen:
            seen.add(s["name"])
            result.append(s)
    return result
