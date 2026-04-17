import {
  Activity,
  BookOpen,
  CheckCircle,
  DollarSign,
  ParkingSquare,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getBookings, getDashboard } from "../api/adminApi";
import { Badge, LoadingSpinner, PageHeader, StatCard } from "../components/UI";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, bookRes] = await Promise.all([
          getDashboard(),
          getBookings(8),
        ]);
        setData(dashRes.data);
        setBookings(bookRes.data.bookings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );

  const { overview, revenue, bookings: bkStats } = data || {};

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${(revenue?.total || 0).toLocaleString()}`,
      subtitle: `₹${(revenue?.today || 0).toLocaleString()} today`,
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Parking Lots",
      value: overview?.totalLots || 0,
      subtitle: `${overview?.totalSlots || 0} total slots`,
      icon: ParkingSquare,
      color: "primary",
    },
    {
      title: "Occupancy Rate",
      value: `${overview?.occupancyRate || 0}%`,
      subtitle: `${overview?.occupiedSlots || 0} occupied slots`,
      icon: Activity,
      color: "amber",
    },
    {
      title: "Active Bookings",
      value: bkStats?.active || 0,
      subtitle: `${bkStats?.total || 0} total bookings`,
      icon: BookOpen,
      color: "blue",
    },
    {
      title: "Total Users",
      value: overview?.totalUsers || 0,
      subtitle: "Registered accounts",
      icon: Users,
      color: "primary",
    },
    {
      title: "Available Slots",
      value: overview?.availableSlots || 0,
      subtitle: `${overview?.reservedSlots || 0} reserved`,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Completed",
      value: bkStats?.completed || 0,
      subtitle: "Completed bookings",
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Cancelled",
      value: bkStats?.cancelled || 0,
      subtitle: "Cancelled bookings",
      icon: XCircle,
      color: "red",
    },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Overview · ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-display font-semibold text-on-surface text-sm mb-4">
          Slot Occupancy Breakdown
        </h3>
        <div className="flex gap-2 mb-3">
          {[
            {
              label: "Occupied",
              count: overview?.occupiedSlots || 0,
              color: "bg-accent-red",
            },
            {
              label: "Reserved",
              count: overview?.reservedSlots || 0,
              color: "bg-accent-amber",
            },
            {
              label: "Available",
              count: overview?.availableSlots || 0,
              color: "bg-accent-green",
            },
          ].map(({ label, count, color }) => {
            const pct =
              overview?.totalSlots > 0
                ? ((count / overview.totalSlots) * 100).toFixed(0)
                : 0;
            return (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs text-on-surface-muted"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span>
                  {label} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-4 bg-surface-low rounded-full overflow-hidden flex">
          {overview?.totalSlots > 0 && (
            <>
              <div
                className="bg-accent-red h-full transition-all"
                style={{
                  width: `${((overview.occupiedSlots / overview.totalSlots) * 100).toFixed(1)}%`,
                }}
              />
              <div
                className="bg-accent-amber h-full transition-all"
                style={{
                  width: `${((overview.reservedSlots / overview.totalSlots) * 100).toFixed(1)}%`,
                }}
              />
              <div className="bg-accent-green h-full transition-all flex-1" />
            </>
          )}
        </div>
        <div className="flex justify-between text-xs text-on-surface-muted mt-2">
          <span>0</span>
          <span className="font-mono">
            {overview?.totalSlots || 0} total slots
          </span>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-on-surface text-sm">
            Recent Bookings
          </h3>
          <span className="text-on-surface-muted text-xs">
            Last 8 reservations
          </span>
        </div>
        {bookings.length === 0 ? (
          <p className="text-on-surface-muted text-sm text-center py-8">
            No bookings yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-on-surface-muted text-xs border-b border-surface-border">
                  <th className="text-left pb-3 font-medium">User</th>
                  <th className="text-left pb-3 font-medium">Slot</th>
                  <th className="text-left pb-3 font-medium">Type</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                  <th className="text-right pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {bookings.map((b) => (
                  <tr
                    key={b._id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="py-3 text-on-surface">
                      {b.userId?.Name || b.userId?.name || "—"}
                    </td>
                    <td className="py-3 text-on-surface-muted font-mono text-xs">
                      {b.slotId?.slotNumber || "—"}
                    </td>
                    <td className="py-3 text-on-surface-muted capitalize">
                      {b.reservationType}
                    </td>
                    <td className="py-3 text-right text-accent-green font-semibold">
                      ₹{b.totalPrice}
                    </td>
                    <td className="py-3 text-right">
                      <Badge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
