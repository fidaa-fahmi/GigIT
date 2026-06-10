import { useState, useMemo, useEffect } from 'react';
import { AppView, Gig } from '../types';
import { initialGigs } from '../data';
import { api } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Clock, Zap, X, ChevronLeft, Home, Briefcase, User, SlidersHorizontal } from 'lucide-react';

// Fix for default marker icons missing in Leaflet when bundled with Vite
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Category filter options matching the Gig type
const CATEGORIES = ['All Types', 'Event', 'F&B', 'Logistics', 'Cleaning'] as const;

// FIX: Added fallbackGigs prop so employer-posted gigs (from App.tsx state) show
// when the Supabase DB returns nothing (e.g. empty table, connection error).
interface WorkerBrowseViewProps {
  onNavigate: (view: AppView) => void;
  fallbackGigs?: Gig[];
}

export default function WorkerBrowseView({ onNavigate, fallbackGigs = initialGigs }: WorkerBrowseViewProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Types');
  // FIX: selectedGig drives the View Details modal that previously had no onClick
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  // FIX: Applied gig tracking for the "Apply" CTA state
  const [appliedGigs, setAppliedGigs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Fetch real data from Supabase; fall back to fallbackGigs on error or empty result
  useEffect(() => {
    async function loadGigs() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getGigs();
        // FIX: If DB returns nothing, use fallbackGigs so the UI is never empty
        setGigs(data.length > 0 ? data : fallbackGigs);
      } catch (err) {
        console.error('Database connection failure:', err);
        setError('Could not connect to database. Showing cached listings.');
        // FIX: On error, fall back to local data rather than showing a blank screen
        setGigs(fallbackGigs);
      } finally {
        setLoading(false);
      }
    }
    loadGigs();
  }, [fallbackGigs]);

  const filteredGigs = useMemo(() => {
    if (selectedCategory === 'All Types') return gigs;
    return gigs.filter(g => g.category === selectedCategory);
  }, [selectedCategory, gigs]);

  const handleApply = (gigId: string) => {
    setAppliedGigs(prev => {
      const next = new Set(prev);
      next.add(gigId);
      return next;
    });
  };

  return (
    <div className="bg-background min-h-screen">

      {/* FIX: Added navigation bar — previously missing, user had no way to go back
          or navigate to other pages from the browse screen. */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface-container-lowest border-b border-outline-variant shadow-xs">
        <button
          onClick={() => onNavigate(AppView.Landing)}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-semibold py-2 px-3 hover:bg-surface-container rounded-lg cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs">G</div>
          <span className="font-display font-bold text-base text-primary tracking-tight">Browse Gigs</span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-semibold py-2 px-3 hover:bg-surface-container rounded-lg cursor-pointer"
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </nav>

      <div className="pt-16">
        {/* FIX: Category filter UI — the state existed but was never rendered.
            Filters now appear as a collapsible bar below the nav. */}
        {showFilters && (
          <div className="bg-surface border-b border-outline-variant px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
              <span className="text-xs text-on-surface-variant font-semibold mr-1">Category:</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant border border-outline-variant hover:border-primary/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error banner (non-blocking — still shows fallback data) */}
        {error && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
            <p className="text-xs text-amber-700 font-medium">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-on-surface-variant font-medium">Loading gigs near you...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* FIX: Leaflet map now uses gig.coords.lat and gig.coords.lng which
                are real GPS coordinates. Old code used coords.lat/lng which were
                undefined (the type only had x/y), so all pins stacked at 0,0. */}
            <div className="w-full h-[300px] relative z-10 border-b border-outline-variant shadow-xs">
              <MapContainer
                center={[6.0367, 116.1186]}
                zoom={13}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredGigs.map((g) => (
                  <Marker
                    key={g.id}
                    position={[g.coords.lat, g.coords.lng]}
                    eventHandlers={{
                      click: () => setSelectedGig(g),
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans">
                        <h4 className="font-bold text-sm text-primary">{g.title}</h4>
                        <p className="text-xs font-semibold text-gray-600">{g.rate} • {g.employer}</p>
                        <p className="text-[11px] mt-1 text-gray-500">{g.locationName}</p>
                        <button
                          onClick={() => setSelectedGig(g)}
                          className="mt-2 w-full text-center text-xs font-bold text-primary hover:underline"
                        >
                          View Details →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Gig count summary */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5 mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface">
                <span className="text-primary font-bold">{filteredGigs.length}</span> gig{filteredGigs.length !== 1 ? 's' : ''} available
                {selectedCategory !== 'All Types' && <span className="text-on-surface-variant"> in {selectedCategory}</span>}
              </p>
              {selectedCategory !== 'All Types' && (
                <button
                  onClick={() => setSelectedCategory('All Types')}
                  className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 cursor-pointer"
                >
                  <X size={13} /> Clear filter
                </button>
              )}
            </div>

            {/* Gig Cards Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
              {filteredGigs.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-sm">No gigs found for this filter.</p>
                  <button onClick={() => setSelectedCategory('All Types')} className="mt-2 text-xs text-primary hover:underline cursor-pointer">
                    Show all gigs
                  </button>
                </div>
              ) : (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGigs.map((g) => (
                    <div key={g.id} className="rounded-2xl bg-white border border-outline-variant p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      {g.imageUrl && (
                        <div className="w-full h-32 rounded-xl overflow-hidden mb-4 bg-surface-container">
                          <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-on-surface text-sm leading-tight">{g.title}</h3>
                          <span className="font-bold text-primary text-sm shrink-0">{g.rate}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1 font-medium">{g.employer}</p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1"><MapPin size={11} />{g.locationName}</span>
                          {g.duration && <span className="flex items-center gap-1"><Clock size={11} />{g.duration}</span>}
                          {g.isInstant && (
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Zap size={11} />Instant
                            </span>
                          )}
                        </div>

                        {g.description && (
                          <p className="text-xs mt-3 text-gray-500 line-clamp-2 leading-relaxed">{g.description}</p>
                        )}

                        {g.tags && g.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {g.tags.map(tag => (
                              <span key={tag} className="text-[10px] bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-full border border-outline-variant/60">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{g.distance}</span>
                        <div className="flex gap-2">
                          {/* FIX: View Details button now has an onClick that opens the detail modal */}
                          <button
                            onClick={() => setSelectedGig(g)}
                            className="text-xs font-bold py-1.5 px-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleApply(g.id)}
                            disabled={appliedGigs.has(g.id)}
                            className={`text-xs font-bold py-1.5 px-4 rounded-lg transition-all cursor-pointer ${
                              appliedGigs.has(g.id)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            {appliedGigs.has(g.id) ? '✓ Applied' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </>
        )}
      </div>

      {/* FIX: Gig Detail Modal — "View Details" previously had no handler at all */}
      {selectedGig && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedGig(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {selectedGig.imageUrl && (
              <div className="w-full h-48 bg-surface-container">
                <img src={selectedGig.imageUrl} alt={selectedGig.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="font-bold text-xl text-on-surface leading-tight">{selectedGig.title}</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5 font-medium">{selectedGig.employer}</p>
                </div>
                <button onClick={() => setSelectedGig(null)} className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-bold">Pay Rate</p>
                  <p className="font-bold text-primary text-lg mt-0.5">{selectedGig.rate}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-bold">Duration</p>
                  <p className="font-bold text-on-surface text-lg mt-0.5">{selectedGig.duration || 'TBC'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" />{selectedGig.locationName} • {selectedGig.distance}</span>
                {selectedGig.isInstant && (
                  <span className="flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Zap size={11} />Instant Hire
                  </span>
                )}
                <span className="text-xs bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant">{selectedGig.category}</span>
              </div>

              {selectedGig.description && (
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide mb-1">About This Gig</p>
                  <p className="text-sm text-on-surface leading-relaxed">{selectedGig.description}</p>
                </div>
              )}

              {selectedGig.tags && selectedGig.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedGig.tags.map(tag => (
                    <span key={tag} className="text-xs bg-primary/5 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setSelectedGig(null)}
                  className="flex-1 py-3 border border-outline-variant rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleApply(selectedGig.id);
                    setSelectedGig(null);
                  }}
                  disabled={appliedGigs.has(selectedGig.id)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    appliedGigs.has(selectedGig.id)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-md'
                  }`}
                >
                  {appliedGigs.has(selectedGig.id) ? '✓ Already Applied' : 'Apply for This Gig'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-surface border-t border-outline-variant py-2 flex justify-around items-center shadow-lg">
        <button
          onClick={() => onNavigate(AppView.Landing)}
          className="flex flex-col items-center text-on-surface-variant"
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>
        <button
          onClick={() => onNavigate(AppView.WorkerBrowse)}
          className="flex flex-col items-center text-primary"
        >
          <div className="p-1 px-4 bg-primary-container/20 text-primary rounded-full">
            <Briefcase size={20} />
          </div>
          <span className="text-[10px] font-bold mt-1">My Gigs</span>
        </button>
        <button
          onClick={() => onNavigate(AppView.WorkerReliability)}
          className="flex flex-col items-center text-on-surface-variant"
        >
          <User size={20} />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </div>
    </div>
  );
}
