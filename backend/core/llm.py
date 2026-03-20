import json
from groq import Groq
from config import settings

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def generate(prompt: str, system: str = "") -> str:
    """Send a prompt to LLaMA 3.1 via Groq and return the text response."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = _get_client().chat.completions.create(
        model="llama-3.1-8b-instant",
        max_tokens=1024,
        messages=messages,
    )
    return response.choices[0].message.content


def generate_json(prompt: str, retries: int = 3) -> dict | list | None:
    """
    Send a prompt expecting a JSON response. Strips markdown fences and
    retries up to `retries` times. Returns None if all attempts fail.
    """
    for _ in range(retries):
        raw = generate(prompt)
        cleaned = (
            raw.strip()
            .lstrip("```json")
            .lstrip("```")
            .rstrip("```")
            .strip()
        )
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            continue
    return None