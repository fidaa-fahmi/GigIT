import { useState, useEffect } from 'react';
import { AppView, Gig } from './types';
import { initialGigs } from './data';
import LandingView from './components/LandingView';
import EmployerDashboardView from './components/EmployerDashboardView';
import WorkerBrowseView from './components/WorkerBrowseView';
// FIX: WorkerReliabilityView is now actually imported AND rendered.
import WorkerReliabilityView from './components/WorkerReliabilityView';
import { User, X, Check, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';

export default function App() {
  // Switched from Google Auth to Manual Email Auth methods
  const { user, logOut, signInWithEmail, signUpWithEmail } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.Landing);
  const [gigs, setGigs] = useState<Gig[]>(initialGigs);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'worker' | 'employer'>('worker');
  // States for manual email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Called when an employer posts a new gig — adds it to the shared gig list
  const handleAddGig = (newGig: Gig) => {
    setGigs(prev => [newGig, ...prev]);
  };

  const handleRoleSelect = (view: AppView) => {
    setCurrentView(view);
    setShowSelector(false);
  };

  // Handler for Email/Password form submission
  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isRegistering) {
        // Pass the selectedRole to the context
        await signUpWithEmail(email, password, "Pengguna Baru", selectedRole);
        alert("Pendaftaran berjaya! Sila log masuk.");
        setIsRegistering(false);
        setPassword('');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || "Ralat pengesahan. Sila semak butiran anda.");
    }
  };

  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role;
      if (role === 'employer') {
        setCurrentView(AppView.EmployerDashboard);
      } else {
        setCurrentView(AppView.WorkerBrowse);
      }
      setShowSelector(false); // Close the modal if it's open
    } else {
      setCurrentView(AppView.Landing);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased transition-colors">
      {/* Route Views */}
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

        {/* FIX: gigs prop removed — WorkerBrowseView fetches its own data from Supabase */}
        {currentView === AppView.WorkerBrowse && (
          <WorkerBrowseView
            onNavigate={setCurrentView}
            fallbackGigs={gigs}
          />
        )}

        {/* FIX: Now renders WorkerReliabilityView correctly */}
        {currentView === AppView.WorkerReliability && (
          <WorkerReliabilityView
            onNavigate={setCurrentView}
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

                {/* Secure Manual Email Authentication Integration */}
                <div className="border-t border-outline-variant pt-4">
                  {!user ? (
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-4 text-left space-y-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-extrabold text-indigo-900 tracking-wider uppercase font-sans">
                          {isRegistering ? 'Daftar Akaun Baru' : 'Akaun Bersepadu ID'}
                        </span>
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase font-mono">Supabase Auth</span>
                      </div>
                      
                      <form onSubmit={handleManualAuth} className="space-y-2">
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-2.5 text-indigo-400" />
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Alamat E-mel" className="w-full pl-9 pr-3 py-2 rounded-lg border border-indigo-200 text-xs focus:outline-indigo-500 bg-white" />
                        </div>
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-2.5 text-indigo-400" />
                          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata Laluan" className="w-full pl-9 pr-3 py-2 rounded-lg border border-indigo-200 text-xs focus:outline-indigo-500 bg-white" />
                        </div>

                        {/* NEW: Show Role Selector only when registering */}
                        {isRegistering && (
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setSelectedRole('worker')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md border ${selectedRole === 'worker' ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                              👤 Worker
                            </button>
                            <button type="button" onClick={() => setSelectedRole('employer')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md border ${selectedRole === 'employer' ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                              🏢 Employer
                            </button>
                          </div>
                        )}
                        
                        {authError && <p className="text-[9px] text-red-600 font-bold leading-tight mt-1">{authError}</p>}

                        <button type="submit" className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer">
                          {isRegistering ? `Daftar sebagai ${selectedRole === 'worker' ? 'Pekerja' : 'Majikan'}` : 'Sahkan Log Masuk'}
                        </button>
                      </form>

                      <div className="text-center pt-1">
                        <button 
                          type="button"
                          onClick={() => {
                            setIsRegistering(!isRegistering);
                            setAuthError(null);
                          }}
                          className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                        >
                          {isRegistering ? 'Sudah ada akaun? Log Masuk' : 'Belum ada akaun? Daftar Sini'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-emerald-100 bg-emerald-50/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-300 shrink-0 bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-xs">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-[11px] leading-tight min-w-0">
                          <p className="font-extrabold text-slate-800 truncate" title={user.email}>{user.email}</p>
                          <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-mono">● Akaun Aktif</span>
                        </div>
                      </div>
                      <button
                        onClick={() => logOut()}
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
                    Return to Portal Landing Home
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