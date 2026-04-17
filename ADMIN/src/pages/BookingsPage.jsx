import { Bell, Clock3, MailWarning, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAlerts, getBookings, getNotifications } from "../api/adminApi";
import {
  Badge,
  EmptyState,
  LoadingSpinner,
  PageHeader,
} from "../components/UI";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingsRes, notificationsRes, alertsRes] = await Promise.all([
          getBookings(40),
          getNotifications(10),
          getAlerts(),
        ]);
        setBookings(bookingsRes.data.bookings || []);
        setNotifications(notificationsRes.data.notifications || []);
        setAlerts(alertsRes.data || null);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load bookings data.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((item) => item.status === "active").length;
    const completed = bookings.filter(
      (item) => item.status === "completed",
    ).length;
    const cancelled = bookings.filter(
      (item) => item.status === "cancelled",
    ).length;
    return { total, active, completed, cancelled };
  }, [bookings]);

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
        title="Bookings"
        subtitle="Recent reservations, notification feed, and operational alerts."
      />

      {error && (
        <div className="glass-card border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Total Bookings
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {summary.total}
          </p>
        </div>
        <div className="glass-card p-5 border border-accent-green/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Active
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {summary.active}
          </p>
        </div>
        <div className="glass-card p-5 border border-accent-blue/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Completed
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {summary.completed}
          </p>
        </div>
        <div className="glass-card p-5 border border-accent-red/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Cancelled
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {summary.cancelled}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">
                Recent Bookings
              </h2>
              <p className="text-xs text-on-surface-muted">
                Latest reservations from the backend
              </p>
            </div>
            <ReceiptText size={18} className="text-primary" />
          </div>

          {bookings.length === 0 ? (
            <EmptyState message="No bookings found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-xs text-on-surface-muted">
                    <th className="pb-3 text-left font-medium">User</th>
                    <th className="pb-3 text-left font-medium">Slot</th>
                    <th className="pb-3 text-left font-medium">Type</th>
                    <th className="pb-3 text-left font-medium">Time</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                    <th className="pb-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="hover:bg-surface-hover transition-colors"
                    >
                      <td className="py-3 text-on-surface">
                        <div className="font-medium">
                          {booking.userId?.Name ||
                            booking.userId?.name ||
                            "Unknown user"}
                        </div>
                        <div className="text-xs text-on-surface-muted">
                          {booking.userId?.email || ""}
                        </div>
                      </td>
                      <td className="py-3 text-on-surface-muted font-mono text-xs">
                        {booking.slotId?.slotNumber || "—"}
                      </td>
                      <td className="py-3 text-on-surface-muted capitalize">
                        {booking.reservationType || "—"}
                      </td>
                      <td className="py-3 text-on-surface-muted">
                        <div>
                          {booking.startTime
                            ? new Date(booking.startTime).toLocaleString()
                            : "—"}
                        </div>
                        <div className="text-xs text-on-surface-muted">
                          {booking.endTime
                            ? new Date(booking.endTime).toLocaleString()
                            : ""}
                        </div>
                      </td>
                      <td className="py-3 text-right text-accent-green font-semibold">
                        ₹{Number(booking.totalPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <Badge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-on-surface">
                  Alerts
                </h2>
                <p className="text-xs text-on-surface-muted">
                  Occupancy and enforcement signals
                </p>
              </div>
              <MailWarning size={18} className="text-accent-amber" />
            </div>

            {alerts ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-surface-border bg-surface-low p-4">
                  <p className="text-xs uppercase tracking-wide text-on-surface-muted">
                    Summary
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-on-surface-muted text-xs">Full lots</p>
                      <p className="text-xl font-bold text-on-surface">
                        {alerts.summary?.fullOccupancyLots || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-on-surface-muted text-xs">
                        Unauthorized parking
                      </p>
                      <p className="text-xl font-bold text-on-surface">
                        {alerts.summary?.unauthorizedParkingCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-on-surface-muted text-xs">
                        Expiring soon
                      </p>
                      <p className="text-xl font-bold text-on-surface">
                        {alerts.summary?.expiringSoonCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-on-surface-muted text-xs">
                        Available slots
                      </p>
                      <p className="text-xl font-bold text-on-surface">
                        {alerts.summary?.availableSlotsCount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-on-surface-muted">
                    Unauthorized Parking
                  </p>
                  {(alerts.unauthorizedParking || []).length === 0 ? (
                    <EmptyState message="No unauthorized parking detected." />
                  ) : (
                    <div className="space-y-2">
                      {alerts.unauthorizedParking.map((item) => (
                        <div
                          key={item.slotId}
                          className="rounded-xl border border-surface-border bg-surface-low p-3"
                        >
                          <p className="font-medium text-on-surface">
                            Slot {item.slotNumber}
                          </p>
                          <p className="text-xs text-on-surface-muted">
                            {item.lotName}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState message="No alerts available." />
            )}
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-on-surface">
                  Notifications
                </h2>
                <p className="text-xs text-on-surface-muted">
                  Latest system events
                </p>
              </div>
              <Bell size={18} className="text-primary" />
            </div>

            {notifications.length === 0 ? (
              <EmptyState message="No notifications found." />
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="rounded-2xl border border-surface-border bg-surface-low p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-on-surface">
                          {notification.title ||
                            notification.type ||
                            "Notification"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-muted">
                          {notification.message || "No message"}
                        </p>
                      </div>
                      <Clock3
                        size={14}
                        className="text-on-surface-muted shrink-0 mt-1"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-on-surface-muted">
                      <span>
                        {notification.userId?.Name ||
                          notification.userId?.name ||
                          "System"}
                      </span>
                      <span>
                        {notification.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
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
