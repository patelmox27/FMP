import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Demo fallback: 0 = Available, 1 = Occupied, 2 = Reserved
const DEMO_LAYOUT = [
  [1, 0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0, 1],
  [2, 0, 0, 0, 1, 0],
  [0, 1, 0, 2, 0, 0],
];

const STATUS_COLORS = {
  0: '#4dffb2',
  1: '#ff4d6a',
  2: '#ffb74d',
};

const SLOT_W = 1.4;
const SLOT_H = 0.18;
const SLOT_D = 2.2;
const GAP_X = 0.35;
const GAP_Z = 0.5;

// ─── Spring physics helper ────────────────────────────────────────────
function springLerp(current, target, velocity, stiffness = 0.12, damping = 0.75) {
  const force = (target - current) * stiffness;
  const newVelocity = (velocity + force) * damping;
  return { value: current + newVelocity, velocity: newVelocity };
}

// ─── Radar sweep line that travels across the lot ─────────────────────
function RadarSweep({ totalX, totalZ, offsetX, offsetZ }) {
  const sweepRef = useRef();
  useFrame((state) => {
    if (!sweepRef.current) return;
    const t = state.clock.getElapsedTime();
    const period = 4; // seconds per sweep
    const frac = (t % period) / period;
    sweepRef.current.position.z = offsetZ - totalZ / 2 + frac * totalZ;
    sweepRef.current.material.opacity = 0.18 * Math.sin(frac * Math.PI);
  });

  return (
    <mesh ref={sweepRef} rotation={[-Math.PI / 2, 0, 0]} position={[offsetX, 0.01, offsetZ]}>
      <planeGeometry args={[totalX + GAP_X * 2, 0.18]} />
      <meshBasicMaterial
        color="#4dffb2"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Corner pillar ────────────────────────────────────────────────────
function Pillar({ position }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 2.5, 8]} />
      <meshStandardMaterial
        color="#1e2024"
        emissive="#b7c4ff"
        emissiveIntensity={0.15}
        roughness={0.4}
        metalness={0.9}
      />
    </mesh>
  );
}

// ─── Hover ring that expands outward ─────────────────────────────────
function HoverRing({ visible }) {
  const ringRef = useRef();
  const scaleRef = useRef(0);

  useFrame(() => {
    if (!ringRef.current) return;
    const target = visible ? 1.4 : 0;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, target, 0.1);
    ringRef.current.scale.setScalar(scaleRef.current);
    ringRef.current.material.opacity = visible
      ? scaleRef.current * 0.4
      : Math.max(0, scaleRef.current * 0.2);
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -SLOT_H / 2 - 0.01, 0]}>
      <ringGeometry args={[0.8, 1.1, 32]} />
      <meshBasicMaterial
        color="#4dffb2"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Single parking slot ──────────────────────────────────────────────
function ParkingSlot({ position, status, index }) {
  const meshRef = useRef();
  const carRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => new THREE.Color(STATUS_COLORS[status]), [status]);

  // Spring state for Y entrance
  const spring = useRef({ value: -3, velocity: 0 });
  const delay = index * 0.045;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!meshRef.current) return;

    // ── Staggered spring entrance ──
    if (t > delay) {
      const targetY = hovered ? 0.4 : 0;
      const result = springLerp(spring.current.value, targetY, spring.current.velocity, 0.1, 0.72);
      spring.current = { value: result.value, velocity: result.velocity };
      meshRef.current.position.y = result.value;
    }

    // ── Per-status animation ──
    if (status === 0) {
      // Available: gentle breathe (scale XZ only)
      const breathe = Math.sin(t * 1.8 + index * 0.6) * 0.025 + 1;
      meshRef.current.scale.set(breathe, 1, breathe);

      // Emissive pulse
      meshRef.current.material.emissiveIntensity =
        hovered ? 2.2 : Math.sin(t * 2 + index * 0.5) * 0.25 + 0.65;
    } else if (status === 2) {
      // Reserved: slow amber blink
      const blink = Math.abs(Math.sin(t * 0.8 + index * 0.3));
      meshRef.current.material.emissiveIntensity = hovered ? 1.6 : blink * 0.5 + 0.2;
    } else {
      // Occupied: static, low emissive unless hovered
      meshRef.current.material.emissiveIntensity = hovered ? 1.4 : 0.3;
    }

    // ── Glow halo ──
    if (glowRef.current) {
      glowRef.current.material.opacity = hovered
        ? 0.4
        : Math.sin(t * 1.5 + index * 0.4) * 0.06 + 0.1;
    }

    // ── Car micro-bob for occupied ──
    if (carRef.current && status === 1) {
      carRef.current.position.y = SLOT_H / 2 + 0.18 + Math.sin(t * 1.2 + index) * 0.015;
    }
  });

  return (
    <group position={[position[0], -3, position[2]]}>
      {/* Main slot slab */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[SLOT_W, SLOT_H, SLOT_D]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* Slot edge highlight line (front face) */}
      <mesh position={[0, SLOT_H / 2 + 0.001, SLOT_D / 2 - 0.02]}>
        <boxGeometry args={[SLOT_W, 0.012, 0.04]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Glow halo on floor */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -SLOT_H / 2, 0]}>
        <planeGeometry args={[SLOT_W * 1.8, SLOT_D * 1.5]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding hover ring */}
      <HoverRing visible={hovered} />

      {/* Car body for occupied slots */}
      {status === 1 && (
        <group ref={carRef} position={[0, SLOT_H / 2 + 0.18, 0]}>
          {/* Body */}
          <mesh castShadow>
            <boxGeometry args={[SLOT_W * 0.68, 0.22, SLOT_D * 0.56]} />
            <meshStandardMaterial
              color="#1c1e26"
              emissive="#ff4d6a"
              emissiveIntensity={0.12}
              roughness={0.4}
              metalness={0.7}
            />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 0.18, -0.1]}>
            <boxGeometry args={[SLOT_W * 0.5, 0.15, SLOT_D * 0.35]} />
            <meshStandardMaterial
              color="#14161c"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
          {/* Headlights */}
          <pointLight position={[0, 0, SLOT_D * 0.3]} intensity={0.3} color="#ff6a85" distance={1.5} />
        </group>
      )}

      {/* "P" marker plane for available slots */}
      {status === 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SLOT_H / 2 + 0.002, 0]}>
          <planeGeometry args={[SLOT_W * 0.9, SLOT_D * 0.9]} />
          <meshBasicMaterial
            color="#4dffb2"
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Lane dividers ─────────────────────────────────────────────────────
function LaneDividers({ rows, cols, offsetX, offsetZ }) {
  const totalX = cols * (SLOT_W + GAP_X) - GAP_X;
  const dividers = [];
  for (let r = 0; r <= rows; r++) {
    const z =
      offsetZ +
      r * (SLOT_D + GAP_Z) -
      (rows * (SLOT_D + GAP_Z)) / 2 +
      SLOT_D / 2 -
      GAP_Z / 2;
    dividers.push(
      <mesh key={r} position={[offsetX, -0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[totalX + GAP_X * 2, 0.08]} />
        <meshBasicMaterial color="#444650" transparent opacity={0.5} />
      </mesh>
    );
  }
  return <>{dividers}</>;
}

// ─── Full lot ──────────────────────────────────────────────────────────
const ParkingLot3D = ({ slotLayout }) => {
  const groupRef = useRef();

  // Use live data if provided, otherwise fall back to demo
  const layout = (slotLayout && slotLayout.length > 0) ? slotLayout : DEMO_LAYOUT;
  const rows = layout.length;
  const cols = layout[0].length;

  const totalX = cols * (SLOT_W + GAP_X) + GAP_X * 0.5;
  const totalZ = rows * (SLOT_D + GAP_Z) + GAP_Z * 0.5;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Slow, gentle rocking
    groupRef.current.rotation.y = Math.sin(t * 0.12) * 0.14;
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.025;
  });

  const slots = useMemo(() => {
    const result = [];
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * (SLOT_W + GAP_X) - (cols * (SLOT_W + GAP_X)) / 2 + SLOT_W / 2;
        const z = row * (SLOT_D + GAP_Z) - (rows * (SLOT_D + GAP_Z)) / 2 + SLOT_D / 2;
        result.push({ x, z, status: layout[row][col], index: idx++ });
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, JSON.stringify(layout)]);

  // Corner pillar positions
  const hw = totalX / 2 + 0.1;
  const hz = totalZ / 2 + 0.1;
  const pillarPositions = [
    [-hw, 1.1, -hz], [hw, 1.1, -hz],
    [-hw, 1.1,  hz], [hw, 1.1,  hz],
  ];

  return (
    <group ref={groupRef} position={[12, 0.5, -5]}>
      {/* Floor slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[totalX + 1, totalZ + 1]} />
        <meshStandardMaterial
          color="#1a1c25"
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.4}
          emissive="#b7c4ff"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Floor glow edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
        <planeGeometry args={[totalX + 1.4, totalZ + 1.4]} />
        <meshBasicMaterial
          color="#b7c4ff"
          transparent
          opacity={0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Lane dividers */}
      <LaneDividers rows={rows} cols={cols} offsetX={0} offsetZ={0} />

      {/* Radar sweep */}
      <RadarSweep totalX={totalX} totalZ={totalZ} offsetX={0} offsetZ={0} />

      {/* Corner pillars */}
      {pillarPositions.map((pos, i) => (
        <Pillar key={i} position={pos} />
      ))}

      {/* All parking slots */}
      {slots.map(({ x, z, status, index }) => (
        <ParkingSlot
          key={index}
          index={index}
          position={[x, 0, z]}
          status={status}
        />
      ))}

      {/* Dedicated lot lighting */}
      <pointLight position={[0, 7, 0]} intensity={2} color="#b7c4ff" distance={22} />
      <pointLight position={[-5, 4, -5]} intensity={0.9} color="#4dffb2" distance={18} />
      <pointLight position={[5, 3, 5]} intensity={0.6} color="#ffb74d" distance={12} />
    </group>
  );
};

export default ParkingLot3D;
