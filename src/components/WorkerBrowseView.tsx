import { AppView, Gig } from '../types';
import { initialGigs, initialBackupWorkers } from '../data';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Gig } from '../types';
import { 
  Bell, 
  User, 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle, 
  Map as MapIcon, 
  Sliders, 
  Sparkles,
  DollarSign, 
  Navigation,
  ArrowLeft,
  Coffee,
  Package,
  Calendar,
  X,
  Play,
  Check,
  Zap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  MessageSquare,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WorkerReliabilityView from './WorkerReliabilityView';

interface WorkerBrowseViewProps {
  onNavigate: (view: AppView) => void;
  gigs: Gig[];
  initialTab?: string;
}

export default function WorkerBrowseView({ onNavigate, gigs, initialTab }: WorkerBrowseViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Types');
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'Dashboard');
  const [userGigs, setUserGigs] = useState<Record<string, 'Applied' | 'Booked'>>({});
  const [showMapOnMobile, setShowMapOnMobile] = useState<boolean>(false);
  
  // Clock in status
  const [clockInState, setClockInState] = useState<'idle' | 'clocked-in' | 'clocked-out'>('idle');
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  // Success toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter chips
  const categories = [
    { name: 'All Types', count: gigs.length },
    { name: 'Event', count: gigs.filter(g => g.category === 'Event').length },
    { name: 'F&B', count: gigs.filter(g => g.category === 'F&B').length },
    { name: 'Logistics', count: gigs.filter(g => g.category === 'Logistics').length },
    { name: '< 3km Away', count: gigs.filter(g => parseFloat(g.distance) < 3.0).length }
  ];

  // Filtering calculation logic
  const filteredGigs = useMemo(() => {
    if (selectedCategory === 'All Types') return gigs;
    if (selectedCategory === '< 3km Away') {
      return gigs.filter(g => parseFloat(g.distance.replace('km away', '').trim()) < 3.0);
    }
    return gigs.filter(g => g.category === selectedCategory);
  }, [selectedCategory, gigs]);

  const handleApply = (id: string, title: string, isInstant: boolean) => {
    setUserGigs(prev => ({
      ...prev,
      [id]: isInstant ? 'Booked' : 'Applied'
    }));

    const actionText = isInstant ? 'booked instantly!' : 'application submitted!';
    setToastMessage(`Success! "${title}" is ${actionText}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClockIn = () => {
    if (clockInState === 'idle') {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setClockInState('clocked-in');
      setClockInTime(timeStr);
      setToastMessage(`Successful Clock-In at ${timeStr}! Have a great Shift at UMS Library! 🎉`);
    } else if (clockInState === 'clocked-in') {
      setClockInState('clocked-out');
      setToastMessage(`Successful Clock-Out! Your hours have been updated for Direct Pay. 💸`);
    }
    setTimeout(() => setToastMessage(null), 4500);
  };

  return (
    <div className="bg-background min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface border-b border-outline-variant shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.Landing)}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg font-display">G</div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">GigIT</span>
        </div>
        
        {/* Navigation links centered on desktop */}
        <div className="hidden lg:flex items-center gap-6">
          <button onClick={() => onNavigate(AppView.Landing)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Kota / Home</button>
          <button onClick={() => onNavigate(AppView.WorkerBrowse)} className="text-primary font-bold border-b-2 border-primary py-1 text-sm tracking-wide cursor-pointer">Find Gigs</button>
          <button onClick={() => onNavigate(AppView.EmployerDashboard)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Hire Staff</button>
          <button onClick={() => onNavigate(AppView.WorkerReliability)} className="text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold tracking-wide cursor-pointer">Reliability Portal</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(AppView.EmployerDashboard)}
            className="hidden md:block border border-primary text-primary hover:bg-primary/5 py-1.5 px-5 rounded-full font-semibold transition-all active:scale-95 cursor-pointer text-sm"
          >
            Switch to Employer
          </button>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors relative cursor-pointer">
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full"></span>
              <Bell size={20} className="text-on-surface-variant" />
            </button>
            <button onClick={() => onNavigate(AppView.WorkerReliability)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
              <User size={20} className="text-on-surface-variant" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex pt-16">
        
        {/* Left Side Navigation (Desktop Only) */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 w-64 py-6 bg-surface-container-lowest border-r border-outline-variant shadow-xs overflow-y-auto">
          
          <div className="px-6 mb-6">
            <div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-surface-container-low p-2 rounded-xl transition-colors" onClick={() => onNavigate(AppView.WorkerReliability)}>
              <img 
                alt="Ahmad Profile" 
                className="w-12 h-12 rounded-full border-2 border-primary-container object-cover shadow-xs" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR_yuEE9W4djP9NUe9iDVsrhbbqm4c33mAlfDjziC8BLi_t74hQq-KG0VktJpJg9e--D2XO_NUJzmL5quEgka7Um1OL0iazTpJDBk71rPxSF_7N91D4ACo2dyhpbQaQodHH1Y8V3o4TIlrZgWRvHjAC2X9e_dr4LNN0WjGpn_X8vOC3xbjAaAMLbuwKZJKr3YOmYSEML-QJ8N2QRPq864qy9TCjIv8nbsuGkNHlZbRcD8MLFgVDmT-5MVc6EdJ2JyyGQ_SQlnRwWQ" 
              />
              <div>
                <p className="font-semibold text-sm text-on-surface">Ahmad Rosli</p>
                <p className="text-[11px] text-on-surface-variant font-medium">Verified Sabah Worker</p>
              </div>
            </div>

            {/* Reliability score highlights */}
            <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/20">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">Reliability Score</span>
                <span className="text-sm font-bold text-secondary flex items-center gap-0.5">
                  <Award size={14} fill="currentColor" />
                  4.8
                </span>
              </div>
              <div className="w-full bg-outline-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
              <div className="flex gap-1 mt-2.5">
                <span className="text-[9px] bg-tertiary-container/25 text-on-tertiary-container px-2 py-0.5 rounded-full font-bold">Punctual</span>
                <span className="text-[9px] bg-tertiary-container/25 text-on-tertiary-container px-2 py-0.5 rounded-full font-bold">Hardworking</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveTab('Dashboard'); }} 
              className={`flex items-center gap-3 px-6 py-3.5 mx-2 rounded-xl text-sm ${
                activeTab === 'Dashboard' 
                  ? 'bg-primary text-white font-bold shadow-xs' 
                  : 'text-on-surface-variant hover:bg-surface-container-low transition-all'
              }`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Dashboard</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveTab('Reliability'); }} 
              className={`flex items-center gap-3 px-6 py-3.5 mx-2 rounded-xl text-sm ${
                activeTab === 'Reliability' 
                  ? 'bg-primary text-white font-bold shadow-xs' 
                  : 'text-on-surface-variant hover:bg-surface-container-low transition-all'
              }`}
            >
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span>My Reliability</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveTab('Earnings'); }} 
              className={`flex items-center gap-3 px-6 py-3.5 mx-2 rounded-xl text-sm ${
                activeTab === 'Earnings' 
                  ? 'bg-primary text-white font-bold shadow-xs' 
                  : 'text-on-surface-variant hover:bg-surface-container-low transition-all'
              }`}
            >
              <span className="material-symbols-outlined text-lg">payments</span>
              <span>Earnings</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveTab('Support'); }} 
              className={`flex items-center gap-3 px-6 py-3.5 mx-2 rounded-xl text-sm ${
                activeTab === 'Support' 
                  ? 'bg-primary text-white font-bold shadow-xs' 
                  : 'text-on-surface-variant hover:bg-surface-container-low transition-all'
              }`}
            >
              <span className="material-symbols-outlined text-lg">support_agent</span>
              <span>Support</span>
            </a>
          </nav>

          {/* Clock In Widget */}
          <div className="px-6 mt-auto pb-4">
            <div className="bg-surface-container p-4 rounded-xl mb-4 border border-outline-variant/60">
              <p className="text-xs font-bold text-on-surface mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                <Clock size={12} className="text-primary animate-pulse" />
                Next Shift
              </p>
              <p className="text-xs text-on-surface-variant mb-0.5">Today, 2:00 PM</p>
              <p className="text-xs font-bold text-primary mb-3">Event Helper @ UMS</p>
              
              {clockInState === 'idle' && (
                <button 
                  onClick={handleClockIn}
                  className="w-full bg-primary hover:bg-primary/95 text-white py-2 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play size={10} fill="currentColor" />
                  <span>Clock In</span>
                </button>
              )}
              {clockInState === 'clocked-in' && (
                <button 
                  onClick={handleClockIn}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold active:scale-95 transition-all text-center cursor-pointer shadow-sm animate-pulse-slow"
                >
                  Clock Out (Active {clockInTime})
                </button>
              )}
              {clockInState === 'clocked-out' && (
                <div className="text-center py-2 bg-tertiary/15 border border-tertiary/30 text-tertiary rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                  <CheckCircle size={14} />
                  <span>Shift Completed!</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">
                <span className="material-symbols-outlined text-md">settings</span>
                <span>Settings</span>
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(AppView.Landing) }} className="flex items-center gap-3 py-1.5 text-on-surface-variant hover:text-error transition-colors text-xs font-medium">
                <span className="material-symbols-outlined text-md">logout</span>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </aside>

        {/* Right side Main Content Scroll view */}
        <main className="flex-1 md:ml-64 pb-28 md:pb-12 min-h-screen">
          
          {/* Global toast notification system */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-50">
            <AnimatePresence>
              {toastMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 15, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  className="bg-slate-900 border border-slate-800 text-white p-4.5 rounded-2xl shadow-xl flex items-center justify-between z-50 fixed top-4 right-4 max-w-md"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
                    <p className="text-xs font-semibold leading-relaxed font-sans">{toastMessage}</p>
                  </div>
                  <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white pl-3 hover:scale-105 transition-all">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTIVE TAB: Dashboard (Gig Map and Listings) */}
          {activeTab === 'Dashboard' && (
            <>
              {/* Visual Map Banner */}
              <div 
                className={`relative w-full overflow-hidden border-b border-outline-variant shadow-xs transition-all ${
                  showMapOnMobile 
                    ? 'h-[calc(100vh-140px)] block' 
                    : 'hidden md:block md:h-[350px]'
                }`}
                id="gigs-interactive-leaflet-map"
              >
                <div className="absolute inset-0 bg-surface-container-highest">
                  <img 
                    alt="Map of Kota Kinabalu showing gig locations" 
                    className="w-full h-full object-cover opacity-75"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzIs7EISazqOpSKFg2aAUlsTf9_hmYaH1tPpDOcK0yM129A_sT8opGYYi44L8G4E-4avwAfykwpwi_NAW0cVVllVW6hEZjQCZld4saiVqDjIl1cztKNEojAiETF0ooBcJFp-Ty6f8fQvx4Fc0YhcbKimW2OOqr0tvFfBYnIzA1mQT_11xGk2KrgiACnTbaX6-2fm3SHqYx9FR4yuJy3_rsjv4H57OE3V1s2uI0nb31oIGPvs0QXUZE0gQ9BPEPuyWQSEKm9_RV-fI" 
                  />
                  <div className="absolute inset-0 map-gradient"></div>
                </div>

                {/* Simulated Live Marker Pins */}
                {gigs.map((g) => (
                  <div 
                    key={g.id} 
                    style={{ top: `${g.coords.y}%`, left: `${g.coords.x}%` }}
                    className="absolute z-10 p-1.5 bg-primary rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 cursor-pointer hover:scale-110 hover:bg-primary-container transition-all"
                    onClick={() => handleApply(g.id, g.title, g.isInstant)}
                    title={`Instant apply to: ${g.title}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <span className="text-[9px] font-bold text-white pr-1 select-none">{g.rate}</span>
                  </div>
                ))}

                {/* Visual map Overlay info titles - on mobile we can make it smaller */}
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 flex flex-col justify-end bg-gradient-to-t from-background via-background/40 to-transparent">
                  <div className="max-w-7xl mx-auto w-full flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                      <h1 className="font-sans font-bold text-lg md:text-2xl text-primary drop-shadow-xs">Gigs Around Kota Kinabalu</h1>
                      <p className="text-[11px] md:text-xs text-on-surface-variant max-w-sm leading-normal font-medium animate-pulse-slow">Find student gig locations within 5km of UMS College Campus.</p>
                    </div>
                    
                    <div className="flex gap-2 relative z-20">
                      <button onClick={() => setSelectedCategory('All Types')} className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-full shadow-xs border border-outline-variant text-[10px] md:text-[11px] font-bold hover:bg-surface-container-low transition-colors cursor-pointer select-none">
                        <Sliders size={12} className="text-primary" />
                        <span>All Areas</span>
                      </button>
                      <button onClick={() => setActiveTab('Reliability')} className="flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-full shadow-md text-[10px] md:text-[11px] font-bold hover:bg-primary/95 transition-all cursor-pointer select-none">
                        <Award size={12} />
                        <span>My Scorecard</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                {/* Toggle components container */}
                <div className={showMapOnMobile ? 'hidden md:block' : 'block'}>
                  
                  {/* Category Filter Cards */}
                  <div className="overflow-x-auto select-none no-scrollbar pb-3">
                    <div className="flex gap-2 whitespace-nowrap">
                      {categories.map((cat) => (
                        <button 
                          key={cat.name}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`px-4.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                            selectedCategory === cat.name 
                              ? 'bg-primary text-white border-primary font-semibold' 
                              : 'bg-white border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                        >
                          {cat.name} {cat.count > 0 && `(${cat.count})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gig list cards grid representation */}
                  <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGigs.map((g) => {
                      const isFeatured = g.id === 'gig-1';
                      const status = userGigs[g.id];

                      if (isFeatured) {
                        return (
                          <div 
                            key={g.id} 
                            className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white border border-outline-variant hover:shadow-lg transition-all duration-300"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                              <div className="md:col-span-5 h-48 md:h-full relative overflow-hidden bg-surface">
                                <img 
                                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                                  src={g.imageUrl} 
                                  alt={g.title} 
                                />
                                <div className="absolute top-3.5 left-3.5 bg-tertiary-container/90 text-white text-[9px] font-bold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                                  <Zap size={10} fill="currentColor" />
                                  <span>INSTANT BOOKING</span>
                                </div>
                              </div>

                              <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-4">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{g.category} Support</span>
                                    <span className="font-display font-bold text-lg text-secondary leading-none">{g.rate}</span>
                                  </div>
                                  <h3 className="font-display font-bold text-lg text-on-surface mt-2 group-hover:text-primary transition-colors">{g.title}</h3>
                                  <p className="text-xs text-on-surface-variant mt-2 font-sans leading-relaxed">
                                    {g.description}
                                  </p>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={16} className="text-primary" />
                                      <span>{g.distance} ({g.locationName})</span>
                                    </div>
                                    {g.duration && (
                                      <div className="flex items-center gap-1.5">
                                        <Clock size={16} className="text-primary" />
                                        <span>{g.duration}</span>
                                      </div>
                                    )}
                                  </div>

                                  {status ? (
                                    <div className="w-full text-center py-3 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                                      <Check size={16} />
                                      <span>Booked Instantly! Saved for shift.</span>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => handleApply(g.id, g.title, g.isInstant)}
                                      className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform text-xs cursor-pointer shadow-xs"
                                    >
                                      Book Instantly
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Standard Cards items
                      return (
                        <div 
                          key={g.id} 
                          className={`flex flex-col justify-between rounded-xl bg-white border border-outline-variant p-5 hover:shadow-md transition-all ${
                            g.isInstant ? 'border-l-4 border-l-tertiary-container' : ''
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="p-2.5 bg-surface-container rounded-lg">
                                <span className="material-symbols-outlined text-primary leading-none text-base">
                                  {g.category === 'F&B' ? 'restaurant' : g.category === 'Logistics' ? 'local_shipping' : g.category === 'Cleaning' ? 'cleaning_services' : 'campaign'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-display font-semibold text-base text-secondary">{g.rate}</span>
                                {g.isInstant && (
                                  <div className="text-[8px] bg-tertiary/10 border border-tertiary/30 px-1.5 py-0.5 rounded text-tertiary font-bold uppercase tracking-wider mt-1 text-center scale-95 origin-right">
                                    INSTANT AVAILABLE
                                  </div>
                                )}
                              </div>
                            </div>

                            <h3 className="font-semibold text-on-surface text-sm mt-4">{g.title}</h3>
                            <p className="text-[11px] font-medium text-on-surface-variant mt-1">{g.employer}</p>
                            
                            <div className="flex flex-wrap gap-1.5 mt-4">
                              <span className="bg-surface-container text-on-surface-variant text-[10px] px-2.5 py-1 rounded-full font-semibold">
                                {g.distance}
                              </span>
                              {g.tags && g.tags.map(tag => (
                                <span key={tag} className="bg-surface-container text-on-surface-variant text-[10px] px-2.5 py-1 rounded-full font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-surface-container-high">
                            {status ? (
                              <div className="w-full text-center py-2 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                                <Check size={14} />
                                <span>{status === 'Applied' ? 'Application Sent' : 'Shift Booked!'}</span>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleApply(g.id, g.title, g.isInstant)}
                                className={`w-full py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform text-center cursor-pointer ${
                                  g.isInstant 
                                    ? 'bg-primary text-white' 
                                    : 'border border-primary text-primary hover:bg-primary/5 bg-white'
                                }`}
                              >
                                {g.isInstant ? 'Book Now' : 'Apply Now'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ACTIVE TAB: Reliability (Embedded attendance tracking system) */}
          {activeTab === 'Reliability' && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
              <WorkerReliabilityView onNavigate={onNavigate} isEmbedded={true} />
            </div>
          )}

          {/* ACTIVE TAB: Earnings (Direct student bank transfer and clearance) */}
          {activeTab === 'Earnings' && (
            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-4 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
                <div>
                  <h1 className="font-display font-bold text-xl md:text-2xl text-primary">Student Earnings Center</h1>
                  <p className="text-xs text-on-surface-variant">Track completed shifts, pending clearances, and instantly withdraw your funds to your local bank account.</p>
                </div>
                <div className="bg-primary/5 px-4 md:px-5 py-2 rounded-2xl border border-primary/10 text-center">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Connected Bank Profile</p>
                  <p className="font-mono text-xs font-semibold text-on-surface mt-0.5">Bank Islam •••• 8103</p>
                </div>
              </div>

              {/* Wallet Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {/* Available for Payout */}
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 text-white p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between h-[160px] shadow-md border border-indigo-650/40 group">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-indigo-100 font-bold uppercase tracking-wider">Available Balance</span>
                    <CreditCard size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-3xl text-white">RM 480.00</h2>
                    <p className="text-[10.5px] text-teal-300 mt-1 font-bold">Cleared for Instant DuitNow Transfer ⚡</p>
                  </div>
                </div>

                {/* Pending Verification */}
                <div className="bg-white border border-neutral-100 p-6 rounded-3xl flex flex-col justify-between h-[160px] shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Pending Release</span>
                    <Clock size={16} className="text-primary animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-3xl text-on-surface">RM 132.00</h2>
                    <p className="text-[10px] text-primary font-semibold mt-1">1 Shift pending employer approval</p>
                  </div>
                </div>

                {/* Total Cleared This Semester */}
                <div className="bg-white border border-neutral-100 p-6 rounded-3xl flex flex-col justify-between h-[160px] shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Semester Total</span>
                    <TrendingUp size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-3xl text-on-surface">RM 2,140.00</h2>
                    <p className="text-[10px] text-on-surface-variant mt-1">14 completed shifts cleared successfully</p>
                  </div>
                </div>
              </div>

              {/* Instant Bank Payout Action */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/40 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-display font-bold text-sm text-teal-900">Need funds immediately?</h3>
                  <p className="text-[11px] text-teal-800 font-medium">GigIT pays direct to local Malaysian banks in under 5 minutes after shift validation. Zero transaction fees.</p>
                </div>
                <button 
                  onClick={() => {
                    setToastMessage("Transfer Initiated! RM 480.00 has been securely routed to Bank Islam Account •••• 8103. Funds cleared under instant payment (DuitNow). ⚡");
                    setTimeout(() => setToastMessage(null), 5000);
                  }}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Withdraw to Bank Islam
                </button>
              </div>

              {/* Transactions History */}
              <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-4">
                <h3 className="font-display font-bold text-sm text-on-surface">Verified Payout History</h3>
                
                <div className="divide-y divide-neutral-100">
                  <div className="py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Barista Assistant Shift</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">Damai Bistro • May 28, 2026</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-teal-700 font-mono">+RM 72.00</p>
                      <span className="text-[8px] bg-teal-50 border border-teal-200/50 text-teal-700 font-bold px-1.5 py-0.5 rounded uppercase font-sans tracking-wide">Cleared</span>
                    </div>
                  </div>

                  <div className="py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Event Assistant Crew</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">ICC KK Hall • May 14, 2026</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-teal-700 font-mono">+RM 180.00</p>
                      <span className="text-[8px] bg-teal-50 border border-teal-200/50 text-teal-700 font-bold px-1.5 py-0.5 rounded uppercase font-sans tracking-wide">Cleared</span>
                    </div>
                  </div>

                  <div className="py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Warehouse Logistics Sorting</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">Sabah Logistic Depot • May 04, 2026</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-teal-700 font-mono">+RM 228.00</p>
                      <span className="text-[8px] bg-teal-50 border border-teal-200/50 text-teal-700 font-bold px-1.5 py-0.5 rounded uppercase font-sans tracking-wide">Cleared</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: Support (Help Desk, travel claims and Live Assist) */}
          {activeTab === 'Support' && (
            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-4 space-y-6 font-sans">
              <div className="border-b border-outline-variant pb-4">
                <h1 className="font-display font-bold text-xl md:text-2xl text-primary">Student Support Desk</h1>
                <p className="text-xs text-on-surface-variant font-medium">Emergency cancellations, travel/car fuel subsidy claims, or manual academic verification services.</p>
              </div>

              {/* Help Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-2xs space-y-3 hover:shadow-xs transition-shadow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <HelpCircle size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-on-surface">Academic Matriculation Verification</h3>
                      <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed mt-1">If manual verification of student credentials is required, upload pictures of your active UMS/UiTM student card below for standard immediate audit approval.</p>
                    </div>
                  </div>
                  <button onClick={() => { setToastMessage("Manual portal initialized! Upload your raw Student Matriculation Card copy inside this widget."); setTimeout(() => setToastMessage(null), 4000); }} className="text-xs text-primary font-bold hover:underline cursor-pointer text-left mt-3">Upload Matriculation ID card &rarr;</button>
                </div>

                <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-2xs space-y-3 hover:shadow-xs transition-shadow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-on-surface">Emergency Transit &amp; fuel subsidy claim</h3>
                      <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed mt-1">Travelling over 5km for an off-campus retail or logistics gig? File travel expense receipt claims securely inside this widget for petrol subsidy reimbursements.</p>
                    </div>
                  </div>
                  <button onClick={() => { setToastMessage("Travel Claims dashboard initialized! Upload your valid petrol receipts (Sabah Petrol Stations) below."); setTimeout(() => setToastMessage(null), 4000); }} className="text-xs text-primary font-bold hover:underline cursor-pointer text-left mt-3">Submit petrol expense receipt &rarr;</button>
                </div>
              </div>

              {/* Chat Assistance Mock Interface */}
              <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <h3 className="font-display font-bold text-sm text-on-surface">Interactive Help Center Bot</h3>
                </div>

                <div className="bg-neutral-50/50 border border-neutral-100 p-5 rounded-2xl min-h-[140px] flex flex-col justify-between">
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto">
                    <div className="flex gap-2.5 items-start text-xs pr-4">
                      <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">Bot</div>
                      <div className="bg-white border border-neutral-100 p-2.5 rounded-2xl text-on-surface shadow-3xs leading-relaxed font-medium">Hello Ahmad Rosli! I am your GigIT Assist Bot. How can I help you today with your attendance scorecards, fuel travel vouchers, or Bank Islam clearances?</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-outline-variant flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Type your question (e.g. withdrawal status, cancel shift)..." 
                      className="flex-1 bg-white border border-outline-variant/60 outline-none text-xs rounded-xl px-4 py-3 text-on-surface focus:border-primary font-medium"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.currentTarget as HTMLInputElement).value;
                          if (!val.trim()) return;
                          e.currentTarget.value = '';
                          setToastMessage(`Thanks! Support request successfully filed under "General Enquiry". We will send an email back under 10 minutes.`);
                          setTimeout(() => setToastMessage(null), 5000);
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        setToastMessage(`Thanks! Support request successfully filed under "General Enquiry". We will send an email back under 10 minutes.`);
                        setTimeout(() => setToastMessage(null), 5000);
                      }}
                      className="bg-primary hover:bg-primary/95 text-white px-4 py-3 rounded-xl transition-all text-xs font-bold cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Floating Toggle view FAB on Mobile devices */}
      <div className="md:hidden fixed bottom-24 right-4 z-50">
        <button 
          onClick={() => setShowMapOnMobile(!showMapOnMobile)}
          className="bg-primary filter drop-shadow-xl scale-102 hover:bg-primary/95 text-white p-3.5 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-primary-container"
          title={showMapOnMobile ? "Switch to List View" : "Switch to Map View"}
          id="mobile-toggle-view-fab"
        >
          <span className="material-symbols-outlined text-xl text-white">
            {showMapOnMobile ? 'list_alt' : 'map'}
          </span>
        </button>
      </div>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant py-2 flex justify-around items-center shadow-lg font-sans">
        <button 
          onClick={() => onNavigate(AppView.Landing)}
          className="flex flex-col items-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>
        <button 
          onClick={() => { setActiveTab('Dashboard'); }}
          className={`flex flex-col items-center ${activeTab === 'Dashboard' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          <div className={`p-1 px-4 rounded-full ${activeTab === 'Dashboard' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-md">work</span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Gigs</span>
        </button>
        <button 
          onClick={() => { setActiveTab('Reliability'); }}
          className={`flex flex-col items-center ${activeTab === 'Reliability' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
          <div className={`p-1 px-4 rounded-full ${activeTab === 'Reliability' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-md">verified_user</span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Reliability</span>
        </button>
      </div>
    </div>
  );
}
