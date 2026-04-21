import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSlotsByParkingLot, getParkingLotById } from '../api/parking';
import { createBooking } from '../api/booking';
import { createPaymentOrder, verifyPaymentSignature } from '../api/payment';
import io from 'socket.io-client';

const ParkingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [reservationType, setReservationType] = useState('hourly'); // Added type state
  const [selectedVehicleType, setSelectedVehicleType] = useState('car'); // Added vehicle type state
  const [ticketData, setTicketData] = useState(null);

  // Dynamic Time Selection State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }).slice(0,5));
  const [durationValue, setDurationValue] = useState(1);
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
      if (!userStr) {
        alert("Session expired. Please log in again.");
        setBookingStatus(null);
        return;
      }

      const parsedUser = JSON.parse(userStr);
      const userId = parsedUser._id || parsedUser.id;
      // vehicleId: use user's primary vehicle if present, otherwise let backend accept without it
      const vehicleId = parsedUser.vehicleId || parsedUser.vehicle?._id || userId; // fallback to userId so backend doesn't crash

      // Compute exact startTime and endTime
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      if (startDateTime < new Date(Date.now() - 5 * 60000)) { // Allow 5 minutes of grace
         alert("Cannot book a time in the past.");
         setBookingStatus(null);
         return;
      }

      let endDateTime = new Date(startDateTime);
      if (reservationType === 'hourly') {
        endDateTime.setHours(endDateTime.getHours() + Number(durationValue));
      } else if (reservationType === 'daily') {
        endDateTime.setDate(endDateTime.getDate() + Number(durationValue));
      } else if (reservationType === 'monthly') {
        endDateTime.setMonth(endDateTime.getMonth() + Number(durationValue));
      }

      let createdBooking = currentBooking;

      if (!createdBooking) {
        const bookingData = {
          userId,
          slotId: selectedSlot._id,
          reservationType: reservationType,
          vehicleCategory: selectedVehicleType,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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
            
            // Redirect to the dedicated Ticket page
            navigate('/ticket/' + createdBooking._id);

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

          {/* Vehicle Type Selector */}
          <div className="mb-6 flex justify-center">
            <div className="bg-surface-lowest rounded-full p-1 border border-outline-variant/20 flex gap-1 shadow-sm">
              {['car', 'bike'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedVehicleType(type);
                    setSelectedSlot(null); // Reset selection when changing type
                    setCurrentBooking(null);
                  }}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    selectedVehicleType === type 
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                      : 'text-tertiary hover:bg-surface-highest hover:text-on-surface'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8">
            {slots.filter(s => (s.vehicleCategory || 'car') === selectedVehicleType).length === 0 && slots.length > 0 ? (
              <div className="col-span-full text-center text-tertiary py-16 border border-dashed border-outline-variant/30 rounded-2xl bg-surface-lowest">
                <div className="text-4xl mb-4 opacity-50">🚫</div>
                <h3 className="font-display text-xl font-bold mb-2">No {selectedVehicleType.replace('_', ' ').toUpperCase()} Parking</h3>
                <p>There is no parking for {selectedVehicleType.replace('_', ' ')} in this lot.</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="col-span-full text-center text-tertiary py-12 border border-dashed border-outline-variant/30 rounded-xl">
                No telemetry available for this monolith layout.
              </div>
            ) : slots
              .filter(slot => (slot.vehicleCategory || 'car') === selectedVehicleType)
              .map(slot => {
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
             {bookingStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center py-16 h-full">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="font-display text-2xl text-primary font-bold tracking-wide">Securing Pass...</h3>
                  <p className="text-tertiary mt-2 text-sm">Redirecting to your active ticket.</p>
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
                <div className="mb-6">
                  <span className="text-tertiary uppercase text-xs tracking-wider font-bold block mb-3">Reservation Block</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => { setReservationType('hourly'); setDurationValue(1); }} 
                      className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border ${reservationType === 'hourly' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'}`}
                    >
                      Hourly
                    </button>
                    <button 
                      onClick={() => { setReservationType('daily'); setDurationValue(1); }} 
                      className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border ${reservationType === 'daily' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'}`}
                    >
                      Daily
                    </button>
                    <button 
                      onClick={() => { setReservationType('monthly'); setDurationValue(1); }} 
                      className={`py-3 px-2 text-xs font-bold rounded-xl transition-all border ${reservationType === 'monthly' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'}`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Dynamic Time Selection */}
                <div className="mb-10 bg-surface-lowest p-4 rounded-2xl border border-outline-variant/10">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] text-tertiary uppercase font-bold tracking-wider mb-1 block">Start Date</label>
                        <input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-surface-card border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50"
                        />
                      </div>
                      {reservationType === 'hourly' && (
                        <div className="flex-1">
                          <label className="text-[10px] text-tertiary uppercase font-bold tracking-wider mb-1 block">Start Time</label>
                          <input 
                            type="time" 
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full bg-surface-card border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-tertiary uppercase font-bold tracking-wider mb-1 block">
                        Duration ({reservationType === 'hourly' ? 'Hours' : reservationType === 'daily' ? 'Days' : 'Months'})
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        max={reservationType === 'hourly' ? 24 : reservationType === 'daily' ? 30 : 12}
                        value={durationValue}
                        onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-surface-card border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50"
                      />
                    </div>
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
              )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetails;
