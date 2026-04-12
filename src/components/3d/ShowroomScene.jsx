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
  
  const shadowMap = useTexture('/textures/showroom/finestre/AO_Finestra_Dx.png');

  useLayoutEffect(() => {
    shadowMap.colorSpace = THREE.NoColorSpace; 
    shadowMap.flipY = false;
    shadowMap.channel = 1; 

    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh) {
          const geom = child.geometry.clone();
          const targetUV = geom.attributes.uv1 || geom.attributes.uv;
          if (targetUV) {
            geom.setAttribute('uv2', targetUV);
          }
          child.geometry = geom;

          const originalMaterials = Array.isArray(child.material) ? child.material : [child.material];
          
          const newMaterials = originalMaterials.map(mat => {
            const matName = mat.name.toLowerCase();
            
            if (matName.includes('glass') || matName.includes('vetro')) {
              return new THREE.MeshPhysicalMaterial({
                color: new THREE.Color('#000000'), 
                metalness: 0, 
                roughness: 0, 
                transparent: true, 
                opacity: 0.35,          
                reflectivity: 0.5,
                clearcoat: 1,           
                clearcoatRoughness: 0,  
                envMapIntensity: 1.5
              });
            } else {
              const newMat = mat.clone(); 
              newMat.aoMap = shadowMap;    
              newMat.aoMapIntensity = 1.5; 
              newMat.envMapIntensity = 1.0;   
              newMat.needsUpdate = true;
              return newMat;
            }
          });

          child.material = Array.isArray(child.material) ? newMaterials : newMaterials[0];
        }
      });
    });
  }, [dx, sx, shadowMap]);

  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// === COMPONENTE TENDE (Uniformato alla logica Finestre) ===
function Tende() {
  const dx = useGLTF('/models/showroom/tenda_dx.glb');
  const sx = useGLTF('/models/showroom/tenda_sx.glb');

  const shadowMapTendaDx = useTexture('/textures/showroom/finestre/Ombra_Tenda_Dx.png');

  useLayoutEffect(() => {
    // 1. Spazio colore lineare per evitare l'annerimento totale
    shadowMapTendaDx.colorSpace = THREE.NoColorSpace; 
    shadowMapTendaDx.flipY = false;
    shadowMapTendaDx.channel = 1;

    // --- LOGICA TENDA DESTRA (Con Ombra Bake) ---
    dx.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // 2. Clonazione Geometria e iniezione uv2
        const geom = child.geometry.clone();
        const targetUV = geom.attributes.uv1 || geom.attributes.uv;
        if (targetUV) geom.setAttribute('uv2', targetUV);
        child.geometry = geom;

        // 3. Clonazione Materiali e applicazione aoMap (uguale a finestre)
        const originalMaterials = Array.isArray(child.material) ? child.material : [child.material];
        const newMaterials = originalMaterials.map(mat => {
          const newMat = mat.clone(); 
          newMat.side = THREE.DoubleSide; 
          newMat.aoMap = shadowMapTendaDx;    
          newMat.aoMapIntensity = 2.0; // Uniformato a finestra
          newMat.envMapIntensity = 1.0; // Mantiene la luminosità originale del tessuto
          newMat.needsUpdate = true;
          return newMat;
        });
        child.material = Array.isArray(child.material) ? newMaterials : newMaterials[0];
      }
    });

    // --- LOGICA TENDA SINISTRA (Standard) ---
    sx.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.side = THREE.DoubleSide;
      }
    });

  }, [dx, sx, shadowMapTendaDx]);

  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// --- COMPONENTE PIANTE ---
function Piante() {
  const dx = useGLTF('/models/showroom/pianta_dx.glb');
  const sx = useGLTF('/models/showroom/pianta_sx.glb');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
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