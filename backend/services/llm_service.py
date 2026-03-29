import httpx
import os
from dotenv import load_dotenv

load_dotenv()

NAVIGATE_API_KEY = os.getenv("NAVIGATE_API_KEY")
NAVIGATE_BASE_URL = os.getenv("NAVIGATE_BASE_URL")
NAVIGATE_MODEL = os.getenv("NAVIGATE_MODEL", "gpt-4.1-nano")

async def call_llm(system_prompt: str, user_message: str) -> str:
    base_url = (NAVIGATE_BASE_URL or "").rstrip('/')
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {NAVIGATE_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": NAVIGATE_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 1000
            },
            timeout=30.0
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
