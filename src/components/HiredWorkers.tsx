// components/HiredWorkers.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Clock, CheckCircle, Star, Send, X, Calendar, 
  MapPin, Award, ThumbsUp, MessageCircle, Filter, Search
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface HiredWorker {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_avatar: string;
  gig_title: string;
  gig_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  status: 'active' | 'completed' | 'verified';
  rating_given: boolean;
}

const DEFAULT_REVIEWS = [
  'Excellent worker! Very punctual and hardworking.',
  'Great attitude, completed all tasks perfectly.',
  'Professional and reliable. Would hire again.',
  'Good communication skills, followed instructions well.',
  'Satisfactory work, met all expectations.',
  'Needs improvement in punctuality but good work ethic.'
];

const DEFAULT_RATINGS = [5, 4, 3];

export default function HiredWorkers() {
  const { user } = useAuth();
  const [hiredWorkers, setHiredWorkers] = useState<HiredWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<HiredWorker | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedDefaultReview, setSelectedDefaultReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'verified'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHiredWorkers();
  }, [user]);

  const fetchHiredWorkers = async () => {
    setLoading(true);
    try {
      // Mock data for MVP
      setHiredWorkers([
        {
          id: '1',
          worker_id: 'worker1',
          worker_name: 'Ahmad Rosli',
          worker_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          gig_title: 'Cafe Assistant',
          gig_id: 'gig1',
          clock_in_time: new Date().toISOString(),
          clock_out_time: null,
          status: 'active',
          rating_given: false
        },
        {
          id: '2',
          worker_id: 'worker2',
          worker_name: 'Nurul Hidayah',
          worker_avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          gig_title: 'Event Crew',
          gig_id: 'gig2',
          clock_in_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          clock_out_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          rating_given: false
        }
      ]);
    } catch (err) {
      console.error('Error fetching hired workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (worker: HiredWorker) => {
    setSelectedWorker(worker);
    setShowReviewModal(true);
  };

  const submitReviewWithAI = async () => {
    if (!selectedWorker) return;
    
    setIsSubmitting(true);
    
    try {
      // Send to AI for sentiment analysis
      const prompt = `
        Analyze this worker review: "${reviewText}"
        Rating given: ${rating}/5
        
        Determine if the review sentiment matches the rating.
        Return JSON: { "sentiment": "positive|neutral|negative", "adjusted_rating": number, "confidence": number }
      `;
      
      let aiAnalysis = { sentiment: 'positive', adjusted_rating: rating, confidence: 0.9 };
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        aiAnalysis = JSON.parse(response.text);
      } catch (err) {
        console.log('AI unavailable, using default');
      }
      
      // Save review to database
      const { error } = await supabase
        .from('reviews')
        .insert({
          worker_id: selectedWorker.worker_id,
          employer_id: user?.id,
          gig_id: selectedWorker.gig_id,
          rating: aiAnalysis.adjusted_rating,
          comment: reviewText,
          sentiment: aiAnalysis.sentiment,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update worker status
      await supabase
        .from('hired_workers')
        .update({ status: 'verified', rating_given: true })
        .eq('id', selectedWorker.id);
      
      setToastMessage('✅ Review submitted! Worker reliability score updated.');
      setTimeout(() => setToastMessage(null), 4000);
      
      setShowReviewModal(false);
      fetchHiredWorkers();
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setToastMessage('❌ Failed to submit review. Please try again.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyDefaultReview = (review: string, defaultRating: number) => {
    setSelectedDefaultReview(review);
    setReviewText(review);
    setRating(defaultRating);
  };

  const filteredWorkers = hiredWorkers
    .filter(w => statusFilter === 'all' || w.status === statusFilter)
    .filter(w => w.worker_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-on-surface">Hired Workers</h2>
        <p className="text-sm text-on-surface-variant">Track worker attendance and submit reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <p className="text-xs text-on-surface-variant">Active Shifts</p>
          <p className="text-2xl font-bold text-primary">{hiredWorkers.filter(w => w.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <p className="text-xs text-on-surface-variant">Completed (Pending Review)</p>
          <p className="text-2xl font-bold text-amber-600">{hiredWorkers.filter(w => w.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4">
          <p className="text-xs text-on-surface-variant">Verified & Rated</p>
          <p className="text-2xl font-bold text-green-600">{hiredWorkers.filter(w => w.status === 'verified').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-white border'}`}>All</button>
          <button onClick={() => setStatusFilter('active')} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'active' ? 'bg-primary text-white' : 'bg-white border'}`}>Active</button>
          <button onClick={() => setStatusFilter('completed')} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'completed' ? 'bg-primary text-white' : 'bg-white border'}`}>Completed</button>
          <button onClick={() => setStatusFilter('verified')} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'verified' ? 'bg-primary text-white' : 'bg-white border'}`}>Verified</button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" placeholder="Search workers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border text-sm w-64 focus:outline-primary" />
        </div>
      </div>

      {/* Workers List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredWorkers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <Users size={48} className="mx-auto text-on-surface-variant mb-3" />
          <p className="text-on-surface-variant">No hired workers yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredWorkers.map((worker) => (
            <div key={worker.id} className="bg-white rounded-xl border border-outline-variant p-5 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <img src={worker.worker_avatar} alt={worker.worker_name} className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <h3 className="font-semibold text-on-surface">{worker.worker_name}</h3>
                    <p className="text-sm text-on-surface-variant">{worker.gig_title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Clock In: {formatTime(worker.clock_in_time)}</span>
                      </div>
                      {worker.clock_out_time && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>Clock Out: {formatTime(worker.clock_out_time)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(worker.clock_in_time)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {worker.status === 'active' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">● Active</span>
                  )}
                  {worker.status === 'completed' && !worker.rating_given && (
                    <button
                      onClick={() => handleVerify(worker)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
                    >
                      <ThumbsUp size={14} /> Verify & Review
                    </button>
                  )}
                  {worker.status === 'verified' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle size={12} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedWorker && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-primary">Verify & Review Worker</h3>
                <button onClick={() => setShowReviewModal(false)}><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img src={selectedWorker.worker_avatar} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{selectedWorker.worker_name}</p>
                    <p className="text-xs text-on-surface-variant">{selectedWorker.gig_title}</p>
                  </div>
                </div>

                {/* Quick Review Templates */}
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => applyDefaultReview(DEFAULT_REVIEWS[0], 5)} className="px-2 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">⭐ Excellent</button>
                    <button onClick={() => applyDefaultReview(DEFAULT_REVIEWS[1], 5)} className="px-2 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">👍 Great</button>
                    <button onClick={() => applyDefaultReview(DEFAULT_REVIEWS[2], 4)} className="px-2 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">😊 Satisfactory</button>
                    <button onClick={() => applyDefaultReview(DEFAULT_REVIEWS[4], 3)} className="px-2 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">👌 Acceptable</button>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                        <Star size={28} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? 'text-secondary' : 'text-gray-300'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Review Comment</label>
                  <textarea rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-primary text-sm" placeholder="Write your review here..." />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowReviewModal(false)} className="flex-1 py-2 border rounded-xl text-sm font-medium">Cancel</button>
                  <button onClick={submitReviewWithAI} disabled={isSubmitting}
                    className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}