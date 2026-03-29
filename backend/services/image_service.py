import httpx
import os
from dotenv import load_dotenv

load_dotenv()

NAVIGATE_API_KEY = os.getenv("NAVIGATE_API_KEY")
NAVIGATE_BASE_URL = os.getenv("NAVIGATE_BASE_URL")

async def generate_image(prompt: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{NAVIGATE_BASE_URL}/images/generations",
            headers={
                "Authorization": f"Bearer {NAVIGATE_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024",
                "model": "imagen-4.0-generate-001"
            },
            timeout=60.0
        )
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["b64_json"]
