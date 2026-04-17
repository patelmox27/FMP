import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import LiveScene from './LiveScene';

const Experience = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Suspense fallback={null}>
          {/* Cinema Camera — positioned far left, looking across to the right */}
          <PerspectiveCamera 
            makeDefault 
            position={[-15, 12, 22]} 
            rotation={[-Math.PI / 8, -0.4, 0]} 
            fov={40} 
          />

          {/* High-end Studio Lighting */}
          <ambientLight intensity={0.5} />
          <spotLight 
            position={[10, 20, 10]} 
            angle={0.45} 
            penumbra={1} 
            intensity={2} 
            castShadow 
            color="#b7c4ff"
          />
          <pointLight position={[-20, 10, 5]} intensity={1.5} color="#4dffb2" />
          <pointLight position={[15, 5, -5]} intensity={2} color="#ffb74d" />

          {/*
            LiveScene is the single source of truth:
            - Fetches live data once via useParkingLiveData
            - Passes slotLayout → ParkingLot3D  (colors the 3D grid)
            - Passes stats      → HUDPanel      (drives dashboard numbers)
            - Renders LivingGrid + DataParticles (atmosphere)
          */}
          <LiveScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Experience;
