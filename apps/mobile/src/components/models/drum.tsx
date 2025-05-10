import React, { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Simple fallback component
function FallbackBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

function DrumModel({ active }: { active: boolean }) {
  const [error, setError] = useState(false);
  const ref = useRef<THREE.Group>(null);

  // Always call hooks at the top level
  const { scene } = useGLTF("/assets/models/drums.glb");

  // Handle errors with useEffect
  useEffect(() => {
    if (!scene) {
      console.error("Error: Model scene not loaded");
      setError(true);
    }
  }, [scene]);

  // Simple animation
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y += active ? 0.01 : 0.001;
      ref.current.position.y = Math.sin(clock.getElapsedTime()) * 0.1;
    }
  });

  // Show fallback if model fails to load
  if (error || !scene) {
    return <FallbackBox />;
  }

  return (
    <group ref={ref} scale={active ? 1.2 : 1}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * DrumScene is a React component that renders a 3D drum scene with a point light,
 * ambient light, and a 3D model of a drum. The drum's scale and color will be
 * animated based on the given `active` prop.
 *
 * @param {boolean} active Whether the drum should be animated.
 * @returns {JSX.Element} A JSX element representing the drum scene.
 */
export default function DrumScene({ active }: { active: boolean }) {
  return (
    <Canvas>
      <Suspense fallback={<FallbackBox />}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} />
        <DrumModel active={active} />
      </Suspense>
    </Canvas>
  );
}
