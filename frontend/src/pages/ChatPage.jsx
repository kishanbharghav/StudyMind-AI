import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import client from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const ChatPage = () => {
  const [sessionId, setSessionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setMessages([{ role: 'system', content: `Ready! "${file.name}" has been processed. Ask me anything about it.` }]);
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

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await client.post('/api/ask', { question: userMsg, session_id: sessionId });
      setMessages((prev) => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'system', content: 'Error getting answer.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!sessionId ? (
        <div {...getRootProps()} className={`glass-panel p-12 text-center cursor-pointer border-2 border-dashed transition-all duration-300 ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400'}`}>
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Upload your PDF Notes</h3>
          <p className="text-gray-500">Drag & drop a file here, or click to select</p>
          {isUploading && <div className="mt-6"><LoadingSpinner message="Processing your PDF..." /></div>}
        </div>
      ) : (
        <div className="glass-panel flex flex-col h-[600px] overflow-hidden">
          <div className="bg-white/50 border-b border-gray-100 p-4 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Study Chat</h3>
            <button onClick={() => setSessionId(null)} className="text-sm text-gray-500 hover:text-brand-600 font-medium">Upload New File</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-none' 
                    : msg.role === 'system'
                      ? 'bg-gray-100 text-gray-600 mx-auto text-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.role === 'ai' && (
                    <button onClick={() => speakText(msg.content)} className="mt-2 text-brand-600 hover:text-brand-800 py-1.5 px-3 bg-brand-50 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                      </svg>
                      Read aloud
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 text-gray-500 rounded-2xl p-4 rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white/50 border-t border-gray-100">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your notes..."
                className="w-full pl-5 pr-14 py-4 rounded-full border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm bg-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-3 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-md shadow-brand-500/30"
              >
                <svg className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
