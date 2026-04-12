import React, { useLayoutEffect } from 'react';
import { Environment, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OmbraStatica } from './Generic'; // IMPORTANTE: Ora usiamo lo strumento condiviso!

function ShowroomWall({ color }) {
  const { scene } = useGLTF('/models/showroom/muro_esterno.glb');
  const textures = useTexture({
    normalMap: '/textures/showroom/muro/normal.jpg',
    roughnessMap: '/textures/showroom/muro/roughness.jpg',
  });

  useLayoutEffect(() => {
    Object.values(textures).forEach((tex) => {
      if (tex) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(0.7, 0.7); }
    });
  }, [textures]);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ 
          color: new THREE.Color(color), 
          normalMap: textures.normalMap, roughnessMap: textures.roughnessMap,
          roughness: 0.8, side: THREE.DoubleSide 
        });
      }
    });
  }, [scene, textures, color]);

  return <primitive object={scene} />;
}

function ShowroomFloor() {
  const { scene } = useGLTF('/models/showroom/pavimento_esterno.glb');
  useLayoutEffect(() => {
    scene.traverse((child) => { if (child.isMesh && child.material) child.material.side = THREE.DoubleSide; });
  }, [scene]);
  return <primitive object={scene} />;
}

function Finestre() {
  const dx = useGLTF('/models/showroom/finestra_dx.glb');
  const sx = useGLTF('/models/showroom/finestra_sx.glb');

  const aoMapDx = useTexture('/textures/showroom/finestre/AO_Finestra_Dx.png');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh) {
          const matName = child.material.name.toLowerCase();
          if (matName.includes('glass') || matName.includes('vetro')) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#000000'), metalness: 0.1, roughness: 0.0,      
              transparent: true, opacity: 0.35, reflectivity: 1.0, clearcoat: 1.0,      
              clearcoatRoughness: 0.0, envMapIntensity: 4.0 
            });
          } else {
            child.material.roughness = 0.6; child.material.metalness = 0.2;
          }
        }
      });
    });
  }, [dx, sx]);

  return ( <group><primitive object={dx.scene} /><primitive object={sx.scene} /></group> );
}

function Tende() {
  const dx = useGLTF('/models/showroom/tenda_dx.glb');
  const sx = useGLTF('/models/showroom/tenda_sx.glb');

  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide; child.castShadow = true; child.receiveShadow = true;
        }
      });
    });
  }, [dx, sx]);

  return ( <group><primitive object={dx.scene} /><primitive object={sx.scene} /></group> );
}

function Piante() {
  const dx = useGLTF('/models/showroom/pianta_dx.glb');
  const sx = useGLTF('/models/showroom/pianta_sx.glb');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide; child.castShadow = true; child.receiveShadow = true;
        }
      });
    });
  }, [dx, sx]);

  return ( <group><primitive object={dx.scene} /><primitive object={sx.scene} /></group> );
}

export function ShowroomScene({ viewMode, wallColor }) {
  const showExterior = viewMode === 'external';

  return (
    <group>
      <Environment files="/textures/showroom/luce_studio.hdr" background={false} environmentIntensity={0.7} />
      <hemisphereLight skyColor="#b1d1ff" groundColor="#3d2b1f" intensity={0.5} />
      <directionalLight position={[2, 10, 4]} intensity={2.0} color="#fff1d0" castShadow={false} />
      <directionalLight position={[-5, 2, -2]} intensity={0.4} color="#d0e0ff" />

      <group visible={showExterior}>
        <ShowroomWall color={wallColor} />
        <ShowroomFloor />
        <Finestre />
        <Tende />
        <Piante />

        <OmbraStatica modelPath={'/models/showroom/piano_ombra.glb'} urlTexture={'/textures/showroom/piante/ombra_dx.png'} />
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_muro.glb'} urlTexture={'/textures/showroom/piante/ombra_dx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx.png'} />
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_muro_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_porta.glb'} urlTexture={'/textures/showroom/piante/ombra_porta.png'} />
      </group>
    </group>
  );
}

// Preload Risorse
useGLTF.preload('/models/showroom/muro_esterno.glb');
useGLTF.preload('/models/showroom/pavimento_esterno.glb');
useGLTF.preload('/models/showroom/finestra_dx.glb');
useGLTF.preload('/models/showroom/finestra_sx.glb');
useGLTF.preload('/models/showroom/tenda_dx.glb');
useGLTF.preload('/models/showroom/tenda_sx.glb');
useGLTF.preload('/models/showroom/pianta_dx.glb');
useGLTF.preload('/models/showroom/pianta_sx.glb');
useGLTF.preload('/models/showroom/piano_ombra.glb');
useGLTF.preload('/models/showroom/piano_ombra_muro.glb');
useGLTF.preload('/models/showroom/piano_ombra_sx.glb');
useGLTF.preload('/models/showroom/piano_ombra_muro_sx.glb');
useGLTF.preload('/models/showroom/piano_ombra_porta.glb');