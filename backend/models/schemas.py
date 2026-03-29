from pydantic import BaseModel
from typing import Optional, List

class AskRequest(BaseModel):
    question: str
    session_id: str

class SummarizeRequest(BaseModel):
    session_id: str
    mode: str  # "summary", "revision_notes", or "both"

class PosterRequest(BaseModel):
    topic: str
    style: Optional[str] = "educational infographic"

class VoiceResponse(BaseModel):
    transcribed_text: str
    llm_answer: str
    audio_b64: str

class ExaminerQuestionRequest(BaseModel):
    session_id: str

class ExaminerQuestionResponse(BaseModel):
    question: str
    audio_b64: str

class ExaminerAnswerResponse(BaseModel):
    transcription: str
    feedback_text: str
    feedback_audio_b64: str
