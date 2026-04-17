import {
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getRevenue } from "../api/adminApi";
import {
  EmptyState,
  LoadingSpinner,
  PageHeader,
  StatCard,
} from "../components/UI";

const COLORS = ["#6c63ff", "#00e5a0", "#ffb84d", "#ff6b6b", "#4cc9f0"];

export default function RevenuePage() {
  const [days, setDays] = useState(7);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [revenueByType, setRevenueByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getRevenue(days);
        setRevenueByDay(res.data.revenueByDay || []);
        setRevenueByType(res.data.revenueByType || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load revenue report.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [days]);

  const totals = useMemo(() => {
    const totalRevenue = revenueByDay.reduce(
      (sum, item) => sum + (Number(item.revenue) || 0),
      0,
    );
    const totalBookings = revenueByDay.reduce(
      (sum, item) => sum + (Number(item.bookings) || 0),
      0,
    );
    const topDay = [...revenueByDay].sort(
      (a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0),
    )[0];
    return { totalRevenue, totalBookings, topDay };
  }, [revenueByDay]);

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
        title="Revenue"
        subtitle="Revenue trends and booking mix for the selected period."
        action={
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card p-1">
            {[7, 14, 30].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  days === value
                    ? "bg-primary text-white"
                    : "text-on-surface-muted hover:text-on-surface"
                }`}
              >
                {value}d
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="glass-card border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(totals.totalRevenue || 0).toLocaleString()}`}
          subtitle={`${days}-day window`}
          icon={CircleDollarSign}
          color="green"
        />
        <StatCard
          title="Bookings"
          value={totals.totalBookings || 0}
          subtitle="Completed bookings in report"
          icon={CalendarDays}
          color="blue"
        />
        <StatCard
          title="Top Day"
          value={
            totals.topDay
              ? `₹${Number(totals.topDay.revenue || 0).toLocaleString()}`
              : "₹0"
          }
          subtitle={totals.topDay ? totals.topDay._id : "No revenue yet"}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Daily Avg"
          value={`₹${totals.totalBookings ? Math.round(totals.totalRevenue / totals.totalBookings).toLocaleString() : 0}`}
          subtitle="Average revenue per booking"
          icon={BadgeDollarSign}
          color="primary"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="font-display text-lg font-semibold text-on-surface mb-1">
            Revenue by Day
          </h2>
          <p className="text-xs text-on-surface-muted mb-4">
            Completed reservations only
          </p>
          {revenueByDay.length === 0 ? (
            <EmptyState message="No daily revenue data available." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2a3145"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="_id"
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
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" radius={[10, 10, 0, 0]}>
                    {revenueByDay.map((entry, index) => (
                      <Cell
                        key={`day-${entry._id}`}
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
            Revenue by Reservation Type
          </h2>
          <p className="text-xs text-on-surface-muted mb-4">
            Distribution of completed booking value
          </p>
          {revenueByType.length === 0 ? (
            <EmptyState message="No reservation-type revenue data available." />
          ) : (
            <div className="space-y-4">
              {revenueByType.map((row, index) => {
                const total = revenueByType.reduce(
                  (sum, item) => sum + (Number(item.revenue) || 0),
                  0,
                );
                const pct = total
                  ? ((Number(row.revenue) || 0) / total) * 100
                  : 0;
                return (
                  <div
                    key={row._id || index}
                    className="rounded-2xl border border-surface-border bg-surface-low p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-on-surface capitalize">
                          {row._id || "Unknown"}
                        </h3>
                        <p className="text-xs text-on-surface-muted">
                          {Number(row.count || 0)} bookings
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-accent-green">
                        ₹{Number(row.revenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-card">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
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
