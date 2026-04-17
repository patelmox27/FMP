import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const AdminSlots = () => {
  const { id } = useParams();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const lotRes = await apiClient.get(`/parking/${id}`);
      setLot(lotRes.data.data || lotRes.data);

      const slotsRes = await apiClient.get(`/parking/slots/${id}`);
      const fetchedSlots = slotsRes.data.data || slotsRes.data || [];
      
      const sorted = fetchedSlots.sort((a,b) => {
        const numA = parseInt(a.slotNumber.replace(/\D/g,'')) || 0;
        const numB = parseInt(b.slotNumber.replace(/\D/g,'')) || 0;
        return numA - numB;
      });
      setSlots(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async () => {
    if (!lot) return;
    try {
      await apiClient.post('/parking/slots', {
        parkingLotId: id,
        numberOfSlots: lot.totalSlots,
        slotType: 'regular'
      });
      fetchData();
    } catch (err) {
      alert("Failed to initialize structural grid");
    }
  };

  const updateSlotType = async (newType) => {
    if (!selectedSlot) return;
    try {
      await apiClient.put(`/parking/slots/${selectedSlot._id}`, {
        slotType: newType
      });
      
      const newSlots = [...slots];
      const i = newSlots.findIndex(s => s._id === selectedSlot._id);
      if(i > -1) {
        newSlots[i].slotType = newType;
        setSlots(newSlots);
      }
      setSelectedSlot(newSlots[i]);
    } catch (err) {
      alert("Failed to reconfigure node");
    }
  };

  if (loading) return <div className="text-center py-16 animate-pulse text-tertiary">Accessing Grid Subsystem...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 text-on-surface">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <Link to="/admin/lots" className="text-primary hover:text-primary-container font-bold text-sm mb-2 inline-flex items-center gap-1">← Return to Network</Link>
          <h1 className="font-display text-4xl font-bold">{lot?.name} Core</h1>
          <p className="text-tertiary">Define nodal parameters (Regular, EV, Handicap)</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* GRID VIEW */}
        <div className="flex-1 bg-surface-container rounded-3xl p-8 border border-outline-variant/10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/20">
            <h2 className="font-display text-2xl font-bold">Node Matrix</h2>
          </div>

          {slots.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-tertiary mb-6">Matrix is uninitialized. Capacity is {lot?.totalSlots}.</p>
              <button onClick={handleGenerateSlots} className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold shadow-[0_0_20px_theme(colors.primary.container)] hover:-translate-y-1 transition-all">Initialize Nodes</button>
            </div>
          ) : (
             <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {slots.map(slot => {
                const isSelected = selectedSlot?._id === slot._id;
                let bgClass = "bg-surface-low";
                if (slot.slotType === "ev") bgClass = "bg-green-500/10 border-green-500/30 text-green-400";
                else if (slot.slotType === "handicap") bgClass = "bg-blue-500/10 border-blue-500/30 text-blue-400";
                
                return (
                  <button 
                    key={slot._id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`
                      h-24 rounded-lg flex flex-col justify-center items-center transition-all duration-300 font-display font-bold border border-outline-variant/10
                      ${bgClass}
                      ${isSelected ? 'shadow-[0_0_20px_theme(colors.primary.container)] border-primary scale-105 z-10' : 'hover:bg-surface-bright'}
                    `}
                  >
                    <span className={`text-xl ${isSelected ? 'text-primary' : ''}`}>
                      {slot.slotNumber}
                    </span>
                    <span className="text-[10px] uppercase font-body mt-1 opacity-70">
                      {slot.slotType}
                    </span>
                  </button>
                )
              })}
             </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="lg:w-96 flex flex-col gap-6">
          <div className="bg-surface-low rounded-3xl p-8 border border-outline-variant/10 sticky top-32">
            <h2 className="font-display text-2xl font-semibold mb-6 border-b border-outline-variant/20 pb-4 text-tertiary">Node Configuration</h2>
            
            {!selectedSlot ? (
              <div className="text-tertiary text-center py-16">
                Select a node from the matrix to configure its physics.
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-8">
                  <div className="text-xs font-bold tracking-widest text-primary mb-1 uppercase">Selected Node</div>
                  <div className="font-display text-6xl font-bold text-on-surface leading-none">{selectedSlot.slotNumber}</div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-tertiary uppercase text-sm font-bold">Current Status</span>
                    <span className="text-on-surface capitalize font-bold text-secondary">{selectedSlot.status}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2 flex-col gap-3">
                    <span className="text-tertiary uppercase text-sm font-bold">Classification</span>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => updateSlotType('regular')} className={`py-2 px-4 text-sm font-bold rounded-xl border ${selectedSlot.slotType === 'regular' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'} transition-colors text-left`}>Standard (Regular)</button>
                      <button onClick={() => updateSlotType('ev')} className={`py-2 px-4 text-sm font-bold rounded-xl border ${selectedSlot.slotType === 'ev' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'} transition-colors text-left`}>Electric Vehicle (EV)</button>
                      <button onClick={() => updateSlotType('handicap')} className={`py-2 px-4 text-sm font-bold rounded-xl border ${selectedSlot.slotType === 'handicap' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-outline-variant/20 text-tertiary hover:border-outline-variant/50'} transition-colors text-left`}>Handicap Accessible</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSlots;
