import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllParkingLots } from '../api/parking';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Kinetic Void Custom Map Marker
const customMarker = new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="w-5 h-5 bg-[#8338ec] rounded-full border-[3px] border-[#0a0a0c] shadow-[0_0_15px_#8338ec]"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

const Parking = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const data = await getAllParkingLots();
        setParkingLots(Array.isArray(data) ? data : (data.parkingLots || data.data || []));
      } catch (err) {
        setError("Failed to load parking lots.");
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 text-on-surface flex flex-col h-[calc(100vh-100px)]">
      <header className="mb-6 shrink-0">
        <h1 className="font-display font-bold text-4xl mb-2">City Map & Active Sites</h1>
        <p className="text-tertiary text-lg">Select a monolithic structure to view its slots.</p>
      </header>

      {error ? (
        <div className="bg-red-900/20 text-[#ffb4ab] p-6 rounded-xl border border-red-900/40shrink-0">{error}</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          {/* LEFT SIDE: MAP VIEW */}
          <div className="flex-1 bg-surface-container rounded-3xl border border-outline-variant/10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
            <MapContainer 
                center={[23.0225, 72.5714]} // Ahmedabad
                zoom={13} 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ background: '#0a0a0c' }} // matches Kinetic Void background
              >
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  subdomains={['mt0','mt1','mt2','mt3']}
                  attribution='&copy; Google Maps'
                  maxZoom={20}
                />
                
                {parkingLots.map((lot, index) => {
                  // Fallback coordinates around Ahmedabad if DB has none (spread them slightly based on index)
                  const lat = lot.coordinates?.lat || 23.0225 + (index * 0.015 - 0.03);
                  const lng = lot.coordinates?.lng || 72.5714 + (index * 0.015 - 0.03);

                  return (
                    <Marker key={lot._id} position={[lat, lng]} icon={customMarker}>
                      <Popup className="kinetic-popup">
                        <div className="font-display font-bold text-lg text-primary">{lot.name || "Unnamed Lot"}</div>
                        <div className="text-secondary font-bold font-body tracking-wider text-xs uppercase my-1">
                          {lot.totalSlots} Slots
                        </div>
                        <Link to={`/parking/${lot._id}`} className="text-tertiary hover:text-primary text-xs underline mt-2 inline-block">
                          View details
                        </Link>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent opacity-60 z-[400]"></div>
          </div>
          
          {/* RIGHT SIDE: SLOTS / LOTS */}
          <div className="lg:w-[450px] flex flex-col min-h-0 shrink-0">
            <h2 className="font-display text-2xl font-semibold mb-4 text-secondary shrink-0">Available Locations</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent'}}>
              {loading ? (
                <div className="text-center py-16 text-tertiary animate-pulse">Loading System...</div>
              ) : parkingLots.length === 0 ? (
                <div className="bg-surface-low text-center p-12 rounded-3xl text-tertiary">
                  No parking lots available in the network currently.
                </div>
              ) : (
                parkingLots.map(lot => (
                  <div key={lot._id} className="bg-surface-container p-6 rounded-3xl flex flex-col gap-4 hover:shadow-[0_8px_32px_rgba(226,226,232,0.04)] transition-shadow border border-outline-variant/10 hover:border-outline-variant/30 group">
                    <div>
                      <h3 className="font-display text-2xl font-semibold mb-1 text-on-surface group-hover:text-primary transition-colors">{lot.name || "Unnamed Area"}</h3>
                      <p className="text-tertiary text-sm">{lot.address || "Location classification unknown."}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="font-display text-3xl font-bold text-secondary flex flex-col">
                        {lot.totalSlots || "?"} <span className="text-[10px] font-body tracking-wider text-tertiary uppercase leading-none mt-1">CAPACITY</span>
                      </div>
                      <Link to={`/parking/${lot._id}`} className="px-5 py-2 rounded-full border border-secondary/30 text-secondary hover:bg-secondary/10 hover:-translate-y-0.5 transition-all text-sm font-bold tracking-wide">
                        View Slots
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parking;
