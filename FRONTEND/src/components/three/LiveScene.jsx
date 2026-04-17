import React from 'react';
import { useParkingLiveData } from '../../api/useParkingLiveData';
import ParkingLot3D from './ParkingLot3D';
import HUDPanel from './HUDPanel';
import LivingGrid from './LivingGrid';
import DataParticles from './DataParticles';

import StylizedCar3D from './StylizedCar3D';

/**
 * LiveScene — rendered INSIDE the Three.js Canvas.
 * Fetches live parking data once here (single source of truth)
 * and distributes it to all 3D child components via props.
 *
 * Re-fetches every 30 seconds. On fetch, slotLayout updates trigger
 * ParkingLot3D to smoothly re-render with the new slot colors.
 */
const LiveScene = () => {
  const { slotLayout, available, occupied, reserved, total, revenue, isLive, loading } =
    useParkingLiveData(30000);

  return (
    <>
      {/* Atmospheric background layers */}
      <LivingGrid />
      <DataParticles />

      {/* 3D parking lot — receives live slot matrix */}
      <ParkingLot3D slotLayout={slotLayout} />

      {/* Stylized high-end vehicle on the right side */}
      <StylizedCar3D position={[16, -0.5, 2]} rotation={[0, -Math.PI / 4, 0]} />

      {/* Floating HUD — receives pre-computed stats (no second fetch) */}
      <HUDPanel
        available={available}
        occupied={occupied}
        reserved={reserved}
        total={total}
        revenue={revenue}
        isLive={isLive}
        loading={loading}
      />
    </>
  );
};

export default LiveScene;
