import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById } from '../api/booking';
import { QRCodeCanvas } from 'qrcode.react';

const Ticket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await getBookingById(id);
        setBooking(res.data || res);
      } catch (err) {
        setError('Failed to load ticket information.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return <div className="text-center py-16 text-tertiary animate-pulse">Retrieving Ticket...</div>;
  if (error) return <div className="text-center py-16 text-[#ffb4ab]">{error}</div>;
  if (!booking) return <div className="text-center py-16 text-tertiary">Ticket not found.</div>;

  const lot = booking.slotId?.parkingLotId;
  const slot = booking.slotId;
  const destination = lot?.coordinates?.lat && lot?.coordinates?.lng 
    ? `${lot.coordinates.lat},${lot.coordinates.lng}` 
    : encodeURIComponent(lot?.address || lot?.name);

  // Payload for QR Code
  const qrPayload = JSON.stringify({
    reservationId: booking._id,
    slotNumber: slot?.slotNumber,
    type: booking.reservationType,
    createdAt: booking.createdAt
  });

  return (
    <div className="max-w-md mx-auto py-12 text-on-surface">
      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <h3 className="font-display text-3xl text-primary mb-6 font-bold tracking-wide leading-tight text-center">
          Active Pass
        </h3>
        
        {/* QR Code Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#e2e2e8] p-4 rounded-2xl shadow-[0_0_20px_theme(colors.primary.container)] mb-3">
            <QRCodeCanvas 
              value={qrPayload} 
              size={180} 
              bgColor={"#e2e2e8"} 
              fgColor={"#0a0a0c"} 
              includeMargin={true}
            />
          </div>
          <p className="text-tertiary text-[10px] text-center uppercase tracking-[0.2em] font-bold">
            Present at terminal camera
          </p>
        </div>

        {/* Details Section */}
        <div className="w-full bg-surface-highest rounded-2xl p-6 mb-8 border border-outline-variant/10">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
              <span className="text-tertiary">Location</span>
              <span className="font-bold text-on-surface text-right max-w-[180px] truncate" title={lot?.name}>
                {lot?.name || 'Unknown Lot'}
              </span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
              <span className="text-tertiary">Slot Number</span>
              <span className="font-display font-bold text-xl text-primary">
                {slot?.slotNumber || 'N/A'}
                <span className="text-[10px] uppercase text-tertiary ml-2 font-body font-normal tracking-wider">
                  ({booking.reservationType || 'hourly'})
                </span>
              </span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
              <span className="text-tertiary">Amount Paid</span>
              <span className="font-bold text-secondary text-lg">
                ₹{booking.totalPrice || '?'}
              </span>
            </div>
            
            <div className="flex justify-between items-start pt-1">
              <span className="text-tertiary">Time Block</span>
              <div className="text-right">
                <div className="font-bold text-on-surface">
                  {booking.startTime ? new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                </div>
                <div className="text-xs text-tertiary mt-1">
                  to {booking.endTime ? new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'End'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-4 rounded-full font-bold text-sm text-center bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            Navigate to Location
          </a>
          
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full py-3 text-secondary text-[11px] uppercase font-bold tracking-[0.1em] hover:bg-surface-bright rounded-full transition-all border border-transparent hover:border-surface-variant"
          >
            Return to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default Ticket;
