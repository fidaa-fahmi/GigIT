import { useState } from 'react';
import { AppView, Gig } from './types';
import { initialGigs } from './data';
import LandingView from './components/LandingView';
import EmployerDashboardView from './components/EmployerDashboardView';
import WorkerBrowseView from './components/WorkerBrowseView';
import WorkerReliabilityView from './components/WorkerReliabilityView';
import { Users, User, X, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, logOut, signInWithGoogle } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.Landing);
  const [gigs, setGigs] = useState<Gig[]>(initialGigs);
  const [showSelector, setShowSelector] = useState(false);

  // Common function to add custom gigs posted by Maria (Employer)
  const handleAddGig = (newGig: Gig) => {
    setGigs(prev => [newGig, ...prev]);
  };

  const handleRoleSelect = (view: AppView) => {
    setCurrentView(view);
    setShowSelector(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased transition-colors">
      {/* Route Views Switches */}
      <div>
        {currentView === AppView.Landing && (
          <LandingView 
            onNavigate={setCurrentView} 
            onOpenSelector={() => setShowSelector(true)} 
          />
        )}

        {currentView === AppView.EmployerDashboard && (
          <EmployerDashboardView 
            onNavigate={setCurrentView} 
            gigs={gigs}
            onAddGig={handleAddGig}
          />
        )}

        {currentView === AppView.WorkerBrowse && (
          <WorkerBrowseView 
            onNavigate={setCurrentView} 
            gigs={gigs} 
          />
        )}

        {currentView === AppView.WorkerReliability && (
          <WorkerBrowseView 
            onNavigate={setCurrentView} 
            gigs={gigs}
            initialTab="Reliability"
          />
        )}
      </div>

      {/* Quick Role Access Dialog */}
      <AnimatePresence>
        {showSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-outline-variant"
              id="workspace-switcher-modal"
            >
              <div className="px-6 py-5 border-b border-outline-variant bg-surface flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">sync_alt</span>
                  <h3 className="font-sans font-bold text-base text-primary mr-2">Switch Active Workspace</h3>
                </div>
                <button 
                  onClick={() => setShowSelector(false)} 
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
                  id="close-switcher-btn"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  Choose your active view to navigate GigIT as either a verified student worker or a local business manager:
                </p>

                <div className="space-y-3">
                  {/* Option 1: Worker */}
                  <div 
                    onClick={() => handleRoleSelect(AppView.WorkerBrowse)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                      currentView === AppView.WorkerBrowse || currentView === AppView.WorkerReliability
                        ? 'border-primary bg-primary/5' 
                        : 'border-outline-variant/60 hover:border-primary/55 bg-surface-container-lowest'
                    }`}
                    id="worker-profile-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant">
                        <img 
                          alt="Ahmad Rosli" 
                          className="w-full h-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR_yuEE9W4djP9NUe9iDVsrhbbqm4c33mAlfDjziC8BLi_t74hQq-KG0VktJpJg9e--D2XO_NUJzmL5quEgka7Um1OL0iazTpJDBk71rPxSF_7N91D4ACo2dyhpbQaQodHH1Y8V3o4TIlrZgWRvHjAC2X9e_dr4LNN0WjGpn_X8vOC3xbjAaAMLbuwKZJKr3YOmYSEML-QJ8N2QRPq864qy9TCjIv8nbsuGkNHlZbRcD8MLFgVDmT-5MVc6EdJ2JyyGQ_SQlnRwWQ" 
                        />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">Ahmad Rosli (Student Worker)</p>
                        <p className="text-[10px] text-on-surface-variant">UMS Sabah College • Account Active</p>
                      </div>
                    </div>
                    {(currentView === AppView.WorkerBrowse || currentView === AppView.WorkerReliability) && (
                      <Check size={16} className="text-primary font-bold" />
                    )}
                  </div>

                  {/* Option 2: Employer */}
                  <div 
                    onClick={() => handleRoleSelect(AppView.EmployerDashboard)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                      currentView === AppView.EmployerDashboard 
                        ? 'border-primary bg-primary/5' 
                        : 'border-outline-variant/60 hover:border-primary/55 bg-surface-container-lowest'
                    }`}
                    id="employer-profile-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline-variant">
                        <img 
                          alt="Maria Manager" 
                          className="w-full h-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuArlkh8-LRzjsQ5aRbsLAeGaHCHMzCiX7slvulwgFNbafUydbCB8q533tkOZVnPrAcL0Tipwd9u_hGs_JSQEwZOzZmWmQ-0UT9sNNJ4XXK0ka9XNDUxr3QRBlQw2nqJxFQm0tA7ZjKb3ascTvRZDv7oWN_zjqb6sSdnPO4uPDqCHU04N9eo7oL8mE7XpzvrAqHziltAMM0XWqDAjGLCSpQBEsONsiX0twIPZC-sLYfN3B7i4qnfRTFV1nx_zMYcUo725YqWhzYxpxU" 
                        />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">Manager Maria (SME Owner)</p>
                        <p className="text-[10px] text-on-surface-variant">KK Cafe Proprietor • Merchant Account</p>
                      </div>
                    </div>
                    {currentView === AppView.EmployerDashboard && (
                      <Check size={16} className="text-primary font-bold" />
                    )}
                  </div>
                </div>

                {/* Google Sign In Integration */}
                <div className="border-t border-outline-variant pt-4">
                  {!user ? (
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-4 text-left space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-indigo-900 tracking-wider uppercase font-sans">Akaun Bersepadu ID</span>
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase font-mono">Firebase</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal font-sans font-medium">
                        Log masuk menggunakan Google untuk mendaftar profil, menjejak ganjaran mikro-gig DuitNow & semakan Kad Matrik.
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            await signInWithGoogle();
                          } catch (e) {
                            console.error("Manual Google Login Error in Portal: ", e);
                          }
                        }}
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                        id="portal-navigate-login-btn"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.19-2.77-6.19-6.19 0-3.418 2.776-6.19 6.19-6.19 1.437 0 2.748.49 3.8 1.346l3.076-3.075C18.82 2.373 15.717 1 12.24 1 5.485 1 0 6.485 0 13.24c0 6.757 5.485 12.24 12.24 12.24 6.115 0 11.23-4.388 11.23-11.24 0-.671-.06-1.32-.164-1.955H12.24z" />
                        </svg>
                        <span>Sahkan Google Log Masuk</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border border-emerald-100 bg-emerald-50/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-300 shrink-0">
                          {user?.user_metadata?.avatar_url ? (
                            <img src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name || 'Google Account'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-xs">
                              {user?.user_metadata?.name.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] leading-tight min-w-0">
                          <p className="font-extrabold text-slate-800 truncate" title={user?.user_metadata?.name || ''}>{user?.user_metadata?.name || ''}</p>
                          <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-mono">● Akaun Aktif</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          logOut();
                        }}
                        className="text-[10px] font-extrabold text-rose-600 hover:text-rose-800 hover:underline transition-colors shrink-0 cursor-pointer"
                      >
                        Keluar / Sign Out
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <button 
                    onClick={() => handleRoleSelect(AppView.Landing)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer transition-all"
                  >
                    Return to Portal Landing Home Pages
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
