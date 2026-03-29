import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import client from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const SummarizePage = () => {
  const [sessionId, setSessionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

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

  const handleGenerate = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await client.post('/api/summarize', { session_id: sessionId, mode: 'both' });
      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert('Failed to generate summary: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `SUMMARY:\n${result.summary}\n\nREVISION NOTES:\n${result.revision_notes.map(n => `- ${n}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!sessionId ? (
        <div {...getRootProps()} className={`glass-panel p-12 text-center cursor-pointer border-2 border-dashed transition-all duration-300 ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400'}`}>
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Notes for Summary</h3>
          <p className="text-gray-500">Drop your PDF here to get AI-generated summaries and revision notes.</p>
          {isUploading && <div className="mt-6"><LoadingSpinner message="Processing your PDF..." /></div>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Document Ready</h3>
              <p className="text-gray-500 text-sm">Your PDF has been processed. Generate your study materials below.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSessionId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm">
                Upload New
              </button>
              <button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? 'Generating...' : 'Generate Notes'}
              </button>
            </div>
          </div>

          {isLoading && <LoadingSpinner message="AI is reading and compiling your study notes..." />}

          {result && !isLoading && (
            <div className="glass-panel p-8 space-y-8 animate-fade-in relative">
              <button 
                onClick={copyToClipboard}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              </button>

              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  <span className="text-2xl">📝</span> Executive Summary
                </h3>
                <p className="text-gray-600 leading-relaxed">{result.summary}</p>
              </div>

              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  <span className="text-2xl">✅</span> Revision Checklist
                </h3>
                <ul className="space-y-3">
                  {result.revision_notes.map((note, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <span className="text-brand-500 flex-shrink-0">•</span>
                      <span className="leading-relaxed">{note.replace(/^[-•]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummarizePage;
