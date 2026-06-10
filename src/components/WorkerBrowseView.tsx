import { useState, useMemo, useEffect } from 'react';
import { AppView, Gig } from '../types';
import { api } from '../services/api'; 
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Clock, Award, Sliders, Zap, Check } from 'lucide-react';

// Fix for default marker icons missing in Leaflet when bundled with Vite
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface WorkerBrowseViewProps {
  onNavigate: (view: AppView) => void;
  initialTab?: string;
}

export default function WorkerBrowseView({ onNavigate, initialTab }: WorkerBrowseViewProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Types');
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'Dashboard');
  const [userGigs, setUserGigs] = useState<Record<string, 'Applied' | 'Booked'>>({});

  // Fetch real data from your new Supabase dummy database setup
  useEffect(() => {
    async function loadGigs() {
      try {
        setLoading(true);
        const data = await api.getGigs();
        setGigs(data);
      } catch (err) {
        console.error("Database connection failure:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGigs();
  }, []);

  // Filter logic
  const filteredGigs = useMemo(() => {
    if (selectedCategory === 'All Types') return gigs;
    return gigs.filter(g => g.category === selectedCategory);
  }, [selectedCategory, gigs]);

  if (loading) return <div className="text-center py-20">Loading database records...</div>;

  return (
    <div className="bg-background min-h-screen pt-16">
      {activeTab === 'Dashboard' && (
        <>
          {/* REAL API INTEGRATION: Leaflet Live Map Engine focused on Kota Kinabalu coordinates */}
          <div className="w-full h-[350px] relative z-10 border-b border-outline-variant shadow-xs">
            <MapContainer 
              center={[6.0367, 116.1186]} 
              zoom={13} 
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Maps live dynamic markers directly out from Supabase row mappings */}
              {gigs.map((g) => (
                <Marker 
                  key={g.id} 
                  position={[
                    g.coords.lat || 6.0367 + (g.coords.y * 0.0002), 
                    g.coords.lng || 116.1186 + (g.coords.x * 0.0002)
                  ]}
                >
                  <Popup>
                    <div className="p-1 font-sans">
                      <h4 className="font-bold text-sm text-primary">{g.title}</h4>
                      <p className="text-xs font-semibold text-secondary">{g.rate} • {g.employer}</p>
                      <p className="text-[11px] mt-1 text-gray-600">{g.locationName}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Core Grid Cards Display */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGigs.map((g) => (
                <div key={g.id} className="rounded-xl bg-white border border-outline-variant p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-on-surface text-base">{g.title}</h3>
                      <span className="font-semibold text-secondary text-sm">{g.rate}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">{g.employer}</p>
                    <p className="text-xs mt-3 text-gray-600 line-clamp-2">{g.description}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{g.distance}</span>
                    <button className="bg-primary text-white text-xs font-bold py-1.5 px-4 rounded-lg hover:bg-primary/95 transition-all">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </div>
  );
}