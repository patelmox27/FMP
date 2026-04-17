import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const LivingGrid = () => {
  const meshRef = useRef();
  const { mouse } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColorGrid: { value: new THREE.Color('#b7c4ff') },
    uColorBackground: { value: new THREE.Color('#111318') }
  }), []);

  const vertexShader = `
    varying vec2 vUv;
    varying float vDisplacement;
    uniform float uTime;
    uniform vec2 uMouse;

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Infinite plane feel - we'll handle the repetition in the fragment shader
      // but we can add some subtle waves here
      float dist = distance(uv, uMouse * 0.5 + 0.5);
      float ripple = sin(dist * 10.0 - uTime * 2.0) * 0.5;
      ripple *= smoothstep(0.5, 0.0, dist);
      
      pos.z += ripple;
      vDisplacement = ripple;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying float vDisplacement;
    uniform float uTime;
    uniform vec3 uColorGrid;
    uniform vec3 uColorBackground;

    void main() {
      // Create grid lines
      vec2 gridUv = fract(vUv * 50.0); // Repetition
      float lineX = step(0.98, gridUv.x) + step(0.98, gridUv.y);
      lineX = clamp(lineX, 0.0, 1.0);

      // Fade grid as it gets further from center
      float distToCenter = distance(vUv, vec2(0.5));
      float fade = smoothstep(0.6, 0.2, distToCenter);

      // Mix colors based on grid and ripple displacement
      vec3 finalColor = mix(uColorBackground, uColorGrid, lineX * fade);
      
      // Add a bit of glow where displacement is high
      finalColor += uColorGrid * vDisplacement * 0.2 * fade;

      gl_FragColor = vec4(finalColor, fade);
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smooth interpolation for mouse
      meshRef.current.material.uniforms.uMouse.value.lerp(mouse, 0.1);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[100, 100, 128, 128]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

export default LivingGrid;
