
import React, { useEffect, useState } from 'react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onViewProfile: (user: User) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, activeTab, setActiveTab, onViewProfile }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [currentUser.credits]);

  const tabs = [
    { id: 'swap', name: 'Hub', icon: '🔄' },
    { id: 'teach', name: 'Teach & Earn', icon: '🎓' },
    { id: 'vault', name: 'Library', icon: '🏛️' },
    { id: 'inbox', name: 'Inbox', icon: '💬' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('swap')}>
              <div className="w-8 h-8 bg-[#a435f0] rounded-sm flex items-center justify-center text-white font-bold text-lg">S</div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">SkillVerse</span>
            </div>

            <div className="hidden md:flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-bold transition-all h-16 relative px-1 ${
                    activeTab === tab.id
                      ? 'text-[#a435f0]'
                      : 'text-slate-600 hover:text-[#a435f0]'
                  }`}
                >
                  {tab.name}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-[#a435f0]"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`hidden sm:flex items-center px-4 py-1 border transition-all duration-500 ${isAnimating ? 'bg-indigo-50 border-indigo-400 scale-105' : 'bg-white border-slate-200'}`}>
              <span className="text-indigo-600 mr-2 text-xs">💎</span>
              <span className={`font-black text-sm ${isAnimating ? 'text-indigo-700' : 'text-slate-700'}`}>
                {currentUser.credits}
              </span>
            </div>
            
            <button 
              onClick={() => onViewProfile(currentUser)}
              className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 hover:ring-2 ring-slate-200 transition-all"
            >
              <img 
                src={currentUser.avatar} 
                alt="My Profile" 
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
