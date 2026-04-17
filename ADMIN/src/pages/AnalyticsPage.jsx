import { Activity, Clock3, Download, ParkingSquare, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getOccupancy, getPeakHours } from "../api/adminApi";
import {
  EmptyState,
  LoadingSpinner,
  PageHeader,
  StatCard,
} from "../components/UI";

const COLORS = ["#6c63ff", "#00e5a0", "#ffb84d", "#ff6b6b", "#4cc9f0"];

export default function AnalyticsPage() {
  const [occupancy, setOccupancy] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [occupancyRes, peakRes] = await Promise.all([
          getOccupancy(),
          getPeakHours(),
        ]);
        setOccupancy(occupancyRes.data.lots || []);
        setPeakHours(peakRes.data.peakHours || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load analytics data.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const totalLots = occupancy.length;
    const totalSlots = occupancy.reduce(
      (sum, lot) => sum + (Number(lot.totalSlots) || 0),
      0,
    );
    const occupied = occupancy.reduce(
      (sum, lot) => sum + (Number(lot.occupied) || 0),
      0,
    );
    const reserved = occupancy.reduce(
      (sum, lot) => sum + (Number(lot.reserved) || 0),
      0,
    );
    const averageOccupancy = totalSlots
      ? (((occupied + reserved) / totalSlots) * 100).toFixed(1)
      : "0.0";

    return { totalLots, totalSlots, occupied, reserved, averageOccupancy };
  }, [occupancy]);

  const chartData = peakHours.map((item) => ({
    ...item,
    label: item.label || `${String(item.hour).padStart(2, "0")}:00`,
  }));

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFontSize(22);
    doc.setTextColor(108, 99, 255); // primary color
    doc.text("Find My Parking", 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Administrative Analytics Report", 14, 28);
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated on: ${timestamp}`, 14, 35);

    // ── Summary Table ───────────────────────────────────────────────────────
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Executive Summary", 14, 50);
    
    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Value"]],
      body: [
        ["Total Parking Lots", summary.totalLots],
        ["Total Slot Capacity", summary.totalSlots],
        ["Active Utilization (Occupied + Reserved)", summary.occupied + summary.reserved],
        ["Global Occupancy Rate", `${summary.averageOccupancy}%`],
      ],
      headStyles: { fillColor: [108, 99, 255] },
      styles: { fontSize: 10 },
      theme: "striped",
    });

    // ── Lot Breakdown Table ──────────────────────────────────────────────────
    doc.setFontSize(16);
    doc.text("Detailed Occupancy Breakdown", 14, doc.lastAutoTable.finalY + 20);

    const lotRows = occupancy.map((lot) => [
      lot.name,
      lot.location || "N/A",
      lot.totalSlots,
      lot.occupied,
      lot.reserved,
      `${lot.occupancyRate}%`,
      `INR ${Number(lot.revenue || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Lot Name", "Location", "Total", "Occ", "Res", "Rate", "Revenue"]],
      body: lotRows,
      headStyles: { fillColor: [108, 99, 255] },
      styles: { fontSize: 9 },
      theme: "grid",
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} - Confidential Admin Report`,
        14,
        doc.internal.pageSize.height - 10,
      );
    }

    doc.save(`FMP_Analytics_Report_${Date.now()}.pdf`);
  };


  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Occupancy and peak-hour patterns across all parking facilities."
        action={
          <button
            onClick={handleGenerateReport}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light transition shadow-lg shadow-primary/20"
          >
            <Download size={16} />
            Generate PDF
          </button>
        }
      />


      {error && (
        <div className="glass-card border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Lots Tracked"
          value={summary.totalLots}
          subtitle="From occupancy endpoint"
          icon={ParkingSquare}
          color="primary"
        />
        <StatCard
          title="Total Slots"
          value={summary.totalSlots}
          subtitle="Available across lots"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Occupied + Reserved"
          value={summary.occupied + summary.reserved}
          subtitle="Current usage pressure"
          icon={ShieldCheck}
          color="amber"
        />
        <StatCard
          title="Average Occupancy"
          value={`${summary.averageOccupancy}%`}
          subtitle="Across all parking lots"
          icon={Clock3}
          color="green"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="font-display text-lg font-semibold text-on-surface mb-1">
            Peak Hours
          </h2>
          <p className="text-xs text-on-surface-muted mb-4">
            Booking volume across the last 30 days
          </p>
          {chartData.length === 0 ? (
            <EmptyState message="No peak-hour data available." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a3145"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1c2030",
                      border: "1px solid #2a3145",
                      borderRadius: 12,
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="bookings" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.hour}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h2 className="font-display text-lg font-semibold text-on-surface mb-1">
            Occupancy by Lot
          </h2>
          <p className="text-xs text-on-surface-muted mb-4">
            Occupied and reserved counts per lot
          </p>
          {occupancy.length === 0 ? (
            <EmptyState message="No occupancy data available." />
          ) : (
            <div className="space-y-4 max-h-[22rem] overflow-y-auto pr-1">
              {occupancy.map((lot) => {
                const total = Number(lot.totalSlots) || 0;
                const used =
                  (Number(lot.occupied) || 0) + (Number(lot.reserved) || 0);
                const usedPct = total ? (used / total) * 100 : 0;
                const availablePct = 100 - usedPct;

                return (
                  <div
                    key={lot.lotId}
                    className="rounded-2xl border border-surface-border bg-surface-low p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-on-surface">
                          {lot.name}
                        </h3>
                        <p className="text-xs text-on-surface-muted">
                          {lot.location || "Location unavailable"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {lot.occupancyRate}%
                      </span>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-card flex">
                      <div
                        className="bg-accent-red h-full"
                        style={{
                          width: `${(Number(lot.occupied) / total) * 100 || 0}%`,
                        }}
                      />
                      <div
                        className="bg-accent-amber h-full"
                        style={{
                          width: `${(Number(lot.reserved) / total) * 100 || 0}%`,
                        }}
                      />
                      <div
                        className="bg-accent-green h-full flex-1"
                        style={{ width: `${availablePct}%` }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-on-surface-muted">
                      <span>Slots: {total}</span>
                      <span>Occupied: {lot.occupied}</span>
                      <span>Reserved: {lot.reserved}</span>
                      <span>
                        Revenue: ₹{Number(lot.revenue || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
