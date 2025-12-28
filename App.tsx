
import React, { useState, useEffect, useCallback, useRef, FC } from 'react';
import Navbar from './components/Navbar';
import SkillBadge from './components/SkillBadge';
import { currentUser as initialUser, peers, resources as initialResources, requests, initialMessages } from './mockData';
import { User, Match, Resource, TeachingRequest, Message, RedemptionRecord } from './types';
import { getAIPeerInsight, generateLessonPlan } from './services/geminiService';

// --- Sub-components defined outside to ensure stable mounting ---

const RatingStars: FC<{ rating?: number; interactive?: boolean; onRate?: (val: number) => void }> = ({ rating = 0, interactive = false, onRate }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1 text-[#b4690e] font-bold text-xs">
      {!interactive && <span>{rating.toFixed(1)}</span>}
      <div className="flex text-amber-400">
        {[...Array(5)].map((_, i) => {
          const starIdx = i + 1;
          const isFilled = interactive ? (hover || rating) >= starIdx : rating >= starIdx;
          return (
            <svg 
              key={i} 
              onClick={() => interactive && onRate && onRate(starIdx)}
              onMouseEnter={() => interactive && setHover(starIdx)}
              onMouseLeave={() => interactive && setHover(0)}
              className={`w-3 h-3 ${isFilled ? 'fill-current' : 'fill-slate-200'} ${interactive ? 'cursor-pointer hover:scale-125 transition-transform' : ''}`} 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>
    </div>
  );
};

const ConfirmationModal: FC<{
  resource: Resource | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ resource, onCancel, onConfirm }) => {
  if (!resource) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-3xl border border-slate-100 animate-slide-up">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-[28px] flex items-center justify-center text-3xl mx-auto">🗝️</div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Unlock Content?</h3>
            <p className="text-slate-500 font-medium">
              You are about to redeem <span className="text-indigo-600 font-black">{resource.cost} credits</span> for "{resource.title}".
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-[#a435f0] text-white font-black rounded-2xl hover:bg-[#8710d8] transition-all shadow-xl shadow-[#a435f0]/20 uppercase text-xs tracking-widest"
            >
              Confirm Redemption
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResourceViewModal: FC<{
  resource: Resource | null;
  onClose: () => void;
  onRate: (rating: number) => void;
}> = ({ resource, onClose, onRate }) => {
  if (!resource) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[48px] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#a435f0]/10 rounded-2xl flex items-center justify-center text-2xl">📚</div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{resource.title}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">by {resource.author}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
           <div className="max-w-2xl mx-auto space-y-10">
              <div className="aspect-video rounded-[32px] overflow-hidden shadow-2xl border-4 border-white bg-slate-200">
                 <img src={resource.thumbnail} className="w-full h-full object-cover" alt={resource.title} />
              </div>
              <div className="prose prose-slate max-w-none">
                 <h4 className="text-2xl font-black text-slate-900 mb-6 underline decoration-[#a435f0]/20 underline-offset-8">Curriculum Content</h4>
                 <p className="text-slate-600 leading-[1.8] text-lg font-medium whitespace-pre-wrap">{resource.content || "Generating detailed curriculum notes..."}</p>
              </div>
           </div>
        </div>

        <div className="px-10 py-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Rate your experience:</span>
              <RatingStars interactive onRate={onRate} />
           </div>
           <button onClick={onClose} className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-[#a435f0] transition-all">Done Studying</button>
        </div>
      </div>
    </div>
  );
};

const TutorialOverlay: FC<{
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}> = ({ step, totalSteps, onNext, onPrev, onSkip }) => {
  const stepContent = [
    { title: "Welcome to SkillVerse!", desc: "This is your decentralized home for learning. No money required—just trade your curiosity for community expertise.", icon: "👋" },
    { title: "The Swap Hub", desc: "Connect with peers who possess the skills you seek. If they want what you know, it's a perfect match! Propose a swap and start learning.", icon: "🔄" },
    { title: "Teach & Earn", desc: "Help others by fulfilling teaching requests. Every session you host earns you SkillCredits (💎), which power your access to the Library.", icon: "🎓" },
    { title: "The Vault", desc: "Redeem your hard-earned credits here for high-quality recorded content, detailed notes, and curated guides shared by the community.", icon: "🏛️" }
  ];
  const current = stepContent[step];
  return (
    <div className="fixed inset-0 z-[150] pointer-events-none flex items-end justify-center pb-12 sm:items-center sm:pb-0 sm:justify-end sm:pr-12">
      <div className="w-full max-w-sm bg-[#1c1d1f] text-white p-8 rounded-[32px] shadow-2xl pointer-events-auto border border-white/10 animate-slide-up">
        <div className="flex justify-between items-start mb-6"><div className="text-4xl">{current.icon}</div><button onClick={onSkip} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Skip Tutorial</button></div>
        <div className="space-y-3 mb-8"><h4 className="text-xl font-black tracking-tight">{current.title}</h4><p className="text-sm text-slate-400 font-medium leading-relaxed">{current.desc}</p></div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">{stepContent.map((_, i) => (<div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#a435f0]' : 'w-2 bg-slate-700'}`}></div>))}</div>
          <div className="flex gap-3">
            {step > 0 && (<button onClick={onPrev} className="p-3 text-slate-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>)}
            <button onClick={onNext} className="bg-[#a435f0] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#8710d8] shadow-lg shadow-[#a435f0]/20 transition-all">{step === totalSteps - 1 ? "Finish" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthScreen: FC<{
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  formData: any;
  setFormData: (data: any) => void;
  onAuth: (e: React.FormEvent) => void;
}> = ({ authMode, setAuthMode, formData, setFormData, onAuth }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-['Plus_Jakarta_Sans'] relative overflow-hidden px-4">
    {/* Animated background elements */}
    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#a435f0] opacity-[0.03] blur-[100px] rounded-full animate-pulse"></div>
    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#6366f1] opacity-[0.03] blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

    <div className="w-full max-w-[420px] bg-white rounded-[40px] shadow-2xl shadow-indigo-500/10 border border-slate-100 p-10 animate-slide-up relative z-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#a435f0] rounded-[22px] flex items-center justify-center text-white font-black text-2xl mx-auto mb-6 shadow-xl shadow-[#a435f0]/30 transform rotate-3">S</div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          {authMode === 'login' ? 'Welcome back' : 'Create Account'}
        </h2>
        <p className="text-slate-500 font-medium text-sm">
          {authMode === 'login' ? 'Glad to see you again!' : 'Join the global community of students'}
        </p>
      </div>

      <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8">
        <button 
          onClick={() => setAuthMode('login')} 
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${authMode === 'login' ? 'bg-white text-[#a435f0] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sign In
        </button>
        <button 
          onClick={() => setAuthMode('signup')} 
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${authMode === 'signup' ? 'bg-white text-[#a435f0] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={onAuth} className="space-y-5">
        {authMode === 'signup' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#a435f0]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <input 
                type="text" required 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all placeholder:text-slate-300 font-medium" 
                placeholder="Alex Rivera" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#a435f0]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
            <input 
              type="email" required 
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all placeholder:text-slate-300 font-medium" 
              placeholder="alex@example.edu" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#a435f0]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
            <input 
              type="password" required 
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-14 pr-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all placeholder:text-slate-300 font-medium" 
              placeholder="••••••••" 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
        </div>

        {authMode === 'login' && (
          <div className="text-right">
            <button type="button" className="text-[10px] font-black text-[#a435f0] hover:text-[#8710d8] uppercase tracking-widest">Forgot Password?</button>
          </div>
        )}

        <button type="submit" className="w-full py-5 bg-[#a435f0] text-white font-black rounded-[20px] hover:bg-[#8710d8] hover:-translate-y-1 transition-all shadow-xl shadow-[#a435f0]/20 mt-4 text-xs uppercase tracking-[0.2em]">
          {authMode === 'login' ? 'Get Started' : 'Create My Account'}
        </button>
      </form>

      <div className="relative mt-10 mb-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="px-4 bg-white text-slate-400">Or continue with</span></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button className="flex justify-center items-center py-4 bg-white border-2 border-slate-50 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
          </svg>
        </button>
        <button className="flex justify-center items-center py-4 bg-white border-2 border-slate-50 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
          </svg>
        </button>
        <button className="flex justify-center items-center py-4 bg-white border-2 border-slate-50 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="#0A66C2" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        </button>
      </div>

      <p className="text-center mt-10 text-[10px] text-slate-400 font-medium">
        By signing up, you agree to our <button type="button" className="font-black text-slate-900 underline underline-offset-2">Terms of Service</button> and <button type="button" className="font-black text-slate-900 underline underline-offset-2">Privacy Policy</button>.
      </p>
    </div>
  </div>
);

const OnboardingScreen: FC<{
  formData: any;
  setFormData: (data: any) => void;
  onComplete: (e: React.FormEvent) => void;
}> = ({ formData, setFormData, onComplete }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="w-full max-w-xl bg-white p-12 shadow-2xl rounded-[40px] border border-slate-100 animate-slide-up">
      <div className="text-center mb-12"><div className="w-20 h-20 bg-[#a435f0]/10 rounded-[28px] flex items-center justify-center text-[#a435f0] text-4xl mb-6 mx-auto">🚀</div><h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Build your profile</h2><p className="text-slate-500 font-medium text-lg">Help us match you with the right learning partners.</p></div>
      <form onSubmit={onComplete} className="space-y-8">
        <div className="space-y-6">
           <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 ml-1">What can you teach others?</label><input type="text" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl px-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all" placeholder="Python, UI Design, Guitar..." value={formData.knows} onChange={e => setFormData({...formData, knows: e.target.value})} /><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Separate with commas</p></div>
            <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 ml-1">What are you eager to learn?</label><input type="text" required className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl px-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all" placeholder="React, French, Quantum Physics..." value={formData.wants} onChange={e => setFormData({...formData, wants: e.target.value})} /></div>
            <div className="space-y-2"><label className="block text-sm font-bold text-slate-700 ml-1">About you</label><textarea className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl px-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all resize-none" placeholder="Share your learning journey..." rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /></div>
        </div>
        <button type="submit" className="w-full py-5 bg-[#a435f0] text-white font-black rounded-2xl hover:bg-[#8710d8] hover:-translate-y-1 transition-all shadow-2xl shadow-[#a435f0]/30 flex items-center justify-center gap-3 group">Enter SkillVerse<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></button>
      </form>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState('swap');
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [insight, setInsight] = useState<{ [key: string]: string }>({});
  const [selectedLesson, setSelectedLesson] = useState<{skill: string, plan: string} | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [confirmingResource, setConfirmingResource] = useState<Resource | null>(null);
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [allResources, setAllResources] = useState<Resource[]>(initialResources);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Profile sub-tabs
  const [profileTab, setProfileTab] = useState<'overview' | 'history'>('overview');

  const [customTeachSkill, setCustomTeachSkill] = useState('');
  const [isGeneratingCustomPlan, setIsGeneratingCustomPlan] = useState(false);

  const [allMessages, setAllMessages] = useState<{ [pairId: string]: Message[] }>(initialMessages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', bio: '', knows: '', wants: ''
  });

  useEffect(() => {
    if (!isAuthenticated || isOnboarding) return;
    const foundMatches: Match[] = peers.map(peer => {
      const peerWantsUserKnows = peer.wants.some(s => user.knows.includes(s));
      const userWantsPeerKnows = user.wants.some(s => peer.knows.includes(s));
      const sharedInterests = peer.knows.filter(s => user.wants.includes(s));
      if (peerWantsUserKnows && userWantsPeerKnows) return { id: `m-${peer.id}`, peer, type: 'perfect_swap', sharedInterests } as Match;
      return { id: `m-${peer.id}`, peer, type: 'one_way', sharedInterests } as Match;
    }).filter(m => m.type === 'perfect_swap' || m.sharedInterests.length > 0);
    setMatches(foundMatches);
  }, [user, isAuthenticated, isOnboarding]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, activeConversationId, activeTab]);

  const filteredMatches = matches.filter(match => {
    const query = searchQuery.toLowerCase();
    return match.peer.name.toLowerCase().includes(query) || match.peer.knows.some(s => s.toLowerCase().includes(query)) || match.peer.wants.some(s => s.toLowerCase().includes(query));
  });

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') { setIsAuthenticated(true); setIsOnboarding(true); } else { setIsAuthenticated(true); showNotification(`Welcome back, ${user.name}!`); }
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: 'u-custom', name: formData.name || 'New Student', avatar: `https://picsum.photos/seed/${formData.name}/200/200`, knows: formData.knows.split(',').map(s => s.trim()).filter(Boolean), wants: formData.wants.split(',').map(s => s.trim()).filter(Boolean), credits: 5, bio: formData.bio || 'Eager to learn and share knowledge.', redeemedResources: [], purchaseHistory: []
    };
    setUser(newUser); setIsOnboarding(false); setIsTutorialActive(true); showNotification(`Welcome to SkillVerse, ${newUser.name}!`);
  };

  const handleTutorialNext = () => {
    if (tutorialStep === 3) { setIsTutorialActive(false); showNotification("You're all set! Enjoy SkillVerse."); return; }
    const next = tutorialStep + 1; setTutorialStep(next);
    if (next === 1) setActiveTab('swap'); if (next === 2) setActiveTab('teach'); if (next === 3) setActiveTab('vault');
  };

  const handleTutorialPrev = () => {
    if (tutorialStep === 0) return;
    const prev = tutorialStep - 1; setTutorialStep(prev);
    if (prev === 0) setActiveTab('swap'); if (prev === 1) setActiveTab('swap'); if (prev === 2) setActiveTab('teach'); if (prev === 3) setActiveTab('vault');
  };

  const handleTeach = async (request: TeachingRequest) => {
    const plan = await generateLessonPlan(request.skillNeeded);
    setSelectedLesson({ skill: request.skillNeeded, plan: plan || "No plan generated." });
    showNotification(`Lesson plan ready for ${request.studentName}!`);
  };

  const handleCustomTeach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTeachSkill.trim()) return;
    setIsGeneratingCustomPlan(true);
    const plan = await generateLessonPlan(customTeachSkill);
    setSelectedLesson({ skill: customTeachSkill, plan: plan || "No plan generated." });
    setCustomTeachSkill('');
    setIsGeneratingCustomPlan(false);
    showNotification(`New curriculum generated for ${customTeachSkill}!`);
  };

  const handleConfirmPurchase = () => {
    if (!confirmingResource) return;
    if (user.credits < confirmingResource.cost) { showNotification("Insufficient credits! Host a session to earn more."); setConfirmingResource(null); return; }
    
    const record: RedemptionRecord = {
      resourceId: confirmingResource.id,
      timestamp: Date.now(),
      cost: confirmingResource.cost
    };

    setUser(prev => ({ 
      ...prev, 
      credits: prev.credits - confirmingResource.cost, 
      redeemedResources: [...prev.redeemedResources, confirmingResource.id],
      purchaseHistory: [record, ...prev.purchaseHistory]
    }));
    
    showNotification(`Unlocked: ${confirmingResource.title}. Added to your study vault.`);
    setConfirmingResource(null);
  };

  const handleRateResource = (resourceId: string, rating: number) => {
    setAllResources(prev => prev.map(r => {
      if (r.id === resourceId) {
        const currentTotal = r.totalRatings || 1;
        const currentAvg = r.rating || 0;
        const newTotal = currentTotal + 1;
        const newAvg = ((currentAvg * currentTotal) + rating) / newTotal;
        return { ...r, rating: newAvg, totalRatings: newTotal };
      }
      return r;
    }));
    showNotification("Thank you for your rating!");
  };

  const handleSharePlan = () => {
    if (!selectedLesson) return;
    setIsPublishing(true);
    setTimeout(() => {
      const newPlan: Resource = {
        id: `lp-${Date.now()}`, title: `${selectedLesson.skill} Mastery Guide`, author: user.name, authorId: user.id, type: 'lesson_plan', cost: 1, category: 'Community', thumbnail: `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80`, rating: 5.0, totalRatings: 1, enrolled: 1, content: selectedLesson.plan
      };
      setAllResources(prev => [newPlan, ...prev]); setIsPublishing(false); showNotification("Success! Your lesson plan is now live.");
    }, 1500);
  };

  const showNotification = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const completeTeaching = (reward: number) => { setUser(prev => ({ ...prev, credits: prev.credits + reward })); showNotification(`Success! You earned ${reward} credits.`); };
  const handleSendMessage = (e?: React.FormEvent) => { e?.preventDefault(); if (!newMessage.trim() || !activeConversationId) return; const msg: Message = { id: Math.random().toString(36).substr(2, 9), senderId: user.id, text: newMessage, timestamp: Date.now() }; setAllMessages(prev => ({ ...prev, [activeConversationId]: [...(prev[activeConversationId] || []), msg] })); setNewMessage(''); };
  const startConversation = (peer: User) => { setActiveConversationId(peer.id); setActiveTab('inbox'); setViewingProfile(null); };

  const handleResourceCardClick = (res: Resource) => {
    if (user.redeemedResources.includes(res.id) || res.authorId === user.id) {
       setViewingResource(res);
    } else {
       setConfirmingResource(res);
    }
  };

  const renderProfileView = (profile: User) => (
    <div className="animate-fade-in space-y-12 pb-20">
      <div className="bg-slate-900 text-white p-12 rounded-[48px] flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="relative z-10 w-48 h-48 rounded-[48px] overflow-hidden border-4 border-white/20 shadow-2xl">
          <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
        </div>
        <div className="relative z-10 space-y-6 flex-1 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-5xl font-black tracking-tight">{profile.name}</h2>
            <p className="text-xl text-slate-400 font-medium">{profile.bio}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">SkillCredits</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-indigo-400">{profile.credits}💎</span>
              </div>
            </div>
            <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Matches Found</span>
              <span className="text-lg font-black">{matches.length} Peers</span>
            </div>
          </div>
          {profile.id !== user.id ? (
            <button 
              onClick={() => startConversation(profile)}
              className="bg-[#a435f0] hover:bg-[#8710d8] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-[#a435f0]/30 hover:-translate-y-1"
            >
              Send Message
            </button>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={() => setProfileTab('overview')}
                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${profileTab === 'overview' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                Profile Overview
              </button>
              <button 
                onClick={() => setProfileTab('history')}
                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${profileTab === 'history' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                Redemption History
              </button>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#a435f0] opacity-10 blur-[120px] rounded-full"></div>
      </div>
      
      {profileTab === 'overview' ? (
        <div className="grid md:grid-cols-2 gap-12 animate-fade-in">
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900">Knowledge Base</h3>
            <div className="bg-white p-10 rounded-[32px] border-2 border-slate-50 shadow-sm flex flex-wrap gap-3">
              {profile.knows.map(s => <SkillBadge key={s} label={s} variant="knows" />)}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900">Eager to Learn</h3>
            <div className="bg-white p-10 rounded-[32px] border-2 border-slate-50 shadow-sm flex flex-wrap gap-3">
              {profile.wants.map(s => <SkillBadge key={s} label={s} variant="wants" />)}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-8">
          <h3 className="text-2xl font-black text-slate-900">Learning Ledger</h3>
          <div className="bg-white rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden">
            {profile.purchaseHistory.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {profile.purchaseHistory.map((record, i) => {
                  const resource = allResources.find(r => r.id === record.resourceId);
                  if (!resource) return null;
                  return (
                    <div key={i} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-10 rounded-xl overflow-hidden bg-slate-100">
                          <img src={resource.thumbnail} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 group-hover:text-[#a435f0] transition-colors">{resource.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unlocked on {new Date(record.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-indigo-600">-{record.cost}💎</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center space-y-6">
                <div className="text-6xl opacity-10">🏛️</div>
                <p className="font-black uppercase tracking-[0.2em] text-slate-300 text-sm">You haven't unlocked any content yet</p>
                <button onClick={() => setActiveTab('vault')} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#a435f0] transition-all">Browse Library</button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => { setViewingProfile(null); setProfileTab('overview'); }}
        className="text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest flex items-center gap-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>
    </div>
  );

  const renderInboxView = () => (
    <div className="h-[calc(100vh-180px)] bg-white border-2 border-slate-50 rounded-[48px] shadow-sm flex overflow-hidden animate-fade-in">
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-8 border-b border-slate-100"><h3 className="text-xl font-black text-slate-900 tracking-tight">Messages</h3></div>
        <div className="flex-1 overflow-y-auto">
          {peers.map(peer => {
            const lastMsg = allMessages[peer.id]?.slice(-1)[0];
            return (
              <button 
                key={peer.id}
                onClick={() => setActiveConversationId(peer.id)}
                className={`w-full p-6 flex items-center gap-4 transition-all hover:bg-white ${activeConversationId === peer.id ? 'bg-white shadow-lg z-10' : ''}`}
              >
                <img src={peer.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-md" alt={peer.name} />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm truncate">{peer.name}</p>
                  <p className="text-xs text-slate-400 truncate font-medium">{lastMsg?.text || "No messages yet"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {activeConversationId ? (
          <>
            <div className="p-8 border-b border-slate-100 flex items-center gap-4">
              <img src={peers.find(p => p.id === activeConversationId)?.avatar} className="w-10 h-10 rounded-xl object-cover" alt="Avatar" />
              <h4 className="font-black text-slate-900">{peers.find(p => p.id === activeConversationId)?.name}</h4>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {allMessages[activeConversationId]?.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-6 py-4 rounded-[24px] text-sm font-medium shadow-sm ${
                    msg.senderId === user.id 
                      ? 'bg-[#a435f0] text-white rounded-br-none' 
                      : 'bg-slate-100 text-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-8 border-t border-slate-100 flex gap-4">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" className="bg-[#a435f0] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#8710d8] shadow-lg shadow-[#a435f0]/20 transition-all">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6">
            <div className="text-8xl opacity-20">💬</div>
            <p className="font-black uppercase tracking-[0.2em] text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <AuthScreen 
      authMode={authMode} 
      setAuthMode={setAuthMode} 
      formData={formData} 
      setFormData={setFormData} 
      onAuth={handleAuth} 
    />
  );

  if (isOnboarding) return (
    <OnboardingScreen 
      formData={formData} 
      setFormData={setFormData} 
      onComplete={handleCompleteOnboarding} 
    />
  );

  return (
    <div className="min-h-screen pb-20 bg-white font-['Plus_Jakarta_Sans']">
      <Navbar currentUser={user} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setViewingProfile(null); setSearchQuery(''); }} onViewProfile={setViewingProfile} />
      <ConfirmationModal resource={confirmingResource} onCancel={() => setConfirmingResource(null)} onConfirm={handleConfirmPurchase} />
      <ResourceViewModal resource={viewingResource} onClose={() => setViewingResource(null)} onRate={(val) => viewingResource && handleRateResource(viewingResource.id, val)} />
      {isTutorialActive && <TutorialOverlay step={tutorialStep} totalSteps={4} onNext={handleTutorialNext} onPrev={handleTutorialPrev} onSkip={() => setIsTutorialActive(false)} />}
      {notification && (<div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-slide-up"><div className="bg-[#1c1d1f] text-white px-10 py-5 shadow-2xl rounded-2xl text-sm font-black border-l-8 border-[#a435f0] uppercase tracking-widest">{notification}</div></div>)}

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {viewingProfile ? renderProfileView(viewingProfile) : (
          <>{activeTab === 'inbox' ? renderInboxView() : (
              <div className="animate-fade-in">
                {activeTab === 'swap' && (
                  <section className="space-y-12">
                    <header className={`flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100 pb-12 transition-all ${isTutorialActive && tutorialStep === 1 ? 'ring-4 ring-[#a435f0] ring-offset-8 rounded-3xl p-4' : ''}`}><div className="space-y-2"><h1 className="text-4xl font-black text-slate-900 tracking-tight">Swap Hub</h1><p className="text-slate-500 text-xl font-medium">Find students ready to trade their skills with yours.</p></div><div className="relative w-full md:w-[400px]"><input type="text" placeholder="Search skills or names..." className="block w-full border-2 border-slate-100 bg-slate-50 rounded-2xl px-8 py-5 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></header>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                      {filteredMatches.map(match => (
                        <div key={match.id} className="group bg-white border-2 border-slate-50 hover:border-slate-200 transition-all rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2">
                          <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative"><img src={match.peer.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={match.peer.name} />{match.type === 'perfect_swap' && <div className="absolute top-4 right-4 bg-[#a435f0] text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg">Perfect Swap</div>}</div>
                          <div className="p-7">
                            <h3 className="font-black text-slate-900 text-lg line-clamp-1">{match.peer.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 truncate font-bold uppercase tracking-widest">{match.peer.bio}</p>
                            <div className="mt-8 space-y-6">
                               <div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Mastery</p><div className="flex flex-wrap gap-1.5">{match.peer.knows.slice(0, 3).map(s => <SkillBadge key={s} label={s} variant="knows" />)}</div></div>
                               <div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Wants</p><div className="flex flex-wrap gap-1.5">{match.peer.wants.slice(0, 3).map(s => <SkillBadge key={s} label={s} variant="wants" />)}</div></div>
                            </div>
                            <button onClick={() => startConversation(match.peer)} className="w-full mt-8 py-4 bg-[#1c1d1f] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#a435f0] transition-all rounded-2xl shadow-xl shadow-slate-200">Propose Match</button>
                          </div>
                        </div>))}
                    </div>
                  </section>
                )}
                {activeTab === 'teach' && (
                  <section className="space-y-12">
                    <div className="bg-[#1c1d1f] text-white p-16 rounded-[40px] shadow-3xl relative overflow-hidden group"><h1 className="text-5xl font-black mb-6 relative z-10 leading-tight">Empower peers, <br /><span className="bg-gradient-to-r from-[#a435f0] to-[#c084fc] bg-clip-text text-transparent underline decoration-white/20 underline-offset-8">Fund your growth.</span></h1><p className="text-xl opacity-70 max-w-2xl font-medium relative z-10">Every session you host earns you SkillCredits. Use them to unlock the community's highest-rated educational archives.</p><div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-[#a435f0]/20 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000"></div></div>
                    
                    <div className="grid lg:grid-cols-3 gap-12">
                      <div className={`lg:col-span-2 space-y-6 transition-all ${isTutorialActive && tutorialStep === 2 ? 'ring-4 ring-[#a435f0] ring-offset-8 rounded-[40px] p-4 bg-slate-50' : ''}`}>
                        
                        {/* New Feature: Manual Lesson Plan Generation */}
                        <div className="bg-white border-2 border-dashed border-slate-200 p-10 rounded-[32px] mb-10 transition-all hover:border-[#a435f0]/50">
                          <h3 className="text-xl font-black text-slate-900 mb-6">Want to teach something specific?</h3>
                          <form onSubmit={handleCustomTeach} className="flex flex-col sm:flex-row gap-4">
                            <input 
                              type="text" 
                              placeholder="Enter a skill (e.g. Docker, Photography...)" 
                              className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm focus:border-[#a435f0] focus:bg-white outline-none transition-all font-medium"
                              value={customTeachSkill}
                              onChange={(e) => setCustomTeachSkill(e.target.value)}
                            />
                            <button 
                              type="submit" 
                              disabled={isGeneratingCustomPlan || !customTeachSkill.trim()}
                              className="bg-[#a435f0] text-white px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-[#8710d8] rounded-2xl transition-all shadow-lg shadow-[#a435f0]/20 disabled:opacity-50 whitespace-nowrap"
                            >
                              {isGeneratingCustomPlan ? "Generating..." : "Generate Lesson Plan"}
                            </button>
                          </form>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Urgent Requests</h2>
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Updated 1m ago</span>
                        </div>
                        {requests.map(req => (<div key={req.id} className="border-2 border-slate-50 p-10 rounded-[32px] flex items-center justify-between hover:bg-slate-50 transition-all group shadow-sm hover:shadow-xl"><div className="flex items-center gap-6"><div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-[#a435f0] flex items-center justify-center font-black text-white rounded-2xl text-2xl shadow-lg">{req.studentName.charAt(0)}</div><div><h4 className="font-black text-slate-900 text-xl">{req.studentName}</h4><p className="text-base text-slate-500 font-medium">Needs help with <span className="text-[#a435f0] font-black underline decoration-[#a435f0]/20 underline-offset-4">#{req.skillNeeded}</span></p></div></div><div className="flex items-center gap-12"><div className="text-right"><span className="text-3xl font-black text-indigo-600">{req.reward}💎</span><p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">Reward</p></div><button onClick={() => handleTeach(req)} className="bg-slate-900 text-white px-10 py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-[#a435f0] rounded-2xl transition-all shadow-xl hover:-translate-y-1">Accept</button></div></div>))}
                      </div>

                      <div className="bg-white border-2 border-slate-50 p-10 rounded-[40px] shadow-sm h-fit space-y-8 sticky top-24"><div className="flex items-center justify-between"><h3 className="text-xl font-black text-slate-900">AI Tutor</h3><span className="w-3 h-3 bg-[#a435f0] rounded-full animate-ping"></span></div>{selectedLesson ? (<div className="space-y-8 animate-fade-in"><div className="bg-slate-50 p-8 border-2 border-slate-100 rounded-3xl text-sm leading-relaxed max-h-[450px] overflow-y-auto whitespace-pre-wrap font-medium text-slate-600 shadow-inner">{selectedLesson.plan}</div><div className="grid gap-4"><button onClick={() => completeTeaching(3)} className="w-full py-5 bg-[#a435f0] text-white font-black rounded-2xl hover:bg-[#8710d8] shadow-2xl shadow-[#a435f0]/30 transition-all uppercase text-[11px] tracking-[0.2em]">Complete Session</button><button onClick={handleSharePlan} disabled={isPublishing} className="w-full py-5 bg-white border-2 border-slate-900 font-black hover:bg-slate-50 text-[11px] rounded-2xl disabled:opacity-50 uppercase tracking-[0.2em]">{isPublishing ? "Publishing..." : "Share & Earn 💎"}</button></div></div>) : <div className="text-center py-24 text-slate-300 space-y-6"><div className="text-7xl opacity-20 transform hover:scale-110 transition-transform cursor-default">⚡</div><p className="text-sm font-black uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">Accept a request or enter a skill above to ignite the AI curriculum generator.</p></div>}</div>
                    </div>
                  </section>
                )}
                {activeTab === 'vault' && (
                  <section className="space-y-12">
                    <header className={`border-b border-slate-100 pb-12 transition-all ${isTutorialActive && tutorialStep === 3 ? 'ring-4 ring-[#a435f0] ring-offset-8 rounded-[40px] p-4' : ''}`}><h1 className="text-4xl font-black text-slate-900 tracking-tight">The Vault</h1><p className="text-slate-500 text-xl font-medium mt-2">Redeem your hard-earned credits for premium community-led mastery paths.</p></header>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
                      {allResources.map(res => {
                        const isOwned = user.redeemedResources.includes(res.id) || res.authorId === user.id;
                        return (
                          <div key={res.id} className="group cursor-pointer" onClick={() => handleResourceCardClick(res)}>
                            <div className="aspect-video relative overflow-hidden rounded-[32px] border-2 border-slate-50 shadow-sm transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
                              <img src={res.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={res.title} />
                              {isOwned && (
                                <div className="absolute inset-0 bg-[#1c1d1f]/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <span className="bg-white text-slate-900 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Study Now</span>
                                </div>
                              )}
                              {!isOwned && <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                            </div>
                            <div className="py-6 space-y-3">
                              <h4 className="font-black text-slate-900 text-lg line-clamp-2 leading-snug">{res.title}</h4>
                              <div className="flex items-center justify-between"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{res.author}</p><RatingStars rating={res.rating} /></div>
                              <div className="flex items-center gap-3 pt-2">
                                {isOwned ? (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2.5 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">Owned ✓</span>
                                ) : (
                                  <span className="font-black text-base text-indigo-600">{res.cost} 💎</span>
                                )}
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">{res.type.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}</>
        )}
      </main>
    </div>
  );
};

export default App;
