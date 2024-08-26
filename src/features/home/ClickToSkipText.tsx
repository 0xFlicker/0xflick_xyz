import { MeshProps, Vector3, useFrame } from "@react-three/fiber";
import { FC, useRef } from "react";
import { NEON_BLUE } from "./constants";
import { Orbitron } from "./Orbitron";
import { useSpring, animated } from "react-spring";
import * as THREE from "three";
import { or } from "three/webgpu";

const AnimatedOrbitron = animated(Orbitron);
export const ClickToSkipText: FC<
  {
    appear: boolean;
    offScreenBottom: number;
    onSkip?: () => void;
    position:
      | THREE.Vector3
      | [x: number, y: number, z: number]
      | readonly [x: number, y: number, z: number];
  } & Omit<MeshProps, "position">
> = ({
  appear,
  position: visiblePosition,
  onSkip,
  offScreenBottom,
  ...rest
}) => {
  const resolvedPosition =
    visiblePosition instanceof THREE.Vector3
      ? visiblePosition
      : new THREE.Vector3(...visiblePosition);
  const { position } = useSpring({
    position: appear
      ? resolvedPosition
      : [resolvedPosition.x, offScreenBottom, resolvedPosition.z],
  });

  const rectRef = useRef<THREE.Mesh>(null);
  const orbitronRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // Calculate the size of the orbitron text
    if (!orbitronRef.current || !rectRef.current) return;
    const orbitronSize = new THREE.Vector3();
    new THREE.Box3().setFromObject(orbitronRef.current).getSize(orbitronSize);
    // Set the size of the rect to match the orbitron text
    rectRef.current.scale.set(orbitronSize.x, orbitronSize.y, 1);
    // Set the position of the rect to match the orbitron text
    // The origin of the text is at bottom start of text but the origin of the rect is center
    rectRef.current.position.set(
      orbitronRef.current.position.x + orbitronSize.x / 2,
      orbitronRef.current.position.y + orbitronSize.y / 3,
      orbitronRef.current.position.z
    );
  });
  return (
    <>
      <mesh ref={rectRef} position={resolvedPosition} onClick={onSkip}>
        <planeGeometry attach="geometry" args={[1.1, 1.1]} />
        <meshStandardMaterial transparent />
      </mesh>
      <AnimatedOrbitron
        ref={orbitronRef}
        position={position as any}
        height={0.1}
        {...rest}
      >
        skip
        <meshNormalMaterial />
      </AnimatedOrbitron>
    </>
  );
};
