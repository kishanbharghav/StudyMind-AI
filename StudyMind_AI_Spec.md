# StudyMind AI — Complete Build Specification

> Smart AI Assistant for Student Productivity and Learning  
> Navigate Labs Hackathon Project

---

## 1. Project Overview

StudyMind AI is a full-stack web application that acts as a unified academic assistant. Students can upload their notes/PDFs, ask questions, get revision summaries, generate visual study posters, and interact via voice — all in one interface.

**Core value**: Not just a chatbot. It combines RAG (retrieval-augmented generation), voice I/O, image generation, and LLM summarization into a single cohesive product.

---

## 2. Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite | UI framework |
| TailwindCSS | Styling |
| Axios | HTTP requests to backend |
| Web Speech API (browser-native) | Voice input (microphone → text) |
| SpeechSynthesis API (browser-native) | Voice output (text → speech) |
| React Router v6 | Tab/page navigation |
| React Dropzone | PDF drag-and-drop upload |

### Backend
| Tech | Purpose |
|------|---------|
| Python 3.11+ | Language |
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| LangChain | RAG orchestration |
| ChromaDB | Local vector database for embeddings |
| PyMuPDF (fitz) | PDF text extraction |
| sentence-transformers | Local embeddings (free, no API needed) |
| python-multipart | File upload handling |
| python-dotenv | Environment variable management |
| httpx | Async HTTP client for NavigateLabs API calls |

### External APIs
| API | Used For |
|-----|---------|
| NavigateLabs LLM API | Q&A answers, summarization, revision notes |
| NavigateLabs Image Gen API | AI poster generation |

### Deployment
| Service | What runs there |
|---------|----------------|
| Render (free tier) | FastAPI backend |
| Vercel | React frontend |

---

## 3. Full Folder Structure

```
studymind-ai/
│
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env                     # API keys (never commit this)
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── rag.py               # /upload-pdf and /ask endpoints
│   │   ├── summarize.py         # /summarize endpoint
│   │   ├── poster.py            # /generate-poster endpoint
│   │   └── health.py            # /health endpoint
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── pdf_service.py       # PDF text extraction with PyMuPDF
│   │   ├── rag_service.py       # Chunking, embedding, ChromaDB storage/retrieval
│   │   ├── llm_service.py       # NavigateLabs LLM API calls
│   │   └── image_service.py     # NavigateLabs Image Gen API calls
│   │
│   └── models/
│       ├── __init__.py
│       └── schemas.py           # Pydantic request/response models
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Root component with tab navigation
│       ├── api/
│       │   └── client.js        # Axios instance pointing to backend
│       │
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── TabBar.jsx
│       │   └── LoadingSpinner.jsx
│       │
│       └── pages/
│           ├── ChatPage.jsx     # PDF upload + Q&A chat UI
│           ├── SummarizePage.jsx # PDF upload + summary/revision notes
│           ├── VoicePage.jsx    # Voice input/output interface
│           └── PosterPage.jsx   # AI poster generator
│
├── README.md
└── .gitignore
```

---

## 4. Backend: All API Endpoints

### Base URL (local): `http://localhost:8000`
### Base URL (deployed): `https://your-app.onrender.com`

---

### GET `/health`
- **Purpose**: Check if backend is running
- **Response**: `{ "status": "ok" }`

---

### POST `/api/upload-pdf`
- **Purpose**: Upload a PDF, extract text, chunk it, embed it, store in ChromaDB
- **Request**: `multipart/form-data` with field `file` (PDF)
- **Process**:
  1. Receive PDF file
  2. Extract all text using PyMuPDF
  3. Split text into chunks (500 tokens, 50 overlap)
  4. Generate embeddings using `sentence-transformers/all-MiniLM-L6-v2`
  5. Store chunks + embeddings in ChromaDB with a session ID
- **Response**:
```json
{
  "session_id": "abc123",
  "pages": 12,
  "chunks": 47,
  "message": "PDF processed successfully"
}
```

---

### POST `/api/ask`
- **Purpose**: Answer a question using the uploaded PDF as context (RAG)
- **Request body**:
```json
{
  "question": "What is the difference between supervised and unsupervised learning?",
  "session_id": "abc123"
}
```
- **Process**:
  1. Embed the question
  2. Query ChromaDB for top 5 most similar chunks
  3. Build a prompt: system message + context chunks + user question
  4. Send to NavigateLabs LLM API
  5. Return the answer
- **Response**:
```json
{
  "answer": "Supervised learning uses labeled data...",
  "source_chunks": ["chunk text 1", "chunk text 2"]
}
```

---

### POST `/api/summarize`
- **Purpose**: Generate a summary and bullet-point revision notes from uploaded PDF
- **Request body**:
```json
{
  "session_id": "abc123",
  "mode": "summary"  // or "revision_notes" or "both"
}
```
- **Process**:
  1. Retrieve all chunks for the session from ChromaDB
  2. Concatenate first 3000 tokens (to fit context window)
  3. Send to NavigateLabs LLM with summarization prompt
- **Response**:
```json
{
  "summary": "This document covers...",
  "revision_notes": [
    "Key point 1: ...",
    "Key point 2: ...",
    "Key point 3: ..."
  ]
}
```

---

### POST `/api/generate-poster`
- **Purpose**: Generate an AI study poster image for a given topic
- **Request body**:
```json
{
  "topic": "Photosynthesis",
  "style": "educational infographic"  // optional, default shown
}
```
- **Process**:
  1. Build an image generation prompt: `"Educational study poster about {topic}, {style}, clean design, colorful, diagram style"`
  2. Call NavigateLabs Image Gen API
  3. Return image URL or base64
- **Response**:
```json
{
  "image_url": "https://...",
  "prompt_used": "Educational study poster about..."
}
```

---

## 5. NavigateLabs API Integration

### LLM (Text Generation)

```python
# services/llm_service.py

import httpx
import os

NAVIGATE_API_KEY = os.getenv("NAVIGATE_API_KEY")
NAVIGATE_BASE_URL = os.getenv("NAVIGATE_BASE_URL")  # get this from their docs

async def call_llm(system_prompt: str, user_message: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{NAVIGATE_BASE_URL}/chat/completions",  # adjust endpoint to match their docs
            headers={
                "Authorization": f"Bearer {NAVIGATE_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",  # adjust to whatever model they provide
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 1000
            },
            timeout=30.0
        )
        data = response.json()
        return data["choices"][0]["message"]["content"]
```

> **Note**: Check the exact endpoint, model name, and response format from the NavigateLabs API docs they gave you. The structure above follows OpenAI-compatible APIs which most providers use.

### Image Generation

```python
# services/image_service.py

async def generate_image(prompt: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{NAVIGATE_BASE_URL}/images/generations",  # adjust to their docs
            headers={
                "Authorization": f"Bearer {NAVIGATE_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024"
            },
            timeout=60.0
        )
        data = response.json()
        return data["data"][0]["url"]  # or ["b64_json"] depending on their API
```

---

## 6. RAG Pipeline — Step by Step

```
PDF File
   ↓
PyMuPDF extracts raw text (page by page)
   ↓
LangChain RecursiveCharacterTextSplitter
  chunk_size=500, chunk_overlap=50
   ↓
sentence-transformers embeds each chunk
  model: all-MiniLM-L6-v2 (runs locally, free)
   ↓
ChromaDB stores (chunk_text, embedding, session_id)
   ↓
User asks a question
   ↓
Question gets embedded
   ↓
ChromaDB similarity search → top 5 chunks returned
   ↓
Prompt = system_msg + context_chunks + question
   ↓
NavigateLabs LLM generates answer
   ↓
Answer returned to frontend
```

### Key LangChain code:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def process_pdf_text(text: str, session_id: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(text)
    
    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )
    vectorstore.add_texts(chunks)
    return len(chunks)

def retrieve_context(question: str, session_id: str, k=5) -> list[str]:
    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )
    results = vectorstore.similarity_search(question, k=k)
    return [doc.page_content for doc in results]
```

---

## 7. Frontend Pages — What Each Does

### ChatPage.jsx
- Drag-and-drop PDF upload area (React Dropzone)
- On upload: POST to `/api/upload-pdf`, store `session_id` in React state
- Chat window showing message history (user + AI messages)
- Text input + send button
- On send: POST to `/api/ask` with question + session_id
- Display AI answer in chat bubble
- "🔊 Read aloud" button on each AI response (calls `speechSynthesis.speak()`)

### SummarizePage.jsx
- PDF upload (same component, reusable)
- Two buttons: "Summarize" and "Get Revision Notes"
- Calls `/api/summarize` with mode = `"summary"` or `"revision_notes"`
- Displays summary as paragraphs
- Displays revision notes as a numbered checklist
- "Copy to clipboard" button

### VoicePage.jsx
- Large mic button (uses Web Speech API `SpeechRecognition`)
- Shows live transcript as user speaks
- On stop: sends transcript to `/api/ask` (requires prior PDF upload or uses general knowledge mode)
- AI response displayed as text AND spoken aloud via `speechSynthesis`
- Visual waveform animation while listening (CSS animation, no library needed)

### PosterPage.jsx
- Text input for topic (e.g., "Photosynthesis", "Newton's Laws")
- Style dropdown: Educational Infographic / Minimalist / Colorful Diagram / Dark Theme
- "Generate Poster" button → calls `/api/generate-poster`
- Loading state with spinner
- Generated image displayed full-width
- Download button (saves image to local machine)

---

## 8. Environment Variables

### Backend `.env`
```env
NAVIGATE_API_KEY=your_api_key_here
NAVIGATE_BASE_URL=https://api.navigatelabs.ai  # confirm from their docs
```

### Frontend `.env` (Vite)
```env
VITE_BACKEND_URL=http://localhost:8000
```
For production:
```env
VITE_BACKEND_URL=https://your-app.onrender.com
```

---

## 9. LLM Prompts

### RAG Q&A Prompt
```
System: You are StudyMind, a helpful academic assistant. Answer the student's question 
using ONLY the context provided below. If the answer is not in the context, say 
"I couldn't find this in your notes." Be concise and clear.

Context:
{retrieved_chunks joined by \n\n}

User: {question}
```

### Summarization Prompt
```
System: You are StudyMind, an academic assistant. Given the following study material, 
provide:
1. A concise summary (3-4 sentences)
2. A list of 8-10 key revision points as bullet points

Format your response exactly as:
SUMMARY:
<summary here>

REVISION NOTES:
• Point 1
• Point 2
...

Material:
{text}
```

### Poster Generation Prompt
```
Educational study poster about {topic}, {style}, 
clean layout, vibrant colors, clear diagrams, 
key concepts labeled, suitable for students, 
high quality, informative infographic style
```

---

## 10. requirements.txt

```
fastapi==0.111.0
uvicorn==0.30.0
python-multipart==0.0.9
python-dotenv==1.0.1
httpx==0.27.0
PyMuPDF==1.24.5
langchain==0.2.5
langchain-community==0.2.5
chromadb==0.5.3
sentence-transformers==3.0.1
pydantic==2.7.4
```

---

## 11. package.json (Frontend)

```json
{
  "name": "studymind-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0",
    "axios": "^1.7.2",
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1",
    "tailwindcss": "^3.4.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

---

## 12. CORS Setup (Important)

In `main.py`, add CORS middleware so the React frontend can call the FastAPI backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 13. Deployment Steps

### Backend → Render
1. Push `backend/` folder to a GitHub repo
2. Go to render.com → New Web Service → connect GitHub repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `NAVIGATE_API_KEY`, `NAVIGATE_BASE_URL`
6. Deploy → copy the URL (e.g. `https://studymind-api.onrender.com`)

### Frontend → Vercel
1. Push `frontend/` folder to GitHub
2. Go to vercel.com → New Project → connect GitHub repo
3. Set environment variable: `VITE_BACKEND_URL=https://studymind-api.onrender.com`
4. Deploy → copy the URL

---

## 14. Build Order (for AI coding tools)

Build in this exact order to avoid dependency issues:

```
Step 1: backend/models/schemas.py          — Pydantic models first
Step 2: backend/services/pdf_service.py    — PDF extraction
Step 3: backend/services/llm_service.py    — NavigateLabs LLM wrapper
Step 4: backend/services/image_service.py  — NavigateLabs Image wrapper
Step 5: backend/services/rag_service.py    — ChromaDB + LangChain RAG
Step 6: backend/routers/health.py          — Simple health check
Step 7: backend/routers/rag.py             — Upload + Ask endpoints
Step 8: backend/routers/summarize.py       — Summarize endpoint
Step 9: backend/routers/poster.py          — Poster generation endpoint
Step 10: backend/main.py                   — Wire all routers together
Step 11: frontend/src/api/client.js        — Axios setup
Step 12: frontend/src/pages/ChatPage.jsx   — Chat + RAG UI
Step 13: frontend/src/pages/SummarizePage.jsx
Step 14: frontend/src/pages/VoicePage.jsx
Step 15: frontend/src/pages/PosterPage.jsx
Step 16: frontend/src/App.jsx              — Tabs + routing
```

---

## 15. Key Things to Tell Your AI Coding Tool

When using any AI coding assistant (give it this context):

> "Build a full-stack student productivity app called StudyMind AI. Use FastAPI for the backend and React + Vite + TailwindCSS for the frontend. The backend has 4 features: (1) PDF upload → RAG Q&A using LangChain + ChromaDB + sentence-transformers embeddings + NavigateLabs LLM API, (2) PDF summarization and revision notes generation via NavigateLabs LLM, (3) AI study poster generation via NavigateLabs Image Gen API, (4) a health check endpoint. The frontend has 4 pages: Chat (PDF Q&A), Summarize, Voice (Web Speech API + SpeechSynthesis), and Poster Generator. Follow the folder structure, endpoint specs, prompts, and build order in the attached spec exactly."

---

## 16. Features Summary (for README/demo)

| Feature | What it does | Tech used |
|---------|-------------|-----------|
| PDF Q&A | Upload notes → ask questions → get context-aware answers | RAG, ChromaDB, LangChain |
| Summarizer | Upload PDF → get summary + bullet revision points | NavigateLabs LLM |
| Voice Assistant | Speak your question → AI answers aloud | Web Speech API, SpeechSynthesis |
| Poster Generator | Type a topic → get an AI-generated study poster | NavigateLabs Image Gen |

---

*Built for Navigate Labs Hackathon — StudyMind AI*
