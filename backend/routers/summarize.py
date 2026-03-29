from fastapi import APIRouter, HTTPException
from models.schemas import SummarizeRequest
from services import rag_service, llm_service

router = APIRouter()

@router.post("/api/summarize")
async def summarize_pdf(request: SummarizeRequest):
    try:
        full_text = rag_service.retrieve_all_context(request.session_id)
        if not full_text.strip():
            raise HTTPException(status_code=400, detail="No text found for this session.")
            
        system_prompt = f"""You are StudyMind, an academic assistant. Given the following study material, 
provide:
1. A concise summary (3-4 sentences)
2. A list of 8-10 key revision points as bullet points

Format your response exactly as:
SUMMARY:
<summary here>

REVISION NOTES:
- Point 1
- Point 2

Material:
{full_text}"""
        
        response_text = await llm_service.call_llm(system_prompt, "Please summarize the material and provide revision notes.")
        
        parts = response_text.split("REVISION NOTES:")
        summary = parts[0].replace("SUMMARY:", "").strip()
        revision_notes_raw = parts[1].strip() if len(parts) > 1 else ""
        
        revision_notes = [note.strip() for note in revision_notes_raw.split('\n') if note.strip().startswith('-') or note.strip().startswith('•')]
        
        return {
            "summary": summary,
            "revision_notes": revision_notes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
