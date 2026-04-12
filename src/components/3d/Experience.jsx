import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Lighting from './Lighting';
import { ShowroomScene } from './ShowroomScene';
import { CameraController } from './CameraController';
import { GruppoEsterno, GruppoInterno, GruppoComune } from './DoorParts';

function WebGLContextHelper({ contextRef }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => { 
    contextRef.current = { gl, scene, camera }; 
  }, [gl, scene, camera, contextRef]);
  return null;
}

function SceneReadyTrigger({ setLoaded }) {
  useEffect(() => { setLoaded(false); }, [setLoaded]);
  return null;
}

export default function Experience({ 
  webglContextRef, 
  setIsLoadingInitial, 
  viewMode, 
  wallColor, 
  extFinish, 
  intFinish, 
  scenario,
  activeAngle,
  cameraTrigger,
  interactionMode,
  isBlackout,
  zoomConfig,
  isDraggingUI
}) {
  return (
    <div 
      className="canvas-zoom-container"
      style={{
        transform: zoomConfig.active ? `scale(2) translate(${zoomConfig.x}px, ${zoomConfig.y}px)` : 'scale(1) translate(0px, 0px)',
        transformOrigin: `${zoomConfig.originX}% ${zoomConfig.originY}%`,
        transition: zoomConfig.instant ? 'none' : 'transform 0.3s ease-out',
        width: '100%',
        height: '100%'
      }}
    >
      <Canvas 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 5], fov: 40 }} 
        gl={{ 
          preserveDrawingBuffer: true, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 0.85,
          alpha: true,
          antialias: true
        }}
      >
        <WebGLContextHelper contextRef={webglContextRef} />
        <Lighting />
        
        <Suspense fallback={null}>
          <SceneReadyTrigger setLoaded={setIsLoadingInitial} />
          <ShowroomScene viewMode={viewMode} wallColor={wallColor} />
          
          <group position={[0, 0, 0]}>
            <GruppoComune scenario={scenario} />
            <GruppoInterno config={intFinish} viewMode={viewMode} scenario={scenario} />
            <GruppoEsterno config={extFinish} viewMode={viewMode} scenario={scenario} />
          </group>
        </Suspense>
        
        <CameraController 
          activeAngle={activeAngle} 
          isBlackout={isBlackout} 
          is3DMode={interactionMode === '3d'} 
          cameraTrigger={cameraTrigger} 
          viewMode={viewMode} 
        />
      </Canvas>
    </div>
  );
}