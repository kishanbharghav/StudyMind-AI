from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services import voice_service, llm_service, rag_service
from models.schemas import VoiceResponse

router = APIRouter()

@router.post("/api/voice", response_model=VoiceResponse)
async def process_voice(
    file: UploadFile = File(...),
    session_id: str = Form(None)
):
    try:
        audio_bytes = await file.read()
        
        transcribed_text = await voice_service.transcribe_audio(audio_bytes, file.filename)
        
        if not transcribed_text.strip():
            raise HTTPException(status_code=400, detail="Could not transcribe audio")
            
        if session_id:
            context_chunks = rag_service.retrieve_context(transcribed_text, session_id)
            context_text = "\n\n".join(context_chunks)
            system_prompt = f"""You are StudyMind, a helpful academic assistant. Answer the question using ONLY the context provided below. Be concise and conversational, as your answer will be spoken aloud to the user.
            
Context:
{context_text}"""
        else:
            system_prompt = "You are StudyMind, a helpful academic assistant. Provide a concise, conversational answer to the student's question, as it will be spoken aloud."
            
        llm_answer = await llm_service.call_llm(system_prompt, transcribed_text)
        
        audio_b64 = await voice_service.text_to_speech(llm_answer)
        
        return VoiceResponse(
            transcribed_text=transcribed_text,
            llm_answer=llm_answer,
            audio_b64=audio_b64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
