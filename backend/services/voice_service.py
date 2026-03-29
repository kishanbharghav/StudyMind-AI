import httpx
import os
from dotenv import load_dotenv
import base64

load_dotenv()

NAVIGATE_API_KEY = os.getenv("NAVIGATE_API_KEY")
NAVIGATE_BASE_URL = os.getenv("NAVIGATE_BASE_URL")

async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    async with httpx.AsyncClient() as client:
        files = {"file": (filename, file_bytes, "audio/wav")}
        data = {"model": "whisper-1"}
        response = await client.post(
            f"{NAVIGATE_BASE_URL}/audio/transcriptions",
            headers={
                "Authorization": f"Bearer {NAVIGATE_API_KEY}"
            },
            files=files,
            data=data,
            timeout=60.0
        )
        response.raise_for_status()
        result = response.json()
        return result.get("text", "")

async def text_to_speech(text: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{NAVIGATE_BASE_URL}/audio/speech",
            headers={
                "Authorization": f"Bearer {NAVIGATE_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini-tts",
                "input": text,
                "voice": "alloy"
            },
            timeout=60.0
        )
        response.raise_for_status()
        audio_bytes = response.read()
        return base64.b64encode(audio_bytes).decode("utf-8")
