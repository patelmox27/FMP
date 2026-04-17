import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSlotsByParkingLot, getParkingLotById } from '../api/parking';
import { createBooking } from '../api/booking';
import { createPaymentOrder, verifyPaymentSignature } from '../api/payment';
import io from 'socket.io-client';
import { QRCodeCanvas } from 'qrcode.react';

const ParkingDetails = () => {
  const { id } = useParams();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [reservationType, setReservationType] = useState('hourly'); // Added type state
  const [ticketData, setTicketData] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);

  // ✨ WebSockets for Live Updates
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true
    });

    socket.on('slotUpdated', (data) => {
      // Only process updates for the current parking lot
      if (id && data.parkingLotId === id) {
        setSlots(prevSlots => prevSlots.map(s => 
          s._id === data.slotId ? { ...s, status: data.status } : s
        ));
      }
    });

    return () => socket.disconnect();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lotRes = await getParkingLotById(id);
        setLot(lotRes.data || lotRes);

        const slotRes = await getSlotsByParkingLot(id);
        const fetchedSlots = slotRes.data || slotRes || [];
        setSlots(fetchedSlots.sort((a,b) => {
          const numA = parseInt(a.slotNumber.replace(/\D/g,'')) || 0;
          const numB = parseInt(b.slotNumber.replace(/\D/g,'')) || 0;
          return numA - numB;
        }));
      } catch (err) {
        setError('Failed to retrieve location telemetry.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBooking = async () => {
    if (!selectedSlot) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Authentication Required: Please log in to initialize booking.");
      return;
    }

    setBookingStatus('loading');

    try {
      const userStr = localStorage.getItem('user');
      let userId = "6612d6a4c21e646274b7c123";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user._id || user.id || userId;
        } catch (e) {}
      }

      // Compute simple dummy endTime for visuals based on type
      let durationHours = 2; // default hourly block
      if (reservationType === 'daily') durationHours = 24;
      if (reservationType === 'monthly') durationHours = 24 * 30;

      let createdBooking = currentBooking;

      if (!createdBooking) {
        const bookingData = {
          userId,
          slotId: selectedSlot._id,
          vehicleId: "6612d6a4c21e646274b7c124", 
          reservationType: reservationType, // passing new field
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
        };

        const bookingResponse = await createBooking(bookingData);
        createdBooking = bookingResponse.data || bookingResponse;

        if (!createdBooking || !createdBooking.totalPrice) {
           throw new Error("Unable to fetch price details for booking.");
        }
        
        setCurrentBooking(createdBooking);
      }

      // Step 2: Create Razorpay Order
      const order = await createPaymentOrder(createdBooking.totalPrice);
      
      // Step 3: Open Razorpay checkout modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SaZnNyZkZiGG6J",
        amount: order.amount,
        currency: order.currency,
        name: "Find My Parking",
        description: "Parking Booking Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            await verifyPaymentSignature({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              reservationId: createdBooking._id,
              amount: order.amount / 100
            });
            
            // Payment Success Block
            setBookingStatus('success');
            setTicketData({
              reservationId: createdBooking._id,
              slotNumber: selectedSlot.slotNumber,
              type: reservationType,
              createdAt: new Date().toISOString()
            });

            // Note: Optimistic UI update is no longer strictly necessary if Sockets are fast, 
            // but we can keep it inside for zero-latency feedback on local client.
            const newSlots = [...slots];
            const slotIndex = newSlots.findIndex(s => s._id === selectedSlot._id);
            if (slotIndex !== -1) {
              newSlots[slotIndex].status = "reserved";
              setSlots(newSlots);
            }
            // Removed setTimeout so the user can look at their QR code endlessly until manual dismissal

          } catch (err) {
            console.error("Payment Verification Error:", err);
            alert("Payment Verification Failed! Your booking is partially complete.");
            setBookingStatus('error');
            setTimeout(() => setBookingStatus(null), 3000);
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem('user'))?.Name || "User",
          email: JSON.parse(localStorage.getItem('user'))?.email || "user@example.com",
        },
        theme: {
          color: "#8338ec" // From Tailwind config or design system approximation
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
        setBookingStatus('error');
        setTimeout(() => setBookingStatus(null), 3000);
      });
      paymentObject.open();

    } catch (err) {
      console.error("Booking error:", err.response?.data || err);
      const msg = err.response?.data?.message || err.message;
      alert(`Booking Failed: ${msg}`);
      setBookingStatus('error');
      setTimeout(() => setBookingStatus(null), 3000);
    }
  };

  if (loading) return <div className="text-center py-16 text-tertiary animate-pulse">Establishing Connection...</div>;
  if (error) return <div className="text-center py-16 text-[#ffb4ab]">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 text-on-surface">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-4xl mb-2">{lot?.name || 'Lot Details'}</h1>
          <p className="text-tertiary text-lg">{lot?.address}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-tertiary uppercase font-bold tracking-wider mb-1">BASE RATE</div>
          <div className="font-display text-4xl font-bold text-secondary">₹{lot?.pricePerHour || 50}<span className="text-sm text-tertiary font-body font-normal">/hr</span></div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* LEFT SIDE: MAP VIEW */}
        <div className="flex-1 bg-surface-container rounded-3xl p-8 border border-outline-variant/10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
            <h2 className="font-display text-2xl font-semibold text-primary">Floor Plan Map</h2>
            <div className="flex gap-4 text-xs font-bold tracking-wider">
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-secondary rounded-sm"></div> AVAILABLE</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/50 rounded-sm"></div> OCCUPIED</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-tertiary/50 rounded-sm"></div> RESERVED</span>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8">
            {slots.map(slot => {
              const isAvailable = slot.status === 'available';
              const isOccupied = slot.status === 'occupied';
              const isSelected = selectedSlot?._id === slot._id;
              
              let slotStyle = '';
              if (slot.slotType === "ev") slotStyle = "text-green-400 border-green-500/30";
              if (slot.slotType === "handicap") slotStyle = "text-blue-400 border-blue-500/30";

              return (
                <button 
                  key={slot._id}
                  onClick={() => { setSelectedSlot(slot); setCurrentBooking(null); }}
                  className={`
                    h-24 rounded-lg flex flex-col justify-center items-center transition-all duration-300 font-display font-bold
                    ${isAvailable ? 'bg-surface-highest hover:bg-surface-bright border border-secondary/30' : ''}
                    ${isOccupied ? 'bg-surface-lowest text-tertiary/30 border border-outline-variant/10 cursor-not-allowed' : ''}
                    ${slot.status === 'reserved' ? 'bg-surface-lowest border-dashed border-tertiary/50 text-tertiary cursor-not-allowed' : ''}
                    ${isSelected && isAvailable ? 'bg-secondary-fixed text-surface shadow-[0_0_20px_theme(colors.secondary.container)] scale-105 border-transparent z-10 !text-surface' : slotStyle}
                  `}
                  disabled={!isAvailable}
                >
                  <span className={`text-xl ${isSelected ? 'text-surface' : (isAvailable && !slotStyle ? 'text-secondary' : '')}`}>
                    {slot.slotNumber}
                  </span>
                  <span className={`text-[9px] uppercase font-body mt-1 ${isSelected ? 'text-surface/70' : 'text-tertiary/70'}`}>
                    {slot.slotType || 'regular'}
                  </span>
                </button>
              );
            })}
            {slots.length === 0 && (
              <div className="col-span-full text-center text-tertiary py-12 border border-dashed border-outline-variant/30 rounded-xl">
                No telemetry available for this monolith layout.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: SLOT DETAILS */}
        <div className="lg:w-96 flex flex-col gap-6">
          <div className="bg-surface-low rounded-3xl p-8 border border-outline-variant/10 sticky top-32">
            <h2 className="font-display text-2xl font-semibold mb-6 border-b border-outline-variant/20 pb-4 text-tertiary">Terminal Info</h2>
            
            {!selectedSlot ? (
              <div className="text-tertiary text-center py-16 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-dashed border-tertiary/30 flex items-center justify-center mb-2">?</div>
                <p>Select an available slot from the map to view details and proceed.</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col h-full">
             // Dynamic View Area
             (bookingStatus === 'success' && ticketData) ? (
                <div className="flex flex-col items-center py-4 h-full overflow-y-auto" style={{scrollbarWidth: 'none'}}>
                  <h3 className="font-display text-2xl text-primary mb-4 font-bold tracking-wide leading-tight text-center">Booking <br /> Confirmed</h3>
                  <div className="bg-[#e2e2e8] p-3 rounded-xl shadow-[0_0_20px_theme(colors.primary.container)] mb-2 shrink-0">
                    <QRCodeCanvas 
                      value={JSON.stringify(ticketData)} 
                      size={140} 
                      bgColor={"#e2e2e8"} 
                      fgColor={"#0a0a0c"} 
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-tertiary text-[10px] text-center uppercase tracking-[0.2em] font-bold mb-6">Present at terminal camera</p>

                  {/* Booking Info Card */}
                  <div className="w-full bg-surface-highest rounded-2xl p-5 mb-6 border border-outline-variant/10">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                        <span className="text-tertiary">Location</span>
                        <span className="font-bold text-on-surface text-right w-40 truncate">{lot?.name}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                        <span className="text-tertiary">Slot Number</span>
                        <span className="font-bold text-on-surface">{selectedSlot?.slotNumber} <span className="text-[10px] uppercase text-tertiary">({reservationType})</span></span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                        <span className="text-tertiary">Amount Paid</span>
                        <span className="font-bold text-secondary text-lg">₹{currentBooking?.totalPrice || '?'}</span>
                      </div>
                      <div className="flex justify-between items-start pt-1">
                        <span className="text-tertiary">Time Block</span>
                        <div className="text-right">
                          <div className="font-bold text-on-surface">
                            {currentBooking?.startTime ? new Date(currentBooking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                          </div>
                          <div className="text-xs text-tertiary">
                            to {currentBooking?.endTime ? new Date(currentBooking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'End'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full mt-auto">
                    {(() => {
                        const destination = lot?.coordinates?.lat && lot?.coordinates?.lng 
                          ? `${lot.coordinates.lat},${lot.coordinates.lng}` 
                          : encodeURIComponent(lot?.address || lot?.name);
                        return (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-3 rounded-full font-bold text-sm text-center bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/30"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                            Navigate to Location
                          </a>
                        );
                    })()}
                    <button 
                      onClick={() => { setSelectedSlot(null); setBookingStatus(null); setTicketData(null); setCurrentBooking(null); }} 
                      className="w-full py-3 text-secondary text-[11px] uppercase font-bold tracking-[0.1em] hover:bg-surface-bright rounded-full transition-all border border-transparent hover:border-surface-variant"
                    >
                      Return to Map
                    </button>
                  </div>
                </div>
              ) : (
                <>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <div className="text-xs font-bold tracking-widest text-primary mb-1 uppercase">Selected Node</div>
                    <div className="font-display text-6xl font-bold text-on-surface leading-none">{selectedSlot.slotNumber}</div>
                  </div>
                  <div className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase border border-secondary/30">
                    {selectedSlot.status}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-tertiary uppercase text-sm font-bold">Type</span>
                    <span className="text-on-surface capitalize">{selectedSlot.slotType || 'regular'}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-tertiary uppercase text-sm font-bold">Price</span>
                    <span className="text-on-surface">Dynamic</span>
                  </div>
                </div>

                {/* Reservation Types */}
                <div className="mb-10">
                  <span className="text-tertiary uppercase text-xs tracking-wider font-bold block mb-3">Reservation Block</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setReservationType('hourly')} 
                      className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border ${reservationType === 'hourly' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'}`}
                    >
                      Hourly
                    </button>
                    <button 
                      onClick={() => setReservationType('daily')} 
                      className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border ${reservationType === 'daily' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'}`}
                    >
                      Daily
                    </button>
                    <button 
                      onClick={() => setReservationType('monthly')} 
                      className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border ${reservationType === 'monthly' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'}`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleBooking}
                  disabled={bookingStatus === 'loading'}
                  className={`w-full py-4 rounded-full font-display font-bold text-lg transition-all ${
                    bookingStatus === 'loading' ? 'bg-surface-bright text-tertiary cursor-wait' :
                    bookingStatus === 'error' ? 'bg-red-900 text-[#ffb4ab]' :
                    'bg-gradient-to-br from-secondary-fixed to-secondary-container text-surface hover:shadow-[0_0_30px_theme(colors.secondary.container)] hover:-translate-y-1'
                  }`}
                >
                  {bookingStatus === 'loading' ? 'Processing...' : 
                   bookingStatus === 'error' ? 'Retry Booking' :
                   'Initialize Booking'}
                </button>
                </>
              )
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetails;
