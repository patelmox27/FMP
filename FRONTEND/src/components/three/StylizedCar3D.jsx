import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StylizedCar3D = ({ position = [18, 0, 0], rotation = [0, -Math.PI / 4, 0], color = "#b7c4ff" }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle floating
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.15;
    // Slight rocking
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.02;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* ── Main Body ── */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 0.6, 2]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ── Upper Cabin (Glass) ── */}
      <mesh position={[0.2, 0.55, 0]} castShadow>
        <boxGeometry args={[2.2, 0.6, 1.6]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3} 
          metalness={1} 
          roughness={0} 
        />
      </mesh>

      {/* ── Ground Glow Shadow ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.1} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Headlights ── */}
      <group position={[2.01, -0.1, 0.7]}>
        <mesh>
          <boxGeometry args={[0.1, 0.2, 0.4]} />
          <meshBasicMaterial color="#4dffb2" />
        </mesh>
        <pointLight intensity={1.5} color="#4dffb2" distance={5} />
      </group>
      <group position={[2.01, -0.1, -0.7]}>
        <mesh>
          <boxGeometry args={[0.1, 0.2, 0.4]} />
          <meshBasicMaterial color="#4dffb2" />
        </mesh>
        <pointLight intensity={1.5} color="#4dffb2" distance={5} />
      </group>

      {/* ── Taillights ── */}
      <group position={[-2.01, 0, 0.6]}>
        <mesh>
          <boxGeometry args={[0.1, 0.15, 0.6]} />
          <meshBasicMaterial color="#ff4d6a" />
        </mesh>
      </group>
      <group position={[-2.01, 0, -0.6]}>
        <mesh>
          <boxGeometry args={[0.1, 0.15, 0.6]} />
          <meshBasicMaterial color="#ff4d6a" />
        </mesh>
      </group>

      {/* ── Wheels (Chrome) ── */}
      {[
        [1.2, -0.3, 0.95], [1.2, -0.3, -0.95],
        [-1.4, -0.3, 0.95], [-1.4, -0.3, -0.95]
      ].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.35, 16]} />
          <meshStandardMaterial color="#222" metalness={1} roughness={0.1} />
        </mesh>
      ))}

      {/* ── Body Accents ── */}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[4.2, 0.1, 2.1]} />
        <meshBasicMaterial color="#4dffb2" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export default StylizedCar3D;
