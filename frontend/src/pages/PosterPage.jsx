import React, { useState } from 'react';
import client from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const PosterPage = () => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('educational infographic');
  const [isLoading, setIsLoading] = useState(false);
  const [posterB64, setPosterB64] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setPosterB64(null);

    try {
      const res = await client.post('/api/generate-poster', {
        topic,
        style
      });
      const base64Str = res.data.image_b64;
      const imgSrc = base64Str.startsWith('data:image') ? base64Str : `data:image/png;base64,${base64Str}`;
      setPosterB64(imgSrc);
    } catch (error) {
      console.error(error);
      alert('Failed to generate poster: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!posterB64) return;
    const a = document.createElement('a');
    a.href = posterB64;
    a.download = `${topic.replace(/\s+/g, '_')}_poster.png`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="glass-panel p-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">AI Study Poster Generator</h2>
          <p className="text-gray-500">Transform any complex topic into a beautiful, easy-to-understand educational infographic.</p>
        </div>

        <form onSubmit={handleGenerate} className="flex gap-4 max-w-2xl mx-auto">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., Photosynthesis, Newton's Laws..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm bg-white"
            disabled={isLoading}
          />
          <select 
            value={style} 
            onChange={(e) => setStyle(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm bg-white text-gray-700"
            disabled={isLoading}
          >
            <option value="educational infographic">Infographic</option>
            <option value="minimalist diagram">Minimalist</option>
            <option value="colorful visual">Colorful</option>
            <option value="dark theme sketch">Dark Theme</option>
          </select>
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="px-8 py-3 bg-brand-600 text-white font-medium text-sm rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-brand-500/30 whitespace-nowrap"
          >
            {isLoading ? 'Generating...' : 'Generate Poster'}
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="glass-panel p-12">
          <LoadingSpinner message="🎨 AI is painting your educational poster... This usually takes 10-20 seconds." />
        </div>
      )}

      {posterB64 && !isLoading && (
        <div className="glass-panel p-6 animate-fade-in relative group border border-gray-100">
          <div className="absolute top-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-800 font-medium text-sm rounded-lg hover:bg-white shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Save Image
            </button>
          </div>
          <img 
            src={posterB64} 
            alt={`Study Poster on ${topic}`} 
            className="w-full h-auto rounded-xl shadow-inner"
          />
        </div>
      )}
    </div>
  );
};

export default PosterPage;
