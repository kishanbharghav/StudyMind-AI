from fastapi import APIRouter, HTTPException
from models.schemas import PosterRequest
from services import image_service

router = APIRouter()

@router.post("/api/generate-poster")
async def generate_poster(request: PosterRequest):
    try:
        prompt = f"Educational study poster about {request.topic}, {request.style}, clean layout, vibrant colors, clear diagrams, key concepts labeled, suitable for students, high quality, informative infographic style"
        
        b64_image = await image_service.generate_image(prompt)
        
        return {
            "image_b64": b64_image,
            "prompt_used": prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
