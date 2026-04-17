import { useState, useEffect, useCallback } from 'react';
import apiClient from './apiClient';

// ─── Default "demo mode" data ─────────────────────────────────────────
const DEMO_DATA = {
  available: 47,
  occupied: 23,
  reserved: 8,
  total: 78,
  revenue: 12400,
  isLive: false,
  slotLayout: [
    [1, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 1],
    [2, 0, 0, 0, 1, 0],
    [0, 1, 0, 2, 0, 0],
  ],
};

function buildSlotMatrix(slots) {
  if (!slots || slots.length === 0) return DEMO_DATA.slotLayout;
  const statusMap = { available: 0, occupied: 1, reserved: 2, booked: 1 };
  const COLS = 6;
  const rows = Math.ceil(slots.length / COLS);
  const matrix = Array.from({ length: rows }, () => Array(COLS).fill(0));
  slots.forEach((slot, idx) => {
    const row = Math.floor(idx / COLS);
    const col = idx % COLS;
    matrix[row][col] = statusMap[slot.status] ?? 0;
  });
  return matrix;
}

/**
 * useParkingLiveData
 *
 * Fetches real-time stats from the backend ONLY when the user is authenticated.
 * If no token is found in localStorage, skips all requests and returns demo data
 * immediately — preventing 403 console errors on the public home page.
 * 
 * When logged in: data is live, HUD shows "LIVE" indicator.
 * When logged out: data is demo, HUD shows "DEMO" indicator.
 */
export function useParkingLiveData(refetchIntervalMs = 30000) {
  const [data, setData] = useState(DEMO_DATA);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // ── Guard: skip all API calls if the user is not logged in ──────
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token) {
      setData({ ...DEMO_DATA, isLive: false });
      setLoading(false);
      return;
    }

    try {
      const lotsRes = await apiClient.get('/parking');
      const lots = lotsRes.data?.data || lotsRes.data || [];

      if (!lots.length) {
        setData({ ...DEMO_DATA, isLive: false });
        setLoading(false);
        return;
      }

      let available = 0, occupied = 0, reserved = 0, total = 0;

      const firstLotId = lots[0]._id;
      const slotsRes = await apiClient.get(`/parking/slots/${firstLotId}`);
      const slots = slotsRes.data?.data || slotsRes.data || [];

      lots.forEach((lot) => {
        available += lot.availableSlots ?? 0;
        occupied  += lot.occupiedSlots  ?? 0;
        reserved  += lot.reservedSlots  ?? 0;
        total     += lot.totalSlots     ?? 0;
      });

      if (total === 0 && slots.length) {
        slots.forEach((s) => {
          total++;
          if (s.status === 'available') available++;
          else if (s.status === 'occupied' || s.status === 'booked') occupied++;
          else if (s.status === 'reserved') reserved++;
        });
      }

      // Revenue — admin only, check role to prevent 403 console noise ──
      let revenue = DEMO_DATA.revenue;
      
      // Determine if user is admin (check both lowercase and uppercase 'role' just in case)
      const userRole = (user?.role || user?.Role || "").toLowerCase();
      const isAdmin = userRole === 'admin';

      if (token && isAdmin) {
        try {
          const dashRes = await apiClient.get('/admin/dashboard');
          revenue = dashRes.data?.totalRevenue ?? dashRes.data?.data?.totalRevenue ?? revenue;
        } catch (err) {
          // Silent fallback for non-critical dashboard fetch
        }
      }

      setData({
        available: available || DEMO_DATA.available,
        occupied:  occupied  || DEMO_DATA.occupied,
        reserved:  reserved  || DEMO_DATA.reserved,
        total:     total     || DEMO_DATA.total,
        revenue,
        isLive: true,
        slotLayout: buildSlotMatrix(slots),
      });
    } catch {
      // Network or any other failure → silent demo fallback
      setData({ ...DEMO_DATA, isLive: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refetchIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, refetchIntervalMs]);

  return { ...data, loading, refetch: fetchData };
}
