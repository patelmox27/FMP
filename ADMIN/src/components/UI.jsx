export function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
  const colorMap = {
    primary: { bg: 'bg-primary/10', border: 'border-primary/20', icon: 'text-primary', trend: 'text-primary' },
    green:   { bg: 'bg-accent-green/10', border: 'border-accent-green/20', icon: 'text-accent-green', trend: 'text-accent-green' },
    amber:   { bg: 'bg-accent-amber/10', border: 'border-accent-amber/20', icon: 'text-accent-amber', trend: 'text-accent-amber' },
    red:     { bg: 'bg-accent-red/10', border: 'border-accent-red/20', icon: 'text-accent-red', trend: 'text-accent-red' },
    blue:    { bg: 'bg-accent-blue/10', border: 'border-accent-blue/20', icon: 'text-accent-blue', trend: 'text-accent-blue' },
  };
  const c = colorMap[color];
  return (
    <div className={`stat-card glass-card p-5 border ${c.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-on-surface-muted text-xs font-medium uppercase tracking-wide mb-2">{title}</p>
          <p className="font-display text-2xl font-bold text-on-surface">{value}</p>
          {subtitle && <p className="text-on-surface-muted text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-2 font-medium ${c.trend}`}>{trend}</p>
          )}
        </div>
        <div className={`${c.bg} p-3 rounded-xl border ${c.border} shrink-0`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">{title}</h1>
        {subtitle && <p className="text-on-surface-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    active:    'bg-accent-green/10 text-accent-green border-accent-green/20',
    completed: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
    cancelled: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    available: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    occupied:  'bg-accent-red/10 text-accent-red border-accent-red/20',
    reserved:  'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'bg-surface-border text-on-surface-muted'}`}>
      {status}
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ message = 'No data available' }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-on-surface-muted">
      <p className="text-sm">{message}</p>
    </div>
  );
}
