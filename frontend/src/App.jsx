import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TabBar from './components/TabBar';
import ChatPage from './pages/ChatPage';
import SummarizePage from './pages/SummarizePage';
import VoicePage from './pages/VoicePage';
import PosterPage from './pages/PosterPage';
import ExaminerPage from './pages/ExaminerPage';

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-6xl mx-auto pb-12">
        <Navbar />
        <TabBar />
        <main className="px-4">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/summarize" element={<SummarizePage />} />
            <Route path="/voice" element={<VoicePage />} />
            <Route path="/poster" element={<PosterPage />} />
            <Route path="/examiner" element={<ExaminerPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
