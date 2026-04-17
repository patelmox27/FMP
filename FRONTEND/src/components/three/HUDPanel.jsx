import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

// ─── Animated counter hook ─────────────────────────────────────────────
function useCounter(target, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    let start = null;
    let animId;
    const from = prevTarget.current;
    prevTarget.current = target;

    const timeout = setTimeout(() => {
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(from + eased * (target - from)));
        if (progress < 1) animId = requestAnimationFrame(step);
        else setValue(target);
      };
      animId = requestAnimationFrame(step);
    }, delay);

    return () => { clearTimeout(timeout); cancelAnimationFrame(animId); };
  }, [target, duration, delay]);
  return value;
}

// ─── Circular progress ring ────────────────────────────────────────────
function CircleRing({ percent, color, size = 56, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
      />
    </svg>
  );
}

function StatRow({ label, value, color, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, color: 'rgba(226,226,232,0.5)',
          letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color,
        fontFamily: 'Space Grotesk, sans-serif' }}>{value.toLocaleString()}
      </span>
    </div>
  );
}

function LiveDot({ isLive }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn(p => !p), 900);
    return () => clearInterval(id);
  }, []);
  const c = isLive ? '#4dffb2' : '#ffb74d';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: on ? c : `${c}33`,
        boxShadow: on ? `0 0 8px ${c}` : 'none',
        transition: 'all 0.3s', flexShrink: 0,
      }} />
      <span style={{ fontSize: 9, color: c, letterSpacing: '0.1em' }}>
        {isLive ? 'LIVE' : 'DEMO'}
      </span>
    </div>
  );
}

const BARS = [40, 65, 55, 80, 72, 90, 60, 85, 70, 95, 78, 88];
function ActivityBars() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, marginTop: 10 }}>
      {BARS.map((h, i) => (
        <div key={i} style={{
          flex: 1, height: `${h}%`,
          background: 'linear-gradient(to top, #b7c4ff44, #b7c4ff)',
          borderRadius: 2,
          animation: `barPulse ${1.5 + i * 0.1}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// ─── HUD content — receives pre-fetched props from LiveScene ──────────
function HUDContent({ available = 0, occupied = 0, reserved = 0, total = 78, revenue = 0, isLive = false, loading = true }) {
  const animAvailable = useCounter(available, 1400, 200);
  const animOccupied  = useCounter(occupied,  1400, 350);
  const animReserved  = useCounter(reserved,  1400, 500);
  const animRevenue   = useCounter(revenue,   1800, 400);
  const occupancyPct  = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div style={{
      width: 220,
      background: 'rgba(17,19,24,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(183,196,255,0.13)',
      borderRadius: 20,
      padding: '18px 16px',
      fontFamily: 'Manrope, sans-serif',
      color: '#e2e2e8',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#b7c4ff', textTransform: 'uppercase', marginBottom: 2 }}>
            Find My Parking
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
            Live Dashboard
          </div>
        </div>
        <LiveDot isLive={isLive} />
      </div>

      {/* Loading shimmer or real content */}
      {loading ? (
        <div style={{ height: 60, background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 14,
          animation: 'shimmer 1.2s ease-in-out infinite alternate' }} />
      ) : (
        <>
          {/* Occupancy ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
            padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <CircleRing percent={occupancyPct} color="#b7c4ff" size={56} stroke={4} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 800,
                  fontFamily: 'Space Grotesk, sans-serif', color: '#b7c4ff' }}>
                  {occupancyPct}%
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(226,226,232,0.4)', marginBottom: 2 }}>Occupancy Rate</div>
              <div style={{ fontSize: 11 }}>{animOccupied} / {total} slots</div>
            </div>
          </div>

          <StatRow label="Available" value={animAvailable} color="#4dffb2" icon="🟢" />
          <StatRow label="Occupied"  value={animOccupied}  color="#ff4d6a" icon="🔴" />
          <StatRow label="Reserved"  value={animReserved}  color="#ffb74d" icon="🟡" />
        </>
      )}

      {/* Revenue */}
      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(77,255,178,0.05)',
        borderRadius: 12, border: '1px solid rgba(77,255,178,0.1)' }}>
        <div style={{ fontSize: 9, color: 'rgba(77,255,178,0.6)', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: 4 }}>Revenue Today</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#4dffb2',
          fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1 }}>
          ₹{animRevenue.toLocaleString()}
        </div>
      </div>

      {/* Activity */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, color: 'rgba(183,196,255,0.4)', letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 4 }}>Hourly Activity</div>
        <ActivityBars />
      </div>

      {/* CTA */}
      <a href="/parking" style={{
        display: 'block', marginTop: 14, textAlign: 'center',
        background: 'linear-gradient(135deg, #b7c4ff22, #b7c4ff11)',
        border: '1px solid rgba(183,196,255,0.25)', borderRadius: 10,
        padding: '8px 0', fontSize: 11, fontWeight: 700, color: '#b7c4ff',
        letterSpacing: '0.08em', textDecoration: 'none',
        fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer',
      }}>
        FIND MY SPOT →
      </a>
    </div>
  );
}

// ─── Floating 3D pane container ───────────────────────────────────────
function FloatingPane({ position, ...props }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.18;
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.018;
  });

  return (
    <group ref={groupRef} position={position} rotation={[0.08, -0.25, 0]}>
      <Html transform occlude={false} style={{ pointerEvents: 'all' }} position={[0, 0, 0.01]} scale={0.065}>
        <style>{`
          @keyframes barPulse {
            from { opacity: 0.5; transform: scaleY(0.85); }
            to   { opacity: 1;   transform: scaleY(1);    }
          }
          @keyframes shimmer {
            from { opacity: 0.3; }
            to   { opacity: 0.7; }
          }
        `}</style>
        <HUDContent {...props} />
      </Html>
    </group>
  );
}

// ─── Export: accepts props from LiveScene ─────────────────────────────
const HUDPanel = (props) => <FloatingPane position={[2, 4.5, 5]} {...props} />;

export default HUDPanel;
