// components/EmployerSettings.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Building, Save, Camera, Shield, Bell, CreditCard } from 'lucide-react';

export default function EmployerSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_address: '',
    business_type: '',
    avatar_url: ''
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    new_applicant_alert: true,
    payment_alerts: true
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (!error && data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          business_name: data.business_name || '',
          business_address: data.business_address || '',
          business_type: data.business_type || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          business_name: profile.business_name,
          business_address: profile.business_address,
          business_type: profile.business_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      setToastMessage('✅ Profile updated successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setToastMessage('❌ Failed to update profile');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-on-surface">Settings</h2>
        <p className="text-sm text-on-surface-variant">Manage your account settings and preferences</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><User size={20} /> Profile Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Full Name</label>
                <input type="text" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border focus:outline-primary text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1">Email</label>
                <input type="email" value={profile.email} disabled className="w-full px-4 py-2 rounded-xl border bg-gray-50 text-sm" />
                <p className="text-[10px] text-on-surface-variant mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1">Phone Number</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border focus:outline-primary text-sm" placeholder="+6012-3456789" />
              </div>
            </div>
          </div>
          
          {/* Business Section */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Building size={20} /> Business Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Business Name</label>
                <input type="text" value={profile.business_name} onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border focus:outline-primary text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1">Business Type</label>
                <select value={profile.business_type} onChange={(e) => setProfile({...profile, business_type: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border focus:outline-primary text-sm">
                  <option value="">Select business type</option>
                  <option value="Cafe/Restaurant">Cafe/Restaurant</option>
                  <option value="Retail">Retail</option>
                  <option value="Event Management">Event Management</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1">Business Address</label>
                <textarea rows={2} value={profile.business_address} onChange={(e) => setProfile({...profile, business_address: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border focus:outline-primary text-sm" placeholder="Full business address" />
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Bell size={20} /> Notification Preferences</h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Email Notifications</span>
                <input type="checkbox" checked={notifications.email_notifications} onChange={(e) => setNotifications({...notifications, email_notifications: e.target.checked})}
                  className="w-5 h-5 text-primary rounded" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">New Applicant Alerts</span>
                <input type="checkbox" checked={notifications.new_applicant_alert} onChange={(e) => setNotifications({...notifications, new_applicant_alert: e.target.checked})}
                  className="w-5 h-5 text-primary rounded" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Payment Alerts</span>
                <input type="checkbox" checked={notifications.payment_alerts} onChange={(e) => setNotifications({...notifications, payment_alerts: e.target.checked})}
                  className="w-5 h-5 text-primary rounded" />
              </label>
            </div>
          </div>
          
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <span className="animate-spin">⏳</span> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
      
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