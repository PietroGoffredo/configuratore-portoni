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

// === COMPONENTE FINESTRE (VETRO PERFETTO) ===
function Finestre() {
  const dx = useGLTF('/models/showroom/finestra_dx.glb');
  const sx = useGLTF('/models/showroom/finestra_sx.glb');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh) {
          const matName = child.material.name.toLowerCase();
          
          if (matName.includes('glass') || matName.includes('vetro')) {
            // IL SEGRETO DEL VETRO PERFETTO E LEGGERISSIMO
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#000000'), // Base scura per far risaltare i riflessi
              metalness: 0.1,      // Bassissimo, non è metallo
              roughness: 0.0,      // ASSOLUTAMENTE ZERO: Rimuove l'effetto sfocato!
              transparent: true,   
              opacity: 0.35,       // Trasparenza per vedere la tenda dietro
              reflectivity: 1.0,   // Massima riflessione
              clearcoat: 1.0,      // Aggiunge uno strato lucido extra a specchio
              clearcoatRoughness: 0.0, // Il lucido deve essere perfetto
              envMapIntensity: 4.0 // Moltiplica x4 i riflessi dell'HDR ambientale!
            });
          } else {
            // Materiale del Telaio/Infisso
            child.material.roughness = 0.6;
            child.material.metalness = 0.2;
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

function Tende() {
  const dx = useGLTF('/models/showroom/tenda_dx.glb');
  const sx = useGLTF('/models/showroom/tenda_sx.glb');

  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
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

function Piante() {
  const dx = useGLTF('/models/showroom/pianta_dx.glb');
  const sx = useGLTF('/models/showroom/pianta_sx.glb');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
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

function OmbraStatica({ modelPath, urlTexture }) {
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
      {/* 1. AMBIENTE HDR: Fondamentale per i riflessi del vetro.
          L'intensità 0.7 è un buon equilibrio per non sovraesporre. */}
      <Environment 
        files="/textures/showroom/luce_studio.hdr" 
        background={false} 
        environmentIntensity={0.7} 
      />
      
      {/* 2. LUCE EMISFERICA: Simula il cielo. 
          Usiamo un azzurro polvere per il cielo e un grigio/marrone caldo per il terreno. */}
      <hemisphereLight 
        skyColor="#b1d1ff" 
        groundColor="#3d2b1f" 
        intensity={0.5} 
      />
      
      {/* 3. IL SOLE A MEZZOGIORNO: 
          - Colore: Un giallo crema molto tenue (#FFF1D0) per togliere l'effetto "clinico".
          - Intensità: 2.0 (ridotta rispetto a 3.0 per evitare il bianco bruciato).
      */}
      <directionalLight 
        position={[2, 10, 4]} 
        intensity={2.0} 
        color="#fff1d0" 
        castShadow={false} // Confermiamo niente ombre dinamiche per React
      />
      
      {/* 4. LUCE DI CONTRASTO/RIEMPIMENTO:
          Simula la luce diffusa dall'atmosfera dal lato opposto.
      */}
      <directionalLight 
        position={[-5, 2, -2]} 
        intensity={0.4} 
        color="#d0e0ff" 
      />

      <group visible={showExterior}>
        <ShowroomWall color={wallColor} />
        <ShowroomFloor />
        
        <Finestre />
        <Tende />
        <Piante />

        {/* Ombre Statiche (Bakeate) */}
        <OmbraStatica modelPath={'/models/showroom/piano_ombra.glb'} urlTexture={'/textures/showroom/piante/ombra_dx.png'} />
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_muro.glb'} urlTexture={'/textures/showroom/piante/ombra_dx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx.png'} />
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_muro_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/piano_ombra_porta.glb'} urlTexture={'/textures/showroom/piante/ombra_porta.png'} />
        
      </group>
    </group>
  );
}

// --- PRELOAD DELLE RISORSE ---
useGLTF.preload('/models/showroom/muro_esterno.glb');
useGLTF.preload('/models/showroom/pavimento_esterno.glb');
useGLTF.preload('/models/showroom/finestra_dx.glb');
useGLTF.preload('/models/showroom/finestra_sx.glb');

// Preload Tende
useGLTF.preload('/models/showroom/tenda_dx.glb');
useGLTF.preload('/models/showroom/tenda_sx.glb');

// Preload Piante
useGLTF.preload('/models/showroom/pianta_dx.glb');
useGLTF.preload('/models/showroom/pianta_sx.glb');

// Preload Ombre
useGLTF.preload('/models/showroom/piano_ombra.glb');
useGLTF.preload('/models/showroom/piano_ombra_muro.glb');
useGLTF.preload('/models/showroom/piano_ombra_sx.glb');
useGLTF.preload('/models/showroom/piano_ombra_muro_sx.glb');
useGLTF.preload('/models/showroom/piano_ombra_porta.glb');