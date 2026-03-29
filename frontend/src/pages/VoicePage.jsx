import React, { useState, useRef } from 'react';
import client from '../api/client';

const VoicePage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(new Audio());

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ text: msg, type }, ...prev]); // Prepend so latest is top
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      addLog('🎙️ Listening...', 'info');
    } catch (err) {
      console.error(err);
      addLog('❌ Microphone access denied or Error: ' + err.message, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob) => {
    setIsProcessing(true);
    addLog('⏳ Processing your request...', 'info');
    
    const formData = new FormData();
    formData.append('file', blob, 'user_voice.wav');
    
    try {
      const res = await client.post('/api/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { transcribed_text, llm_answer, audio_b64 } = res.data;
      
      addLog(`🗣️ You said: "${transcribed_text}"`, 'user');
      addLog(`🤖 Answer: "${llm_answer}"`, 'ai');
      
      if (audio_b64) {
        const audioSrc = `data:audio/mp3;base64,${audio_b64}`;
        audioElementRef.current.src = audioSrc;
        audioElementRef.current.play();
      }
      
    } catch (error) {
      console.error(error);
      addLog('❌ Error processing request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-panel p-12 text-center relative overflow-hidden">
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Voice Assistant</h2>
          <p className="text-gray-500">Tap to speak, I'll transcribe via Whisper and answer via TTS aloud.</p>
        </div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative group w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all duration-300 shadow-xl ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 animate-pulse' 
              : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/40'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105'}`}
        >
          {isRecording && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30"></span>
          )}
          <svg className={`w-12 h-12 text-white transition-transform ${isRecording ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isRecording ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6v4H9z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>
        
        <p className="mt-6 text-sm font-medium text-gray-500">
          {isRecording ? 'Listening... Tap to stop' : 'Tap mic to start speaking'}
        </p>
      </div>

      <div className="mt-8 glass-panel p-6 h-[300px] overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Conversation Log</h3>
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div key={idx} className={`p-3 rounded-lg text-sm ${
              log.type === 'user' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
              log.type === 'ai' ? 'bg-green-50 text-green-800 border border-green-100' :
              log.type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' :
              'bg-gray-50 text-gray-600 border border-gray-100'
            }`}>
              {log.text}
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No transcripts yet. Start speaking.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoicePage;
