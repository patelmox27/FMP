import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllParkingLots } from '../../api/parking';

// A mock api for creating lots (to be wired to backend later)
import apiClient from '../../api/apiClient';

const AdminLots = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLot, setNewLot] = useState({ name: '', address: '', totalSlots: 10, pricePerHour: 50 });

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const data = await getAllParkingLots();
      setLots(Array.isArray(data) ? data : (data.parkingLots || data.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      // POST /parking (assuming it creates, or we just mock it for now since we need to check backend routes)
      await apiClient.post('/parking', newLot);
      setShowModal(false);
      fetchLots();
    } catch (err) {
      alert("Failed to create lot");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 text-on-surface">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Parking Administration</h1>
          <p className="text-tertiary">Manage monolithic sites, capacities, and base pricing.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold font-display hover:shadow-[0_0_20px_theme(colors.primary.container)] hover:-translate-y-1 transition-all"
        >
          + Initialize New Monolith
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 animate-pulse text-tertiary">Fetching systemic topology...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map(lot => (
            <div key={lot._id} className="bg-surface-container border border-outline-variant/10 p-6 rounded-3xl hover:border-primary/50 transition-colors">
              <h3 className="font-display text-2xl font-bold mb-1 text-on-surface">{lot.name}</h3>
              <p className="text-tertiary text-sm mb-6 h-10">{lot.address || lot.location?.address}</p>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-tertiary uppercase font-bold tracking-wider mb-1">CAPACITY</div>
                  <div className="font-display text-3xl font-bold text-secondary leading-none">{lot.totalSlots}</div>
                </div>
                <div>
                  <div className="text-[10px] text-tertiary uppercase font-bold tracking-wider mb-1">BASE RATE</div>
                  <div className="font-display text-3xl font-bold text-on-surface leading-none">₹{lot.pricePerHour || 0}</div>
                </div>
              </div>

              <div className="mt-8">
                <Link to={`/admin/lots/${lot._id}`} className="block w-full text-center py-3 rounded-xl border border-secondary/30 text-secondary font-bold hover:bg-secondary/10 transition-colors">
                  Configure Grid Mapping
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container w-full max-w-md rounded-3xl p-8 shadow-2xl border border-outline-variant/20 animate-in zoom-in-95 duration-200">
            <h2 className="font-display text-2xl font-bold mb-6 text-on-surface">Deploy New Site</h2>
            <form onSubmit={handleCreateLot} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-tertiary font-bold mb-2">Location Name</label>
                <input required type="text" value={newLot.name} onChange={e => setNewLot({...newLot, name: e.target.value})} className="w-full bg-surface-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-tertiary font-bold mb-2">Address</label>
                <input required type="text" value={newLot.address} onChange={e => setNewLot({...newLot, address: e.target.value})} className="w-full bg-surface-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-wider text-tertiary font-bold mb-2">Total Slots</label>
                  <input required type="number" min="1" value={newLot.totalSlots} onChange={e => setNewLot({...newLot, totalSlots: parseInt(e.target.value)})} className="w-full bg-surface-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-wider text-tertiary font-bold mb-2">Hourly Rate</label>
                  <input required type="number" min="0" value={newLot.pricePerHour} onChange={e => setNewLot({...newLot, pricePerHour: parseInt(e.target.value)})} className="w-full bg-surface-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-tertiary hover:text-on-surface transition-colors font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold hover:shadow-[0_0_15px_theme(colors.primary.container)] transition-all">Create Site</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLots;
