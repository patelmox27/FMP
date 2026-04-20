import {
  Building2,
  ParkingSquare,
  PencilLine,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function LocationPicker({ setForm }) {
  useMapEvents({
    click(e) {
      setForm(prev => ({ ...prev, lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) }));
    },
  });
  return null;
}
import {
  createLot,
  updateLot,
  deleteLot,
  getLots,
  getSlots,
  updateSlot,
  addSlot,
  bulkAddSlots,
  deleteSlot,
} from "../api/adminApi";
import {
  Badge,
  EmptyState,
  LoadingSpinner,
  PageHeader,
} from "../components/UI";

const EMPTY_FORM = {
  name: "",
  location: "",
  lat: "",
  lng: "",
  totalSlots: "",
  pricePerHour: "",
};

export default function ParkingLotsPage() {
  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editLotId, setEditLotId] = useState(null);
  const [slotDrafts, setSlotDrafts] = useState({});
  const [slotAddMode, setSlotAddMode] = useState("single"); // 'single' or 'bulk'
  const [newSlotForm, setNewSlotForm] = useState({
    slotNumber: "",
    count: 1,
    slotType: "regular",
    vehicleCategory: "car",
  });

  const selectedLot = useMemo(
    () => lots.find((lot) => String(lot._id) === String(selectedLotId)),
    [lots, selectedLotId],
  );

  const loadLots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getLots();
      const fetchedLots = res.data.lots || [];
      setLots(fetchedLots);
      const selectedExists = fetchedLots.some(
        (lot) => String(lot._id) === String(selectedLotId),
      );
      if (
        (fetchedLots.length > 0 && !selectedExists) ||
        (!selectedLotId && fetchedLots.length > 0)
      ) {
        setSelectedLotId(String(fetchedLots[0]._id));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load parking lots.");
    } finally {
      setLoading(false);
    }
  }, [selectedLotId]);

  const loadSlots = async (lotId) => {
    if (!lotId) {
      setSlots([]);
      return;
    }

    try {
      const res = await getSlots(lotId);
      const fetchedSlots = res.data.slots || [];
      setSlots(fetchedSlots);
      setSlotDrafts(
        fetchedSlots.reduce((acc, slot) => {
          acc[slot._id] = {
            status: slot.status || "available",
            slotType: slot.slotType || "regular",
            vehicleCategory: slot.vehicleCategory || "car",
          };
          return acc;
        }, {}),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load slots.");
    }
  };

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  useEffect(() => {
    loadSlots(selectedLotId);
  }, [selectedLotId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      location: { address: form.location.trim() },
      coordinates: { 
        lat: form.lat ? Number(form.lat) : undefined, 
        lng: form.lng ? Number(form.lng) : undefined 
      },
      totalSlots: Number(form.totalSlots),
      pricePerHour: Number(form.pricePerHour),
    };

    try {
      if (editLotId) {
        await updateLot(editLotId, payload);
      } else {
        await createLot(payload);
      }
      setForm(EMPTY_FORM);
      setEditLotId(null);
      await loadLots();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save parking lot.");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (lot) => {
    setEditLotId(lot._id);
    setForm({
      name: lot.name || "",
      location:
        typeof lot.location === "string"
          ? lot.location
          : lot.location?.address || "",
      lat: lot.coordinates?.lat ?? "",
      lng: lot.coordinates?.lng ?? "",
      totalSlots: lot.totalSlots ?? "",
      pricePerHour: lot.pricePerHour ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (lotId) => {
    if (!window.confirm("Delete this parking lot and all its slots?")) return;
    setBusy(true);
    try {
      await deleteLot(lotId);
      if (String(selectedLotId) === String(lotId)) {
        setSelectedLotId("");
      }
      await loadLots();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete parking lot.");
    } finally {
      setBusy(false);
    }
  };

  const handleSlotUpdate = async (slotId) => {
    const draft = slotDrafts[slotId];
    if (!draft) return;

    setBusy(true);
    try {
      await updateSlot(slotId, {
        status: draft.status,
        slotType: draft.slotType,
        vehicleCategory: draft.vehicleCategory,
      });
      await loadSlots(selectedLotId);
      await loadLots();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update slot.");
    } finally {
      setBusy(false);
    }
  };

  const handleSlotAdd = async (e) => {
    e.preventDefault();
    if (!selectedLotId) return;
    setBusy(true);
    try {
      if (slotAddMode === "single") {
        await addSlot(selectedLotId, {
          slotNumber: newSlotForm.slotNumber.trim(),
          slotType: newSlotForm.slotType,
          vehicleCategory: newSlotForm.vehicleCategory,
        });
      } else {
        await bulkAddSlots(selectedLotId, {
          count: newSlotForm.count,
          slotType: newSlotForm.slotType,
          vehicleCategory: newSlotForm.vehicleCategory,
        });
      }
      setNewSlotForm({ slotNumber: "", count: 1, slotType: "regular", vehicleCategory: "car" });
      await loadSlots(selectedLotId);
      await loadLots();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add slot.");
    } finally {
      setBusy(false);
    }
  };


  const handleSlotDelete = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    setBusy(true);
    try {
      await deleteSlot(slotId);
      await loadSlots(selectedLotId);
      await loadLots();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete slot.");
    } finally {
      setBusy(false);
    }
  };


  const totalSlots = useMemo(
    () => lots.reduce((sum, lot) => sum + (Number(lot.totalSlots) || 0), 0),
    [lots],
  );

  const availableSlots = useMemo(
    () => lots.reduce((sum, lot) => sum + (Number(lot.availableSlots) || 0), 0),
    [lots],
  );

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <PageHeader
        title="Parking Lots"
        subtitle="Create, edit, and inspect parking facilities and their slot inventory."
        action={
          <button
            onClick={loadLots}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-4 py-2 text-sm text-on-surface-muted hover:text-on-surface hover:bg-surface-hover transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="glass-card border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5 border border-primary/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Parking Lots
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {lots.length}
          </p>
          <p className="mt-1 text-sm text-on-surface-muted">
            Managed facilities
          </p>
        </div>
        <div className="glass-card p-5 border border-accent-green/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Total Slots
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {totalSlots}
          </p>
          <p className="mt-1 text-sm text-on-surface-muted">
            Across all parking lots
          </p>
        </div>
        <div className="glass-card p-5 border border-accent-amber/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Available Slots
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {availableSlots}
          </p>
          <p className="mt-1 text-sm text-on-surface-muted">
            Reported by the backend
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4 text-on-surface">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Plus size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">
                {editLotId ? "Edit Parking Lot" : "Add Parking Lot"}
              </h2>
              <p className="text-xs text-on-surface-muted">
                Use the admin CRUD endpoints
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm text-on-surface-muted">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
                placeholder="Central City Parking"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-on-surface-muted">
                Location
              </label>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
                placeholder="MG Road, Bangalore"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm text-on-surface-muted flex justify-between">
                  <span>Interactive Map (Click to pin)</span>
                  <span className="text-[10px] text-primary">Precise Configuration</span>
                </label>
                <div className="h-64 w-full rounded-xl overflow-hidden border border-surface-border relative z-0">
                  <MapContainer 
                    center={[form.lat || 23.0225, form.lng || 72.5714]} 
                    zoom={13} 
                    className="w-full h-full"
                  >
                     <TileLayer
                        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        subdomains={['mt0','mt1','mt2','mt3']}
                        maxZoom={20}
                     />
                     {(form.lat && form.lng) && (
                       <Marker position={[form.lat, form.lng]} icon={defaultIcon} />
                     )}
                     <LocationPicker setForm={setForm} />
                  </MapContainer>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-on-surface-muted">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lat: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
                  placeholder="23.0225"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-on-surface-muted">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lng: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
                  placeholder="72.5714"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-on-surface-muted">
                  Total Slots
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.totalSlots}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, totalSlots: e.target.value }))
                  }
                  className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
                  placeholder="50"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-on-surface-muted">
                  Price / Hour
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pricePerHour}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricePerHour: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-surface-border bg-surface-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
                  placeholder="30"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50"
              >
                <Building2 size={16} />
                {busy ? "Saving..." : editLotId ? "Update Lot" : "Create Lot"}
              </button>
              {editLotId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditLotId(null);
                    setForm(EMPTY_FORM);
                  }}
                  className="rounded-xl border border-surface-border px-4 py-3 text-sm text-on-surface-muted hover:bg-surface-hover"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-on-surface">
                  Lots List
                </h2>
                <p className="text-xs text-on-surface-muted">
                  Select a lot to inspect slots
                </p>
              </div>
              <ParkingSquare size={18} className="text-primary" />
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : lots.length === 0 ? (
              <EmptyState message="No parking lots found yet." />
            ) : (
              <div className="space-y-3">
                {lots.map((lot) => {
                  const isSelected = String(selectedLotId) === String(lot._id);
                  const occupied =
                    Number(lot.totalSlots || 0) -
                    Number(lot.availableSlots || 0);
                  const occupancyRate = Number(lot.totalSlots)
                    ? ((occupied / Number(lot.totalSlots)) * 100).toFixed(0)
                    : 0;
                  return (
                    <div
                      key={lot._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedLotId(String(lot._id))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedLotId(String(lot._id));
                        }
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        isSelected
                          ? "border-primary/40 bg-primary/10"
                          : "border-surface-border bg-surface-low hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-on-surface">
                            {lot.name}
                          </h3>
                          <p className="text-sm text-on-surface-muted mt-1">
                            {typeof lot.location === "string"
                              ? lot.location
                              : lot.location?.address || "Unknown location"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-on-surface-muted">
                            <span className="rounded-full border border-surface-border px-2 py-1">
                              {lot.totalSlots} slots
                            </span>
                            <span className="rounded-full border border-surface-border px-2 py-1">
                              ₹{lot.pricePerHour}/hr
                            </span>
                            <span className="rounded-full border border-surface-border px-2 py-1">
                              {occupancyRate}% used
                            </span>
                            <Badge status="active" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(lot);
                            }}
                            className="rounded-lg border border-surface-border p-2 text-on-surface-muted hover:text-on-surface hover:bg-surface-hover"
                            aria-label="Edit lot"
                          >
                            <PencilLine size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(lot._id);
                            }}
                            className="rounded-lg border border-surface-border p-2 text-accent-red hover:bg-accent-red/10"
                            aria-label="Delete lot"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-on-surface">
                  Slots for Selected Lot
                </h2>
                <p className="text-xs text-on-surface-muted">
                  {selectedLot?.name || "Choose a lot above"}
                </p>
              </div>
              <Settings2 size={18} className="text-primary" />
            </div>

            {selectedLotId && (
              <div className="mb-8 glass-card border-primary/10 bg-primary/5 p-4">
                <div className="flex items-center gap-4 mb-4 border-b border-primary/10 pb-3">
                  <button
                    onClick={() => setSlotAddMode("single")}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition ${
                      slotAddMode === "single"
                        ? "bg-primary text-white"
                        : "bg-surface-low text-on-surface-muted hover:bg-surface-hover"
                    }`}
                  >
                    Single Add
                  </button>
                  <button
                    onClick={() => setSlotAddMode("bulk")}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition ${
                      slotAddMode === "bulk"
                        ? "bg-primary text-white"
                        : "bg-surface-low text-on-surface-muted hover:bg-surface-hover"
                    }`}
                  >
                    Bulk Add
                  </button>
                </div>

                <form
                  onSubmit={handleSlotAdd}
                  className="flex gap-3 items-end"
                >
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] uppercase font-bold text-on-surface-muted">
                      {slotAddMode === "single" ? "Slot Number" : "Quantity to Add"}
                    </label>
                    {slotAddMode === "single" ? (
                      <input
                        required
                        value={newSlotForm.slotNumber}
                        onChange={(e) =>
                          setNewSlotForm((p) => ({ ...p, slotNumber: e.target.value }))
                        }
                        placeholder="e.g. A-15"
                        className="w-full rounded-xl border border-surface-border bg-surface-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
                      />
                    ) : (
                      <input
                        required
                        type="number"
                        min="1"
                        max="100"
                        value={newSlotForm.count}
                        onChange={(e) =>
                          setNewSlotForm((p) => ({ ...p, count: Number(e.target.value) }))
                        }
                        className="w-full rounded-xl border border-surface-border bg-surface-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
                      />
                    )}
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-[10px] uppercase font-bold text-on-surface-muted">
                      Vehicle
                    </label>
                    <select
                      value={newSlotForm.vehicleCategory}
                      onChange={(e) =>
                        setNewSlotForm((p) => ({ ...p, vehicleCategory: e.target.value }))
                      }
                      className="w-full rounded-xl border border-surface-border bg-surface-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
                    >
                      <option value="car">Car</option>
                      <option value="bike">Bike</option>
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-[10px] uppercase font-bold text-on-surface-muted">
                      Type
                    </label>
                    <select
                      value={newSlotForm.slotType}
                      onChange={(e) =>
                        setNewSlotForm((p) => ({ ...p, slotType: e.target.value }))
                      }
                      className="w-full rounded-xl border border-surface-border bg-surface-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
                    >
                      <option value="regular">Regular</option>
                      <option value="ev">EV</option>
                      <option value="handicap">Handicap</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-primary px-4 py-2.5 text-white hover:bg-primary-light disabled:opacity-50 flex items-center justify-center min-w-[44px]"
                    title={slotAddMode === "single" ? "Add Slot" : `Add ${newSlotForm.count} Slots`}
                  >
                    <Plus size={18} />
                  </button>
                </form>
              </div>
            )}



            {slots.length === 0 ? (
              <EmptyState message="No slots available for this lot." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot) => (
                  <div
                    key={slot._id}
                    className="relative rounded-2xl border border-surface-border bg-surface-low p-4 group"
                  >
                    <button
                      onClick={() => handleSlotDelete(slot._id)}
                      className="absolute top-3 right-3 p-1.5 text-on-surface-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity bg-surface-low/80 rounded-lg border border-surface-border shadow-sm"
                      title="Delete Slot"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">
                          {slot.slotNumber || slot.name || slot._id}
                        </p>
                        <p className="text-xs text-on-surface-muted mt-1">
                          {slot.parkingLotId?.name ||
                            selectedLot?.name ||
                            "Slot"}
                        </p>
                      </div>
                      <Badge status={slot.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <label className="text-xs text-on-surface-muted">
                        Vehicle
                        <select
                          value={
                            slotDrafts[slot._id]?.vehicleCategory ||
                            slot.vehicleCategory ||
                            "car"
                          }
                          onChange={(e) =>
                            setSlotDrafts((prev) => ({
                              ...prev,
                              [slot._id]: {
                                ...(prev[slot._id] || {}),
                                vehicleCategory: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm text-on-surface outline-none"
                        >
                          <option value="car">Car</option>
                          <option value="bike">Bike</option>
                        </select>
                      </label>
                      <label className="text-xs text-on-surface-muted">
                        Status
                        <select
                          value={
                            slotDrafts[slot._id]?.status ||
                            slot.status ||
                            "available"
                          }
                          onChange={(e) =>
                            setSlotDrafts((prev) => ({
                              ...prev,
                              [slot._id]: {
                                ...(prev[slot._id] || {}),
                                status: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm text-on-surface outline-none"
                        >
                          <option value="available">available</option>
                          <option value="occupied">occupied</option>
                          <option value="reserved">reserved</option>
                        </select>
                      </label>
                      <label className="text-xs text-on-surface-muted">
                        Type
                        <select
                          value={
                            slotDrafts[slot._id]?.slotType ||
                            slot.slotType ||
                            "regular"
                          }
                          onChange={(e) =>
                            setSlotDrafts((prev) => ({
                              ...prev,
                              [slot._id]: {
                                ...(prev[slot._id] || {}),
                                slotType: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm text-on-surface outline-none"
                        >
                          <option value="regular">regular</option>
                          <option value="ev">ev</option>
                          <option value="handicap">handicap</option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSlotUpdate(slot._id)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-card px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-hover disabled:opacity-50"
                    >
                      <RefreshCw size={14} />
                      Update Slot
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
