import { ShieldCheck, UserCheck, Users2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getUsers } from "../api/adminApi";
import {
  Badge,
  EmptyState,
  LoadingSpinner,
  PageHeader,
} from "../components/UI";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getUsers();
        setUsers(res.data.users || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const total = users.length;
    const admins = users.filter((user) => user.role === "admin").length;
    const active = users.filter((user) => user.status === "active").length;
    const inactive = users.filter((user) => user.status === "inactive").length;
    return { total, admins, active, inactive };
  }, [users]);

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
        title="Users"
        subtitle="Registered accounts and access-level overview."
      />

      {error && (
        <div className="glass-card border border-accent-red/20 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Total Users
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {summary.total}
          </p>
        </div>
        <div className="glass-card p-5 border border-primary/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Admins
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {summary.admins}
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
        <div className="glass-card p-5 border border-accent-red/20">
          <p className="text-xs uppercase tracking-wide text-on-surface-muted">
            Inactive
          </p>
          <p className="mt-2 text-2xl font-bold text-on-surface">
            {summary.inactive}
          </p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-on-surface">
              User Directory
            </h2>
            <p className="text-xs text-on-surface-muted">
              Sorted by newest first
            </p>
          </div>
          <Users2 size={18} className="text-primary" />
        </div>

        {users.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-on-surface-muted">
                  <th className="pb-3 text-left font-medium">User</th>
                  <th className="pb-3 text-left font-medium">Email</th>
                  <th className="pb-3 text-left font-medium">Phone</th>
                  <th className="pb-3 text-left font-medium">Role</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                  <th className="pb-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="py-3 text-on-surface">
                      <div className="font-medium">
                        {user.Name || user.name || "Unknown user"}
                      </div>
                      <div className="text-xs text-on-surface-muted">
                        ID: {String(user._id).slice(-8)}
                      </div>
                    </td>
                    <td className="py-3 text-on-surface-muted">{user.email}</td>
                    <td className="py-3 text-on-surface-muted">
                      {user.phone || "—"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${user.role === "admin" ? "border-primary/20 bg-primary/10 text-primary" : "border-surface-border bg-surface-low text-on-surface-muted"}`}
                      >
                        {user.role === "admin" ? (
                          <ShieldCheck size={12} />
                        ) : (
                          <UserCheck size={12} />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge status={user.status} />
                    </td>
                    <td className="py-3 text-on-surface-muted">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
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
