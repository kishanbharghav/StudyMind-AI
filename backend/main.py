from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, rag, summarize, poster, voice, examiner
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="StudyMind AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(rag.router)
app.include_router(summarize.router)
app.include_router(poster.router)
app.include_router(voice.router)
app.include_router(examiner.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
