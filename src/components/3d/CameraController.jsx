import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export function CameraController({ activeAngle, isBlackout, is3DMode, cameraTrigger, viewMode }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const startTime = useRef(0);
  const isFirstRender = useRef(true);
  const ANIMATION_DURATION = 1.5;
  const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  useEffect(() => {
    if (activeAngle && controlsRef.current) {
      if (!is3DMode || isFirstRender.current) {
        camera.position.set(...activeAngle.position);
        controlsRef.current.target.set(...activeAngle.target);
        controlsRef.current.update();
        isFirstRender.current = false;
        isAnimating.current = false;
        controlsRef.current.enableRotate = is3DMode;
        controlsRef.current.enableZoom = is3DMode;
      } else {
        if (isBlackout) {
          camera.position.set(...activeAngle.position);
          controlsRef.current.target.set(...activeAngle.target);
          controlsRef.current.update();
          isAnimating.current = false;
        } else {
          startPos.current.copy(camera.position);
          startTarget.current.copy(controlsRef.current.target);
          endPos.current.set(...activeAngle.position);
          endTarget.current.set(...activeAngle.target);
          startTime.current = 0;
          isAnimating.current = true;
          controlsRef.current.enableRotate = false;
          controlsRef.current.enableZoom = false;
        }
      }
    }
  }, [activeAngle, cameraTrigger, is3DMode, camera]);

  useFrame(({ clock }) => {
    if (isAnimating.current && controlsRef.current) {
      if (startTime.current === 0) startTime.current = clock.getElapsedTime();
      const elapsed = clock.getElapsedTime() - startTime.current;
      let progress = elapsed / ANIMATION_DURATION;
      if (progress >= 1.0) {
        progress = 1.0;
        isAnimating.current = false;
        if (is3DMode) {
          controlsRef.current.enableRotate = true;
          controlsRef.current.enableZoom = true;
        }
      }
      const easeProgress = easeInOutCubic(progress);
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget.current, endTarget.current, easeProgress);
      controlsRef.current.target.copy(currentTarget);
      const startOffset = startPos.current.clone().sub(startTarget.current);
      const endOffset = endPos.current.clone().sub(endTarget.current);
      const startSpherical = new THREE.Spherical().setFromVector3(startOffset);
      const endSpherical = new THREE.Spherical().setFromVector3(endOffset);
      let thetaDiff = endSpherical.theta - startSpherical.theta;
      while (thetaDiff > Math.PI) thetaDiff -= 2 * Math.PI;
      while (thetaDiff < -Math.PI) thetaDiff += 2 * Math.PI;
      const currentTheta = startSpherical.theta + thetaDiff * easeProgress;
      const currentPhi = startSpherical.phi + (endSpherical.phi - startSpherical.phi) * easeProgress;
      const currentRadius = startSpherical.radius + (endSpherical.radius - startSpherical.radius) * easeProgress;
      const currentSpherical = new THREE.Spherical(currentRadius, currentPhi, currentTheta);
      const currentOffset = new THREE.Vector3().setFromSpherical(currentSpherical);
      camera.position.copy(currentTarget).add(currentOffset);
      controlsRef.current.update();
    }
  });

  // Limiti Orizzontali (Azimuth) molto ristretti (~30 gradi max)
  const limitAzimuthMin = viewMode === 'external' ? -Math.PI / 6.5 : Math.PI - Math.PI / 6.5;
  const limitAzimuthMax = viewMode === 'external' ? Math.PI / 6.5 : Math.PI + Math.PI / 6.5;
  
  return (
    <OrbitControls 
      ref={controlsRef} 
      makeDefault 
      enablePan={false} 
      enableZoom={is3DMode} 
      enableRotate={is3DMode} 
      zoomSpeed={0.5} 
      rotateSpeed={0.1} 
      minDistance={2.5} 
      maxDistance={5.2} /* Zoom-out massimo diminuito */
      minPolarAngle={Math.PI / 3} /* Limite superiore abbassato */
      maxPolarAngle={Math.PI / 2.05} /* Limite inferiore alzato */
      minAzimuthAngle={limitAzimuthMin}
      maxAzimuthAngle={limitAzimuthMax}
    />
  );
}