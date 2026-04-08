import React, { useLayoutEffect } from 'react';
import { Environment, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- COMPONENTI MODULARI ---

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
        // Il muro NON riceve/proietta ombre dinamiche per non sporcare la scena
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
      // Il pavimento NON riceve ombre dinamiche
    });
  }, [scene]);
  return <primitive object={scene} />;
}

function Finestre() {
  const dx = useGLTF('/models/showroom/finestra_dx.glb');
  const sx = useGLTF('/models/showroom/finestra_sx.glb');
  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// --- COMPONENTE PIANTE (CON OMBRE DINAMICHE VIA CODICE) ---
function Piante() {
  const dx = useGLTF('/models/showroom/pianta_dx.glb');
  const sx = useGLTF('/models/showroom/pianta_sx.glb');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
          
          // LA MAGIA DEL CODICE:
          // Diciamo alla mesh di proiettare (cast) e ricevere (receive) ombre.
          // Così le foglie in alto faranno ombra su quelle in basso e sulla ghiaia!
          child.castShadow = true;
          child.receiveShadow = true;
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

// --- COMPONENTE OMBRA UNIVERSALE (Le tue ombre statiche a terra/muro) ---
function OmbraPianta({ modelPath, urlTexture }) {
  const { scene } = useGLTF(modelPath);
  const ombraTex = useTexture(urlTexture);

  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  useLayoutEffect(() => {
    ombraTex.colorSpace = THREE.SRGBColorSpace; 
    ombraTex.flipY = false;
    ombraTex.center.set(0.5, 0.5);

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          map: ombraTex,
          color: '#ffffff',
          transparent: true,
          blending: THREE.MultiplyBlending, 
          premultipliedAlpha: true,
          depthWrite: false, 
          toneMapped: false 
        });
      }
    });

  }, [clonedScene, ombraTex]);

  return <primitive object={clonedScene} />;
}

// --- SCENA PRINCIPALE ---

export function ShowroomScene({ viewMode, wallColor }) {
  const showExterior = viewMode === 'external';

  return (
    <group>
      <Environment files="/textures/showroom/luce_studio.hdr" background={false} environmentIntensity={0.6} />
      <hemisphereLight skyColor="#ffffff" groundColor="#111111" intensity={0.4} />
      
      {/* LUCE PRINCIPALE AGGIORNATA PER LE OMBRE DINAMICHE */}
      <directionalLight 
        position={[3, 4, 5]} 
        intensity={1.6} 
        color="#fff6e0" 
        castShadow // 1. Attiviamo la proiezione delle ombre sulla luce
        shadow-mapSize={[2048, 2048]} // 2. Alta risoluzione per avere ombre delle foglie ben definite
        shadow-bias={-0.0005} // 3. Corregge l'effetto "strisce nere" (shadow acne) sui modelli 3D curvi
      />
      
      <directionalLight position={[-5, 3, 4]} intensity={0.3} color="#b0c4de" />

      <group visible={showExterior}>
        <ShowroomWall color={wallColor} />
        <ShowroomFloor />
        <Finestre />
        
        {/* Renderizziamo le piante con ombre integrate */}
        <Piante />

        {/* OMBRE ESTERNE PIANTA DESTRA (Manteniamo quelle pre-impostate) */}
        <OmbraPianta 
          modelPath={'/models/showroom/piano_ombra.glb'}
          urlTexture={'/textures/showroom/piante/ombra_dx.png'} 
        />
        <OmbraPianta 
          modelPath={'/models/showroom/piano_ombra_muro.glb'}
          urlTexture={'/textures/showroom/piante/ombra_dx_muro.png'} 
        /> 
        
        {/* OMBRE ESTERNE PIANTA SINISTRA (commentate finché i file non esistono) */}
        
        <OmbraPianta 
          modelPath={'/models/showroom/piano_ombra_sx.glb'}
          urlTexture={'/textures/showroom/piante/ombra_sx.png'} 
        />
        <OmbraPianta 
          modelPath={'/models/showroom/piano_ombra_muro_sx.glb'}
          urlTexture={'/textures/showroom/piante/ombra_sx_muro.png'} 
        /> 
       
      </group>
    </group>
  );
}

// --- PRELOAD DELLE RISORSE ---
useGLTF.preload('/models/showroom/muro_esterno.glb');
useGLTF.preload('/models/showroom/pavimento_esterno.glb');
useGLTF.preload('/models/showroom/finestra_dx.glb');
useGLTF.preload('/models/showroom/finestra_sx.glb');
useGLTF.preload('/models/showroom/pianta_dx.glb');
useGLTF.preload('/models/showroom/pianta_sx.glb');

// Preload Ombre
useGLTF.preload('/models/showroom/piano_ombra.glb');
useGLTF.preload('/models/showroom/piano_ombra_muro.glb');