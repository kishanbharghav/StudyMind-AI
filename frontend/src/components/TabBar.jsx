import React from 'react';
import { NavLink } from 'react-router-dom';

const TabBar = () => {
  const tabs = [
    { name: 'Chat', path: '/' },
    { name: 'Summarize', path: '/summarize' },
    { name: 'Voice Assistant', path: '/voice' },
    { name: 'Poster Gen', path: '/poster' },
    { name: 'Examiner Mode', path: '/examiner' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="glass-panel p-1.5 inline-flex gap-1 overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              `px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
