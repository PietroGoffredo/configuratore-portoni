import React, { useLayoutEffect } from 'react';
import { Environment, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OmbraStatica } from './Generic';

// --- COMPONENTI ARCHITETTONICI ---
function ShowroomWall({ color }) {
  const { scene } = useGLTF('/models/showroom/muro_esterno.glb');
  const textures = useTexture({
    normalMap: '/textures/showroom/muro/normal.jpg',
    roughnessMap: '/textures/showroom/muro/roughness.jpg',
  });

  useLayoutEffect(() => {
    Object.values(textures).forEach((tex) => {
      if (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(0.7, 0.7);
      }
    });
  }, [textures]);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ 
          color: new THREE.Color(color), 
          normalMap: textures.normalMap,
          roughnessMap: textures.roughnessMap,
          roughness: 0.8,
          side: THREE.DoubleSide 
        });
      }
    });
  }, [scene, textures, color]);

  return <primitive object={scene} />;
}

function ShowroomFloor() {
  const { scene } = useGLTF('/models/showroom/pavimento_esterno.glb');
  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) child.material.side = THREE.DoubleSide;
    });
  }, [scene]);
  return <primitive object={scene} />;
}

// === COMPONENTE FINESTRE ===
function Finestre() {
  const dx = useGLTF('/models/showroom/finestra_dx.glb');
  const sx = useGLTF('/models/showroom/finestra_sx.glb');
  
  const shadowMaps = useTexture({
    dx: '/textures/showroom/finestre/AO_Finestra_Dx.png',
    sx: '/textures/showroom/finestre/AO_Finestra_Sx.png'
  });

  useLayoutEffect(() => {
    Object.values(shadowMaps).forEach(map => {
      map.colorSpace = THREE.NoColorSpace; 
      map.flipY = false;
      map.channel = 1; 
    });

    [dx.scene, sx.scene].forEach((scene, index) => {
      const currentMap = index === 0 ? shadowMaps.dx : shadowMaps.sx;

      scene.traverse((child) => {
        if (child.isMesh) {
          const meshName = child.name.toLowerCase();

          if (meshName.includes('vetro') || meshName.includes('glass')) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#000000'), 
              metalness: 0, 
              roughness: 0,           
              transparent: true, 
              opacity: 0.35,          
              reflectivity: 0.3,      
              clearcoat: 1.0,         
              clearcoatRoughness: 0,  
              envMapIntensity: 1.5    
            });
          } 
          else {
            const geom = child.geometry.clone();
            const targetUV = geom.attributes.uv1 || geom.attributes.uv;
            if (targetUV) geom.setAttribute('uv2', targetUV);
            child.geometry = geom;

            const newMat = child.material.clone();
            newMat.lightMap = null;
            newMat.aoMap = currentMap;    
            newMat.aoMapIntensity = 1.2; 
            newMat.envMapIntensity = 1.0;
            newMat.needsUpdate = true;
            child.material = newMat;
          }
        }
      });
    });
  }, [dx, sx, shadowMaps]);

  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// === COMPONENTE TENDE ===
function Tende() {
  const dx = useGLTF('/models/showroom/tenda_dx.glb');
  const sx = useGLTF('/models/showroom/tenda_sx.glb');
  
  const shadowMaps = useTexture({
    dx: '/textures/showroom/finestre/Ombra_Tenda_Dx.png',
    sx: '/textures/showroom/finestre/Ombra_Tenda_Sx.png'
  });

  useLayoutEffect(() => {
    Object.values(shadowMaps).forEach(map => {
      map.colorSpace = THREE.NoColorSpace; 
      map.flipY = false;
      map.channel = 1;
    });

    [dx.scene, sx.scene].forEach((scene, index) => {
      const currentMap = index === 0 ? shadowMaps.dx : shadowMaps.sx;

      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const geom = child.geometry.clone();
          const targetUV = geom.attributes.uv1 || geom.attributes.uv;
          if (targetUV) geom.setAttribute('uv2', targetUV);
          child.geometry = geom;

          const originalMaterials = Array.isArray(child.material) ? child.material : [child.material];
          const newMaterials = originalMaterials.map(mat => {
            const newMat = mat.clone();
            newMat.side = THREE.DoubleSide; 
            newMat.aoMap = currentMap;    
            newMat.aoMapIntensity = 1.1; 
            return newMat;
          });
          child.material = Array.isArray(child.material) ? newMaterials : newMaterials[0];
        }
      });
    });
  }, [dx, sx, shadowMaps]);

  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// === COMPONENTE PIANTE (Niente Bake) ===
function Piante() {
  const dx = useGLTF('/models/showroom/pianta_dx.glb');
  const sx = useGLTF('/models/showroom/pianta_sx.glb');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          
          // Funzione per applicare piccoli aggiustamenti ai materiali
          const applyTweaks = (mat) => {
            mat.side = THREE.DoubleSide;
            const matName = mat.name.toLowerCase();
            
            // Limitiamo la riflessività delle foglie per evitare l'effetto finto
            if (matName.includes('foglia') || matName.includes('leaf') || matName.includes('foglie')) {
              mat.envMapIntensity = 0.3;
            } else {
              mat.envMapIntensity = 0.8; // Per il vaso
            }
          };

          // Gestiamo sia il caso di materiale singolo che di array di materiali
          if (Array.isArray(child.material)) {
            child.material.forEach(applyTweaks);
          } else {
            applyTweaks(child.material);
          }
        }
      });
    });
  }, [dx, sx]);

  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// --- SCENA PRINCIPALE ---
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

        {/* Le ombre a terra rimangono quelle dei planes! */}
        <OmbraStatica modelPath={'/models/showroom/piano_ombra.glb'} urlTexture={'/textures/showroom/piante/ombra_dx.png'} />
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_muro.glb'} urlTexture={'/textures/showroom/piante/ombra_dx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx.png'} />
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_muro_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_porta.glb'} urlTexture={'/textures/showroom/piante/ombra_porta.png'} />
      </group>
    </group>
  );
}

// --- PRELOAD ---
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