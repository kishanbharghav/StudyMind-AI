from fastapi import APIRouter, UploadFile, File, HTTPException
import uuid
from models.schemas import AskRequest
from services import pdf_service, rag_service, llm_service
import os

router = APIRouter()

@router.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    session_id = str(uuid.uuid4())
    temp_file_path = f"temp_{session_id}_{file.filename}"
    
    content = await file.read()
    with open(temp_file_path, "wb") as f:
        f.write(content)
        
    try:
        text = pdf_service.extract_text_from_pdf(temp_file_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
        num_chunks = rag_service.process_pdf_text(text, session_id)
        
        return {
            "session_id": session_id,
            "pages": 1, # hardcoded, can use fitz to get exact pages if necessary
            "chunks": num_chunks,
            "message": "PDF processed successfully"
        }
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.post("/api/ask")
async def ask_question(request: AskRequest):
    try:
        context_chunks = rag_service.retrieve_context(request.question, request.session_id)
        
        if not context_chunks:
            return {"answer": "I couldn't find this in your notes.", "source_chunks": []}
            
        context_text = "\n\n".join(context_chunks)
        
        system_prompt = f"""You are StudyMind, a helpful academic assistant. Answer the student's question 
using ONLY the context provided below. If the answer is not in the context, say 
"I couldn't find this in your notes." Be concise and clear.

Context:
{context_text}"""

        answer = await llm_service.call_llm(system_prompt, request.question)
        
        return {
            "answer": answer,
            "source_chunks": context_chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
