import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-brand-600 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
