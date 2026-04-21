import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  MapPin, 
  XCircle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { getBookingsByUser, cancelBooking, updateBooking } from '../api/booking';
import { getPaymentsByUser } from '../api/payment';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  // Inline extend reservation state
  const [extendBookingId, setExtendBookingId] = useState(null);
  const [extendHours, setExtendHours] = useState(1);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchData(userData._id);
    } else {
      setError("Please login to view your dashboard");
      setLoading(false);
    }
  }, []);

  const fetchData = async (userId) => {
    setLoading(true);
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        getBookingsByUser(userId),
        getPaymentsByUser(userId)
      ]);
      setBookings(bookingsRes.data || []);
      setPayments(paymentsRes || []);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Cancel this reservation?</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await cancelBooking(id);
                  toast.success('Reservation cancelled.');
                  fetchData(user._id);
                } catch {
                  toast.error('Failed to cancel reservation.');
                }
              }}
              style={{ padding: '0.3rem 0.9rem', borderRadius: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Yes, Cancel
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{ padding: '0.3rem 0.9rem', borderRadius: '0.5rem', background: 'transparent', color: '#e2e2e8', border: '1px solid #444', cursor: 'pointer' }}
            >
              Keep It
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  const handleExtendReservation = async (id) => {
    setExtendBookingId(id);
    setExtendHours(1);
  };

  const confirmExtend = async () => {
    const hours = Number(extendHours);
    if (!hours || hours < 1) { toast.error('Enter at least 1 hour.'); return; }
    const booking = bookings.find(b => b._id === extendBookingId);
    const newEndTime = new Date(new Date(booking.endTime).getTime() + hours * 60 * 60 * 1000);
    try {
      await updateBooking(extendBookingId, { endTime: newEndTime });
      toast.success(`Reservation extended by ${hours}h.`);
      setExtendBookingId(null);
      fetchData(user._id);
    } catch {
      toast.error('Failed to extend reservation.');
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="flex h-[60vh] items-center justify-center text-center px-6">
      <div className="max-w-md">
        <AlertCircle className="h-12 w-12 text-accent-red mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Something went wrong</h2>
        <p className="text-tertiary mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-full bg-primary text-white">Try Again</button>
      </div>
    </div>
  );

  const activeReservations = bookings.filter(b => b.status === 'active');
  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-on-surface mb-2">Hello, {user?.Name}</h1>
        <p className="text-tertiary">Manage your parking reservations and payment history.</p>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container p-6 rounded-3xl border border-surface-variant hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </span>
          </div>
          <h3 className="text-tertiary text-sm font-bold uppercase tracking-wider mb-1">Active Bookings</h3>
          <p className="text-4xl font-display font-bold text-on-surface">{activeReservations.length}</p>
        </div>

        <div className="bg-surface-container p-6 rounded-3xl border border-surface-variant hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-accent-amber/10 rounded-2xl">
              <CreditCard className="h-6 w-6 text-accent-amber" />
            </div>
          </div>
          <h3 className="text-tertiary text-sm font-bold uppercase tracking-wider mb-1">Total Spent</h3>
          <p className="text-4xl font-display font-bold text-on-surface">₹{totalSpent.toLocaleString()}</p>
        </div>

        <div className="hidden lg:block bg-gradient-to-br from-primary to-primary-container p-6 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <h3 className="text-on-primary/80 font-bold uppercase tracking-wider text-sm">Pro Tip</h3>
            <p className="text-on-primary text-lg font-medium">Extend your parking time directly from the dashboard to avoid overstay alerts.</p>
            <div className="flex items-center text-on-primary font-bold">
              Learn more <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-low rounded-[2rem] p-2 inline-flex gap-2 mb-8 border border-surface-variant">
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-primary text-white shadow-md' : 'text-tertiary hover:bg-surface-hover'}`}
        >
          Bookings
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-primary text-white shadow-md' : 'text-tertiary hover:bg-surface-hover'}`}
        >
          Payment History
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'bookings' ? (
        <div className="grid grid-cols-1 gap-4">
          {bookings.length === 0 ? (
            <div className="text-center py-20 bg-surface-container rounded-[2rem] border border-dashed border-surface-variant/50">
              <p className="text-tertiary">No bookings found. Time to go out?</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="bg-surface-container p-6 rounded-[2rem] border border-surface-variant flex flex-col md:flex-row justify-between items-center gap-6 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className={`p-4 rounded-3xl ${booking.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-surface-low text-tertiary'}`}>
                    <ParkingSlotIcon size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-xl font-bold text-on-surface">Slot {booking.slotId?.slotNumber || 'N/A'}</h3>
                       <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                         booking.status === 'active' ? 'bg-primary/10 text-primary' : 
                         booking.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                         'bg-accent-red/10 text-accent-red'
                       }`}>
                         {booking.status}
                       </span>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-tertiary mt-3">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" /> 
                        {new Date(booking.startTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})} 
                        <ArrowRight className="h-3 w-3 mx-2 opacity-50" /> 
                        {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {(() => {
                         const lot = booking.slotId?.parkingLotId;
                         const dest = lot?.coordinates?.lat && lot?.coordinates?.lng 
                           ? `${lot.coordinates.lat},${lot.coordinates.lng}` 
                           : encodeURIComponent(lot?.address || lot?.name || '');
                         return (
                           <a 
                             href={`https://www.google.com/maps/dir/?api=1&destination=${dest}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center w-fit hover:text-primary transition-colors hover:underline"
                           >
                             <MapPin className="h-4 w-4 mr-2" /> 
                             {lot?.name || 'Lot Info'}
                           </a>
                         );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-right">
                      <p className="text-xs font-bold text-tertiary uppercase tracking-widest mb-1">Price</p>
                      <p className="text-xl font-bold font-display">₹{booking.totalPrice}</p>
                   </div>

                   <div className="flex flex-wrap gap-2 justify-end mt-4 md:mt-0">
                     {booking.status === 'active' && (
                       <>
                         {(() => {
                           const lot = booking.slotId?.parkingLotId;
                           const dest = lot?.coordinates?.lat && lot?.coordinates?.lng 
                             ? `${lot.coordinates.lat},${lot.coordinates.lng}` 
                             : encodeURIComponent(lot?.address || lot?.name || '');
                           return (
                             <a 
                               href={`https://www.google.com/maps/dir/?api=1&destination=${dest}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="px-5 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-colors shadow-sm flex items-center gap-2 hidden lg:flex"
                             >
                               <MapPin className="h-4 w-4" />
                               Navigate
                             </a>
                           );
                         })()}
                         
                         <button 
                           onClick={() => navigate(`/ticket/${booking._id}`)}
                           className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
                         >
                           View Pass
                         </button>
                         
                         {extendBookingId === booking._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="24"
                                value={extendHours}
                                onChange={e => setExtendHours(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 px-2 py-1.5 rounded-lg bg-surface-low border border-outline-variant/30 text-sm text-center text-on-surface outline-none focus:border-primary/60"
                              />
                              <span className="text-xs text-tertiary">hrs</span>
                              <button
                                onClick={confirmExtend}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setExtendBookingId(null)}
                                className="px-3 py-1.5 rounded-lg border border-surface-variant text-xs text-tertiary"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleExtendReservation(booking._id)}
                              className="px-5 py-2.5 rounded-xl border border-surface-variant font-bold text-sm hover:bg-surface-hover transition-colors"
                            >
                              Extend
                            </button>
                          )}
                         
                         <button 
                           onClick={() => handleCancelReservation(booking._id)}
                           className="px-5 py-2.5 rounded-xl bg-accent-red/10 text-accent-red font-bold text-sm hover:bg-accent-red hover:text-white transition-all shadow-sm"
                         >
                           Cancel
                         </button>
                       </>
                     )}
                     {booking.status !== 'active' && (
                       <button className="p-2.5 rounded-xl border border-surface-variant hover:bg-surface-hover transition-colors">
                         <ChevronRight className="h-5 w-5" />
                       </button>
                     )}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-surface-variant bg-surface-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-low/50">
                <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase border-b border-surface-variant/50">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase border-b border-surface-variant/50">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase border-b border-surface-variant/50">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-tertiary uppercase border-b border-surface-variant/50 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                   <td colSpan="4" className="px-6 py-20 text-center text-tertiary">No transactions found</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="group hover:bg-surface-low transition-colors">
                    <td className="px-6 py-4 border-b border-surface-variant/10">
                       <p className="font-semibold text-on-surface">{new Date(payment.createdAt).toLocaleDateString()}</p>
                       <p className="text-xs text-tertiary">{new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="px-6 py-4 border-b border-surface-variant/10">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-low text-xs font-bold uppercase tracking-wider border border-surface-variant/30">
                          {payment.paymentMethod}
                       </span>
                    </td>
                    <td className="px-6 py-4 border-b border-surface-variant/10">
                       <div className="flex items-center gap-2">
                         {payment.paymentStatus === 'completed' ? (
                           <CheckCircle2 className="h-4 w-4 text-green-500" />
                         ) : (
                           <XCircle className="h-4 w-4 text-accent-red" />
                         )}
                         <span className={`text-sm font-medium ${payment.paymentStatus === 'completed' ? 'text-green-500' : 'text-accent-red'}`}>
                           {payment.paymentStatus}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 border-b border-surface-variant/10 text-right font-bold text-lg font-display">
                       ₹{payment.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Mini component for the icon
const ParkingSlotIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M9 17V7H12.5C14.433 7 16 8.567 16 10.5C16 12.433 14.433 14 12.5 14H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default Dashboard;
