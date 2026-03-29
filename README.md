# StudyMind AI

StudyMind AI is an application featuring a FastAPI backend and a React (Vite) frontend.

## Prerequisites
- **Node.js**: (v16+) for running the frontend.
- **Python**: (3.9+) for running the backend.
- An API Key from Navigate Labs AI.

## Setup Instructions

### 1. Clone the Repository
Download or clone this repository to your local machine:
```bash
git clone <your-repository-url>
cd Studymind-ai
```

### 2. Environment Variables Setup
You will need to set up the environment variables to provide your API keys.

1. In the root directory, create a file named `.env` and copy the contents of `.env.example` into it. Replace `"your_api_key_here"` with your actual Navigate API Key.
2. Similarly, in the `backend` directory, create another `.env` file using the `backend/.env.example` file and add your API key.

---

### 3. Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - On **Windows**:
     ```bash
     .\venv\Scripts\activate
     ```
   - On **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   *Note: If you use the standard setup, the command could also be `.\venv\Scripts\uvicorn.exe main:app --reload` on Windows or `uvicorn` using `uv` if set up that way.* The backend should now be running on `http://127.0.0.1:8000`.

---

### 4. Frontend Setup

1. Open a new, separate terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will typically run on `http://localhost:5173`. Make sure to open the URL provided in your terminal.

## How to Stop the Application
- To stop either the frontend or the backend, simply go to its respective terminal and press `Ctrl + C`.
