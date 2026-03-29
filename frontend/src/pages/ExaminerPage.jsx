import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import client from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const ExaminerPage = () => {
  const [sessionId, setSessionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [question, setQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [transcription, setTranscription] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(new Audio());

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await client.post('/api/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSessionId(res.data.session_id);
    } catch (error) {
      console.error(error);
      alert('Failed to upload PDF: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleStartExam = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setQuestion(null);
    setFeedback(null);
    setTranscription(null);
    
    try {
      const res = await client.post('/api/examiner/question', { session_id: sessionId });
      setQuestion(res.data.question);
      
      if (res.data.audio_b64) {
        audioElementRef.current.src = `data:audio/mp3;base64,${res.data.audio_b64}`;
        audioElementRef.current.play();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to get question: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await submitAnswer(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('Microphone access denied or error: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAnswer = async (blob) => {
    if (!sessionId || !question) return;
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('file', blob, 'answer.wav');
    formData.append('session_id', sessionId);
    formData.append('question', question);
    
    try {
      const res = await client.post('/api/examiner/answer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setTranscription(res.data.transcription);
      setFeedback(res.data.feedback_text);
      
      if (res.data.feedback_audio_b64) {
        audioElementRef.current.src = `data:audio/mp3;base64,${res.data.feedback_audio_b64}`;
        audioElementRef.current.play();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to submit answer: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!sessionId ? (
        <div {...getRootProps()} className={`glass-panel p-12 text-center cursor-pointer border-2 border-dashed transition-all duration-300 ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400'}`}>
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Material for Exam</h3>
          <p className="text-gray-500">Drop your study material here to start the mock interview.</p>
          {isUploading && <div className="mt-6"><LoadingSpinner message="Processing your PDF..." /></div>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Mock Examiner Mode</h3>
              <p className="text-gray-500 text-sm">The AI will ask you a question aloud. Hold the microphone to answer.</p>
            </div>
            {!question && !isLoading && (
              <button onClick={handleStartExam} className="px-6 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-sm">
                Start Exam
              </button>
            )}
          </div>

          {isLoading && <LoadingSpinner message="Thinking..." />}

          {question && !feedback && !isLoading && (
            <div className="glass-panel p-8 text-center space-y-8 animate-fade-in relative">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wide mb-4">Question</span>
                <p className="text-2xl text-gray-800 font-medium leading-relaxed">{question}</p>
              </div>

              <div className="mt-8">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`relative group w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 shadow-xl select-none ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 animate-pulse scale-105' 
                      : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/40 hover:scale-105'
                  }`}
                >
                  {isRecording && <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30"></span>}
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  {isRecording ? 'Listening... Release to submit' : 'Hold mic to speak your answer'}
                </p>
              </div>
            </div>
          )}

          {feedback && !isLoading && (
            <div className="glass-panel p-8 space-y-6 animate-fade-in">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-semibold text-gray-500 mb-1">Question</p>
                <p className="text-gray-800">{question}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-500 mb-1">Your Transcription</p>
                <p className="text-indigo-900">{transcription}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm font-semibold text-green-600 mb-1">AI Feedback</p>
                <p className="text-green-900 leading-relaxed">{feedback}</p>
              </div>
              <div className="pt-4 flex justify-center">
                <button onClick={handleStartExam} className="px-6 py-2 bg-brand-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-sm">
                  Next Question
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExaminerPage;
