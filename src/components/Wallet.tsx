// components/Wallet.tsx - Employer version (no top-up, only payouts)
import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet as WalletIcon, CreditCard, Send, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

export default function Wallet() {
  const { user, userRole } = useAuth();
  const [totalPaid, setTotalPaid] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);

  useEffect(() => {
    fetchWalletData();
    fetchWorkers();
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Get total paid to workers
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('employer_id', user?.id)
        .eq('status', 'completed');
      
      const total = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      setTotalPaid(total);
      
      // Get pending payments
      const { data: pending } = await supabase
        .from('payments')
        .select('amount')
        .eq('employer_id', user?.id)
        .eq('status', 'pending');
      
      const pendingTotal = pending?.reduce((sum, p) => sum + p.amount, 0) || 0;
      setPendingPayments(pendingTotal);
      
      // Get transactions
      const { data: txns } = await supabase
        .from('payments')
        .select('*, workers:worker_id(full_name, email)')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setTransactions(txns || []);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await supabase
        .from('hired_workers')
        .select('*, profiles:worker_id(full_name, email)')
        .eq('employer_id', user?.id)
        .eq('status', 'verified')
        .eq('payment_status', 'pending');
      
      setWorkers(data || []);
    } catch (err) {
      console.error('Error fetching workers:', err);
    }
  };

  const processPayout = async () => {
    if (!selectedWorker || !payoutAmount) return;
    
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          employer_id: user?.id,
          worker_id: selectedWorker.worker_id,
          gig_id: selectedWorker.gig_id,
          amount: parseFloat(payoutAmount),
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setToastMessage(`✅ Payment of RM ${payoutAmount} initiated to ${selectedWorker.profiles?.full_name}`);
      setTimeout(() => setToastMessage(null), 4000);
      
      setShowPayoutModal(false);
      setSelectedWorker(null);
      setPayoutAmount('');
      fetchWalletData();
      
    } catch (err) {
      console.error('Error processing payout:', err);
      setToastMessage('❌ Failed to process payment');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-on-surface">Payment Wallet</h2>
        <p className="text-sm text-on-surface-variant">Manage worker payments and payouts</p>
      </div>
      
      {/* Balance Cards - Employer Version */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-6">
          <p className="text-sm opacity-90">Total Paid to Workers</p>
          <p className="text-3xl font-bold">RM {totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-on-surface-variant">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-600">RM {pendingPayments.toFixed(2)}</p>
          {workers.length > 0 && (
            <button 
              onClick={() => setShowPayoutModal(true)}
              className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Send size={14} /> Pay Workers ({workers.length})
            </button>
          )}
        </div>
      </div>
      
      {/* Recent Payments */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="font-semibold text-lg mb-4">Recent Payments</h3>
        
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign size={40} className="mx-auto text-on-surface-variant mb-3" />
            <p className="text-on-surface-variant">No payments made yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-3">
                  <ArrowDownRight className="text-red-600" />
                  <div>
                    <p className="font-semibold text-sm">Payment to {tx.workers?.full_name || 'Worker'}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">- RM {tx.amount.toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPayoutModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-primary">Make Payment</h3>
                <button onClick={() => setShowPayoutModal(false)}><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Select Worker</label>
                  <select 
                    value={selectedWorker?.worker_id || ''} 
                    onChange={(e) => {
                      const worker = workers.find(w => w.worker_id === e.target.value);
                      setSelectedWorker(worker);
                    }}
                    className="w-full px-4 py-2 rounded-xl border text-sm"
                  >
                    <option value="">Select a worker...</option>
                    {workers.map((worker) => (
                      <option key={worker.worker_id} value={worker.worker_id}>
                        {worker.profiles?.full_name} - {worker.gig_title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1">Amount (RM)</label>
                  <input 
                    type="number" 
                    value={payoutAmount} 
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-xl border text-sm"
                  />
                </div>
                
                {selectedWorker && payoutAmount && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-on-surface-variant">Payment will be sent to:</p>
                    <p className="font-semibold text-sm">{selectedWorker.profiles?.full_name}</p>
                    <p className="text-xs">Bank: {selectedWorker.bank_name || 'Not specified'}</p>
                    <p className="text-xs">Account: {selectedWorker.bank_account || 'Not specified'}</p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button onClick={() => setShowPayoutModal(false)} className="flex-1 py-2 border rounded-xl text-sm font-medium">Cancel</button>
                  <button 
                    onClick={processPayout} 
                    disabled={!selectedWorker || !payoutAmount}
                    className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    Process Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
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

// Add X icon if not imported
const X = ({ size, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);