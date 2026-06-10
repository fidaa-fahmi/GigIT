import React, { useState } from 'react';
import { AppView, Gig, Applicant } from '../types'; //
import { initialApplicants, initialBackupWorkers } from '../data'; //
import { api } from '../services/api'; // Injects your Supabase API helper definitions
import { 
  Bell, 
  Plus, 
  Star, 
  Check, 
  MapPin, 
  Shield, 
  TrendingUp, 
  Eye, 
  Briefcase, 
  Users, 
  CreditCard,
  Settings,
  LogOut,
  X,
  Send,
  Sparkles,
  Info
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'motion/react';
import { triggerEmergencyBackup } from '../services/api';

interface EmployerDashboardViewProps {
  onNavigate: (view: AppView) => void;
  gigs: Gig[];
  onAddGig: (gig: Gig) => void;
}
const [isFindingBackup, setIsFindingBackup] = useState(false);
const [aiBackupChoice, setAiBackupChoice] = useState<any>(null);


export default function EmployerDashboardView({ onNavigate, gigs, onAddGig }: EmployerDashboardViewProps) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants); //
  const [backupPool, setBackupPool] = useState(initialBackupWorkers); //
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null); //
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'employer' | 'candidate'; text: string; time: string }>>([
    { sender: 'candidate', text: 'Hi! I saw the Barista Shift posting. I am very experienced with espresso machines.', time: '10:15 AM' },
    { sender: 'employer', text: 'Great! Are you comfortable with high volume rushes on weekends?', time: '10:20 AM' },
    { sender: 'candidate', text: 'Yes, absolutely. I worked at a busy campus café for 6 months.', time: '10:22 AM' }
  ]); //
  const [newMessageText, setNewMessageText] = useState(''); //
  
  // Custom states for interactive features
  const [showPostModal, setShowPostModal] = useState(false); //
  const [hiredStatus, setHiredStatus] = useState<Record<string, string>>({}); //
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null); //

  const handleEmergencyBackup = async () => {
    setIsFindingBackup(true);
    try {
      // 1. Send your dummy backupPool to Gemini
      const result = await triggerEmergencyBackup(
        "Need a reliable worker for an afternoon Cafe shift ASAP. Priority on high ratings.", 
        backupPool
      );
      
      // 2. Save the result
      setAiBackupChoice(result);
      setShowSuccessToast(`Gemini AI successfully matched a backup worker!`);
      setTimeout(() => setShowSuccessToast(null), 4000);
      
    } catch (error) {
      console.error("Backup search failed", error);
      setShowSuccessToast("AI Matchmaking failed.");
    } finally {
      setIsFindingBackup(false);
    }
  };  
  
  // New gig form states
  const [formData, setFormData] = useState({
    title: 'Cafe Assistant',
    rate: '12',
    category: 'F&B' as const,
    duration: '6 Hours',
    description: 'Help with basic cafe tasks, taking orders, and serving customers during the afternoon rush.',
    tags: 'F&B Support, Student Friendly'
  }); //

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Maria.';
    if (hour < 18) return 'Good Afternoon, Maria.';
    return 'Good Evening, Maria.';
  }; //

  const handleHire = (applicant: Applicant) => {
    setHiredStatus(prev => ({ ...prev, [applicant.id]: 'Hired' }));
    setShowSuccessToast(`Successfully hired ${applicant.name} for the Barista Shift!`);
    setTimeout(() => setShowSuccessToast(null), 4000);
    setApplicants(prev => prev.map(app => app.id === applicant.id ? { ...app, status: 'Hired' } : app));
  }; //

  const handleOpenChat = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setChatMessages([
      { sender: 'candidate', text: `Hi Maria, I am really excited about your gig: "Barista Shift @ KK Cafe". Let me know if you have any questions about my profile!`, time: '11:02 AM' },
      { sender: 'employer', text: 'Welcome! How many successful shifts have you completed on GigIT?', time: '11:05 AM' },
      { sender: 'candidate', text: applicant.id === 'app-2' ? 'I have completed 12 successful gigs with 5.0 rating!' : 'I have 5 completed gigs with 4.9 rating and zero cancellations!', time: '11:06 AM' }
    ]);
  }; //

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'employer', text: newMessageText, time: timeNow }]);
    setNewMessageText('');

    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        sender: 'candidate', 
        text: `Thank you, Maria! I appreciate that. I'm ready to start today if needed.`, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }, 1500);
  }; //

  // LIVE CONNECTIVITY IMPLEMENTATION: Saves to Supabase and distributes values dynamically
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newGig: Omit<Gig, 'id'> = {
      title: formData.title,
      employer: 'KK Cafe (Maria)',
      locationName: 'KK Town',
      distance: '0.5km away',
      rate: `RM ${formData.rate}/hr`,
      period: 'Hour',
      category: formData.category,
      isInstant: false,
      duration: formData.duration,
      description: formData.description,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      coords: { x: 58, y: 55, lat: 5.9749, lng: 116.0724 }
    };

    try {
      const savedGig = await api.createGig(newGig);
      onAddGig(savedGig);
    } catch (err) {
      console.error('Failed to save gig to DB:', err);
      // Fallback fallback handler so layout testing runs offline
      onAddGig({ ...newGig, id: `local-${Date.now()}` });
    }

    setShowPostModal(false);
    setShowSuccessToast('New gig posted! Workers can now apply.');
    setTimeout(() => setShowSuccessToast(null), 4000);
  };

  const currentActiveGigsCount = gigs.filter(g => g.employer === 'KK Cafe (Maria)' || g.employer === 'KK Cafe').length;

  return (
    <div className="bg-background min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface border-b border-outline-variant shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg font-display">G</div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">GigIT</span>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <button onClick={() => onNavigate(AppView.Landing)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Kota / Home</button>
          <button onClick={() => onNavigate(AppView.WorkerBrowse)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Find Gigs</button>
          <button onClick={() => onNavigate(AppView.EmployerDashboard)} className="text-primary font-bold border-b-2 border-primary py-1 text-sm tracking-wide cursor-pointer">Hire Staff</button>
          <button onClick={() => onNavigate(AppView.WorkerReliability)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Reliability Portal</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(AppView.WorkerBrowse)}
            className="hidden md:block text-primary hover:text-primary/80 font-semibold text-sm tracking-wide bg-primary/10 px-4 py-1.5 rounded-full hover:bg-primary/15 transition-all active:scale-95 cursor-pointer"
          >
            Switch to Worker
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors relative cursor-pointer">
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary-container rounded-full ring-2 ring-white"></span>
              <Bell size={20} className="text-primary" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant select-none cursor-pointer" onClick={() => onNavigate(AppView.WorkerReliability)}>
              <img alt="Employer Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArlkh8-LRzjsQ5aRbsLAeGaHCHMzCiX7slvulwgFNbafUydbCB8q533tkOZVnPrAcL0Tipwd9u_hGs_JSQEwZOzZmWmQ-0UT9sNNJ4XXK0ka9XNDUxr3QRBlQw2nqJxFQm0tA7ZjKb3ascTvRZDv7oWN_zjqb6sSdnPO4uPDqCHU04N9eo7oL8mE7XpzvrAqHziltAMM0XWqDAjGLCSpQBEsONsiX0twIPZC-sLYfN3B7i4qnfRTFV1nx_zMYcUo725YqWhzYxpxU" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 w-64 py-6 bg-surface-container-lowest border-r border-outline-variant shadow-xs">
          <div className="px-6 mb-8">
            <h2 className="font-display font-bold text-lg text-primary">Employer Portal</h2>
            <p className="text-xs text-on-surface-variant font-medium">KK Cafe - Manager Maria</p>
          </div>
          
          <nav className="flex-1 space-y-1 px-2">
            <a href="#" onClick={(e) => {e.preventDefault();}} className="flex items-center gap-3 p-3 bg-primary-container text-on-primary-container rounded-xl font-bold transition-all shadow-xs">
              <Sparkles size={18} />
              <span className="text-sm">Dashboard</span>
            </a>
            <a href="#" onClick={(e) => {e.preventDefault(); onNavigate(AppView.WorkerBrowse)}} className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all">
              <Briefcase size={18} />
              <span className="text-sm">Active Gigs ({currentActiveGigsCount})</span>
            </a>
            <a href="#" onClick={(e) => {e.preventDefault();}} className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all">
              <Users size={18} />
              <span className="text-sm">Staff Pool</span>
            </a>
            <a href="#" onClick={(e) => {e.preventDefault();}} className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all">
              <CreditCard size={18} />
              <span className="text-sm">Payments</span>
            </a>
          </nav>

          <div className="px-4 space-y-1 border-t border-outline-variant pt-4">
            <button onClick={() => {}} className="w-full flex items-center gap-3 p-2.5 text-on-surface-variant hover:text-primary transition-colors text-left text-xs font-semibold">
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button onClick={() => onNavigate(AppView.Landing)} className="w-full flex items-center gap-3 p-2.5 text-on-surface-variant hover:text-error transition-colors text-left text-xs font-semibold">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen pb-24 md:pb-12">
          <div className="max-w-7xl mx-auto space-y-8">
            <AnimatePresence>
              {showSuccessToast && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-primary text-white p-4 rounded-xl shadow-lg flex items-center justify-between border border-primary-container z-50 fixed top-20 right-4 max-w-sm"
                >
                  <div className="flex items-center gap-2">
                    <Check size={20} className="bg-white/25 p-0.5 rounded-full" />
                    <p className="text-xs font-medium">{showSuccessToast}</p>
                  </div>
                  <button onClick={() => setShowSuccessToast(null)} className="text-white/80 hover:text-white pl-2">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface leading-tight">
                  {getGreeting()}
                </h1>
                <p className="text-sm text-on-surface-variant mt-1 font-medium">
                  8 Applicants for Kota Kinabalu Cafe (Today, 2:00 PM)
                </p>
              </div>
              <button 
                onClick={() => setShowPostModal(true)}
                className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl shadow-md font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer text-sm"
              >
                <Plus size={18} />
                <span>Post New Gig</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <section className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg text-on-surface">Active Applicants</h3>
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                    {applicants.filter(a => a.status === 'Pending').length} Pending
                  </span>
                </div>

                {applicants.map((applicant) => (
                  <div key={applicant.id} className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-xs hover:shadow-md transition-shadow group relative overflow-hidden">
                    {applicant.status === 'Hired' && (
                      <div className="absolute top-0 right-0 bg-tertiary text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                        <Check size={12} />
                        <span>Hired Shift Helper</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-xs flex-shrink-0 bg-surface border border-outline-variant">
                        <img alt={applicant.name} className="w-full h-full object-cover" src={applicant.avatar} />
                      </div>
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-semibold text-on-surface text-base group-hover:text-primary transition-colors">{applicant.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="flex items-center gap-0.5 text-secondary font-bold text-xs select-none">
                                <Star size={14} fill="currentColor" />
                                {applicant.rating.toFixed(1)}
                              </span>
                              <span className="text-outline-variant text-xs">•</span>
                              <span className="text-tertiary-container font-semibold text-xs flex items-center gap-0.5 bg-tertiary/10 px-2 py-0.5 rounded-full">
                                <Shield size={12} />
                                {applicant.badge}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-error font-bold text-xs">No-Show: {applicant.noShowRate}</p>
                            <p className="text-on-surface-variant text-xs mt-0.5 font-medium">{applicant.distance}</p>
                          </div>
                        </div>
                        
                        <p className="mt-3 text-on-surface-variant text-xs leading-relaxed max-w-xl">
                          {applicant.bio}
                        </p>
                        
                        <div className="mt-5 flex gap-3">
                          {applicant.status === 'Hired' ? (
                            <button disabled className="flex-1 bg-tertiary/15 text-tertiary py-2.5 rounded-xl text-xs font-bold leading-none cursor-default flex items-center justify-center gap-1.5">
                              <Check size={14} />
                              <span>Worker Booked</span>
                            </button>
                          ) : (
                            <button onClick={() => handleHire(applicant)} className="flex-1 bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer">
                              Hire Now
                            </button>
                          )}
                          <button onClick={() => handleOpenChat(applicant)} className="flex-1 border border-primary text-primary hover:bg-primary/5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-white">
                            <span>Open Conversation</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant space-y-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="text-primary" size={20} />
                    <h3 className="font-display font-semibold text-sm text-on-surface">Emergency Backup Pool</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                    Workers within 500m available for instant call-up if your hire cancels.
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    {backupPool.map((worker) => (
                      <div 
                        key={worker.id}
                        className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setShowSuccessToast(`Contacting backup staff ${worker.name} on WhatsApp...`);
                          setTimeout(() => setShowSuccessToast(null), 4000);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <img className="w-10 h-10 rounded-full object-cover border border-outline-variant" src={worker.avatar} alt={worker.name} />
                          <div>
                            <p className="font-semibold text-xs text-on-surface">{worker.name}</p>
                            <p className="text-[10px] text-on-surface-variant flex items-center gap-0.5 mt-0.5 font-medium">
                              <Star size={10} fill="currentColor" className="text-secondary" />
                              {worker.rating} • {worker.gigsCount}
                            </p>
                          </div>
                        </div>
                        <span className="bg-tertiary text-white px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
                          READY
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleEmergencyBackup} 
                    disabled={isFindingBackup || backupPool.length === 0}
                    className="w-full text-center py-2.5 bg-red-500 text-white font-bold text-xs rounded-lg hover:bg-red-600 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
                  >
                    {isFindingBackup ? (
                      <span className="animate-pulse">🧠 Gemini AI is analyzing candidates...</span>
                    ) : (
                      '🚨 Trigger AI Emergency Match'
                    )}
                  </button>

                  {/* NEW: Show the AI Result when Gemini picks a worker */}
                  <AnimatePresence>
                    {aiBackupChoice && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className="text-primary" />
                          <h4 className="font-bold text-xs text-primary uppercase tracking-wider">AI Top Match</h4>
                        </div>
                        <p className="text-xs font-bold text-on-surface">
                          {backupPool.find((w: any) => w.id === aiBackupChoice.selectedWorkerId)?.name || 'Verified Backup Candidate'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-1 italic leading-relaxed">
                          "{aiBackupChoice.reason}"
                        </p>
                        <button 
                          onClick={() => {
                            setShowSuccessToast("Dispatch alert sent to worker's GigIT app!");
                            setAiBackupChoice(null); // Clear it after sending
                          }}
                          className="mt-3 w-full py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Dispatch Shift Alert
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-on-surface uppercase tracking-wider">Local Demand Insight</h4>
                    <Info size={14} className="text-on-surface-variant" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs text-primary font-bold">HIGH</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                    Worker availability in <strong>Likas / Damai</strong> is exceptionally high this afternoon. Perfect time to publish weekend shifts!
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {/* Post Gig Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-outline-variant">
              <div className="px-6 py-4 border-b border-outline-variant bg-surface flex justify-between items-center">
                <h3 className="font-display font-bold text-base text-primary">Post a New Student Gig</h3>
                <button onClick={() => setShowPostModal(false)} className="text-on-surface-variant hover:text-on-surface">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePostSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Gig Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-outline-variant text-sm bg-surface-container-lowest" placeholder="e.g. Barista, Kitchen Helper, Usher" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Compensation (RM/hr)</label>
                    <input type="number" required value={formData.rate} onChange={e => setFormData({ ...formData, rate: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-outline-variant text-sm bg-surface-container-lowest" placeholder="e.g. 12" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Shift Duration</label>
                    <input type="text" required value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-outline-variant text-sm bg-surface-container-lowest" placeholder="e.g. 4 Hours" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary text-sm bg-surface-container-lowest">
                    <option value="F&B">Food & Beverage</option>
                    <option value="Event">Event Support</option>
                    <option value="Logistics">Logistics / Delivery</option>
                    <option value="Cleaning">Cleaning & Housekeeping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Requirements / Brief Description</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-outline-variant text-sm bg-surface-container-lowest" placeholder="Describe tasks, wear code, meals provided, etc..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">Tags (comma-separated)</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full px-3.5 py-2 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-outline-variant text-sm bg-surface-container-lowest" placeholder="e.g. No Experience, English Required" />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowPostModal(false)} className="flex-1 py-3 border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface active:scale-95 transition-all text-sm cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/95 hover:scale-102 active:scale-95 transition-all text-sm cursor-pointer">Publish Shift Gigs</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messaging Chat Slider Modal */}
      <AnimatePresence>
        {selectedApplicant && (
          <div className="fixed inset-0 z-50 flex justify-end p-0 md:p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white w-full max-w-md h-full md:h-[calc(100vh-32px)] md:rounded-2xl border-l border-outline-variant flex flex-col justify-between shadow-2xl relative">
              <div className="p-4 border-b border-outline-variant bg-surface flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedApplicant.avatar} alt={selectedApplicant.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
                  <div>
                    <h3 className="font-bold text-sm text-on-surface leading-tight">{selectedApplicant.name}</h3>
                    <p className="text-[10px] text-primary font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse"></span>
                      Online • Verified Candidate
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedApplicant(null)} className="text-on-surface-variant hover:text-on-surface p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-container-lowest">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-outline bg-surface px-3 py-1 rounded-full border border-outline-variant/60">
                    Secure Chat • GigIT Safeguard
                  </span>
                </div>

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'employer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${msg.sender === 'employer' ? 'bg-primary text-white rounded-tr-xs' : 'bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface rounded-tl-xs border border-outline-variant/40'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[9px] text-right ${msg.sender === 'employer' ? 'text-white/60' : 'text-on-surface-variant font-medium'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-outline-variant bg-surface flex gap-2">
                <input type="text" value={newMessageText} onChange={e => setNewMessageText(e.target.value)} placeholder="Ask about uniform, hours, or specific experience..." className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant focus:outline-primary text-xs bg-white" />
                <button type="submit" className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 transition-all text-xs flex items-center justify-center cursor-pointer active:scale-95">
                  <Send size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Bar navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-surface border-t border-outline-variant py-2 flex justify-around items-center shadow-lg">
        <button onClick={() => onNavigate(AppView.Landing)} className="flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>
        <button onClick={() => onNavigate(AppView.WorkerBrowse)} className="flex flex-col items-center text-primary">
          <div className="p-1 px-4 bg-primary-container/20 text-primary rounded-full">
            <span className="material-symbols-outlined text-xl h-5 flex items-center justify-center">dashboard</span>
          </div>
          <span className="text-[10px] font-bold mt-1">Gigs Portal</span>
        </button>
        <button onClick={() => {}} className="flex flex-col items-center text-on-surface-variant">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="text-[10px] mt-0.5">Alerts</span>
        </button>
      </div>
    </div>
  );
}