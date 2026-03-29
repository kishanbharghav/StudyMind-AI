from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.schemas import ExaminerQuestionRequest, ExaminerQuestionResponse, ExaminerAnswerResponse
from services import voice_service, llm_service, rag_service

router = APIRouter()

@router.post("/api/examiner/question", response_model=ExaminerQuestionResponse)
async def get_question(request: ExaminerQuestionRequest):
    try:
        if not request.session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        
        full_text = rag_service.retrieve_all_context(request.session_id)
        if not full_text:
            raise HTTPException(status_code=400, detail="No session found or text empty.")
            
        system_prompt = f"""You are StudyMind AI, an expert academic examiner. Based on the following study materials, generate ONE challenging analytical question to test the student's understanding.
        
Output ONLY the text of the question. Do not include any prefixes like 'Question:' or bullet points. Keep it conversational.

Material:
{full_text}"""
        
        question = await llm_service.call_llm(system_prompt, "Please formulate exactly one engaging exam question based on these materials.")
        question = question.strip()
        
        audio_b64 = await voice_service.text_to_speech(question)
        
        return ExaminerQuestionResponse(
            question=question,
            audio_b64=audio_b64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/examiner/answer", response_model=ExaminerAnswerResponse)
async def submit_answer(
    session_id: str = Form(...),
    question: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        audio_bytes = await file.read()
        transcribed_text = await voice_service.transcribe_audio(audio_bytes, file.filename)
        
        if not transcribed_text.strip():
            raise HTTPException(status_code=400, detail="Could not transcribe answer")
            
        full_text = rag_service.retrieve_all_context(session_id)
        
        system_prompt = f"""You are StudyMind AI, an encouraging but precise academic examiner. 

The student was asked this question:
"{question}"

The student's verbal answer was:
"{transcribed_text}"

You must evaluate this answer strictly against the provided source material to ensure factual accuracy. If they are correct, congratulate them and elaborate slightly. If they are wrong or missing key points, correct them gently.
Always speak directly to the student as if in a live conversation. Be concise (max 3-4 sentences).

Source Material:
{full_text}"""

        feedback_text = await llm_service.call_llm(system_prompt, "Please evaluate my answer and provide feedback.")
        
        feedback_audio_b64 = await voice_service.text_to_speech(feedback_text)
        
        return ExaminerAnswerResponse(
            transcription=transcribed_text,
            feedback_text=feedback_text,
            feedback_audio_b64=feedback_audio_b64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
