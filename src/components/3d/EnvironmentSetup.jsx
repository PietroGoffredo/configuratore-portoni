import React, { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useTexture, Sky, Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';

const SCENE_X_SHIFT = 0.5;  
const SCENE_Z_SHIFT = 0.1; 

export function CameraController({ activeAngle, isBlackout, is3DMode, cameraTrigger }) {
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
  
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

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
          controlsRef.current.enableRotate = is3DMode;
          controlsRef.current.enableZoom = is3DMode;
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
  
  return (
    <OrbitControls 
      ref={controlsRef} makeDefault enablePan={false} 
      enableZoom={is3DMode} enableRotate={is3DMode}
      minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} 
      minDistance={2} maxDistance={7}
    />
  );
}

function generateFloorAlpha() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 100, 256, 256, 256);
  gradient.addColorStop(0, 'white'); gradient.addColorStop(0.4, 'white'); gradient.addColorStop(1, 'black'); 
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function generateShadowAlpha() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, 'white'); gradient.addColorStop(1, 'black');   
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function FakeShadowLayer() {
  const alphaMap = useMemo(() => generateShadowAlpha(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0001, 0]} receiveShadow={false}>
      <circleGeometry args={[5, 100]} />
      <meshBasicMaterial color="#351616" alphaMap={alphaMap} transparent={true} opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

function StudioFloor() {
  const props = useTexture({
    map: '/textures/ambiente/studio/color.jpg', normalMap: '/textures/ambiente/studio/normal.png', 
    roughnessMap: '/textures/ambiente/studio/roughness.jpg', aoMap: '/textures/ambiente/studio/ao.jpg',
  });
  useMemo(() => {
    Object.values(props).forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace;
    });
    props.normalMap.colorSpace = THREE.NoColorSpace; props.roughnessMap.colorSpace = THREE.NoColorSpace; props.aoMap.colorSpace = THREE.NoColorSpace;
  }, [props]);
  const alphaMap = useMemo(() => generateFloorAlpha(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={-1} position={[0, -0.0001, 0]}>
      <circleGeometry args={[7.5, 64]} />
      <meshStandardMaterial {...props} alphaMap={alphaMap} transparent={true} opacity={1} roughness={0.9} metalness={0.1} side={THREE.DoubleSide} color="#ffffff" depthWrite={false} />
    </mesh>
  );
}

export function StudioScene() {
  return (
    <group>
      <Environment preset="city" background={false} blur={0.8} environmentIntensity={0.5} />
      <ambientLight intensity={1.3} />
      <spotLight position={[-1.5, 2, 2]} intensity={2} penumbra={1} castShadow={false} />
      <spotLight position={[3.5, 1.5, -2]} intensity={1} penumbra={1} castShadow={false} />
      <spotLight position={[0, 2.5, -3]} intensity={1.5} angle={0.8} castShadow={false} />
      <directionalLight position={[-3, 12, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} shadow-radius={3} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <group position={[SCENE_X_SHIFT, 0, SCENE_Z_SHIFT]}>
        <StudioFloor />
        <FakeShadowLayer />
      </group>
    </group>
  );
}

// ------------------------------------------------------------------
// SCENARIO 1: VILLA MODERNA (ORA CON SUPPORTO GIORNO/NOTTE)
// ------------------------------------------------------------------
export function VillaScene({ isNightMode }) {
  return (
    <group>
      {/* 1. CIELO PROCEDURALE */}
      <Sky 
        distance={45000} 
        sunPosition={isNightMode ? [0, -10, 0] : [15, 20, 10]} // Sole scende sotto l'orizzonte di notte
        inclination={0} 
        azimuth={0.25} 
        turbidity={0.1}      
        rayleigh={isNightMode ? 0.1 : 0.5} // Abbassato di notte per evitare l'effetto tramonto rosso
        mieCoefficient={0.001} 
        mieDirectionalG={0.7}
      />

      {/* 2. NUVOLE VOLUMETRICHE */}
      <Clouds limit={400} material={THREE.MeshBasicMaterial}>
        <Cloud segments={20} bounds={[15, 2, 2]} volume={10} color={isNightMode ? "#1a2035" : "#ffffff"} position={[-20, 15, -30]} opacity={0.6} speed={0.1} />
        <Cloud segments={20} bounds={[15, 2, 2]} volume={12} color={isNightMode ? "#1a2035" : "#ffffff"} position={[20, 18, -25]} opacity={0.5} speed={0.2} />
      </Clouds>

      {/* 3. ILLUMINAZIONE E FIX OMBRE DINAMICI */}
      <ambientLight 
        intensity={isNightMode ? 0.05 : 0.3} 
        color={isNightMode ? "#445588" : "#ffffff"} 
      /> 
      
      <directionalLight 
        position={[15, 20, 10]} 
        intensity={isNightMode ? 0.1 : 1.0} // Luce lunare debole di notte
        color={isNightMode ? "#88aaff" : "#fff4e5"} // Toni freddi di notte, caldi di giorno
        castShadow 
        shadow-mapSize={[4096, 4096]} 
        shadow-bias={-0.0005}         
        shadow-normalBias={0.05}      
        shadow-radius={8}             
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      <Environment files="/textures/cielo.exr" background={false} environmentIntensity={isNightMode ? 0.1 : 0.5} />
    </group>
  );
}