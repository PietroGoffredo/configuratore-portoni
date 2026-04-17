import React, { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OmbraStatica } from './Generic';

// --- UTILITY PER APPLICAZIONE AO MAP (Canale 2) ---
const applyAOMap = (scene, texture) => {
  if (texture) {
    texture.colorSpace = THREE.NoColorSpace;
    texture.flipY = false;
    texture.channel = 1;
  }

  scene.traverse((child) => {
    if (child.isMesh) {
      const geom = child.geometry.clone();
      const targetUV = geom.attributes.uv1 || geom.attributes.uv;
      if (targetUV) geom.setAttribute('uv2', targetUV);
      child.geometry = geom;

      if (child.material) {
        const newMat = child.material.clone();
        newMat.aoMap = texture;
        newMat.aoMapIntensity = 1.2;
        child.material = newMat;
      }
    }
  });
};

// --- COMPONENTI ARCHITETTONICI ESTERNI ---
function ShowroomWall({ color }) {
  const { scene } = useGLTF('/models/showroom/esterno/muro_esterno.glb');
  
  // PERCORSO AGGIORNATO TEXTURE MURO ESTERNO
  const textures = useTexture({
    normalMap: '/textures/showroom/muro/esterno/normal.jpg',
    roughnessMap: '/textures/showroom/muro/esterno/roughness.jpg',
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
  const { scene } = useGLTF('/models/showroom/esterno/pavimento_esterno.glb');
  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) child.material.side = THREE.DoubleSide;
    });
  }, [scene]);
  return <primitive object={scene} />;
}

// --- COMPONENTI ARCHITETTONICI INTERNI ---
function InteriorRoom({ wallColor }) {
  const muro = useGLTF('/models/showroom/interno/muro_interno.glb');
  const pavimento = useGLTF('/models/showroom/interno/pavimento_interno.glb');
  const arredamentoSx = useGLTF('/models/showroom/interno/arredamento_sx.glb');
  const mobile = useGLTF('/models/showroom/interno/arredamento_dx.glb');
  const battiscopaDx = useGLTF('/models/showroom/interno/battiscopa_dx.glb');
  const battiscopaSx = useGLTF('/models/showroom/interno/battiscopa_sx.glb');

  // La foto JPG del riflesso finto
  const riflessoTex = useTexture('/textures/showroom/riflesso_specchio.jpg');
  
  // TEXTURE MURO INTERNO AGGIUNTE
  const muroTextures = useTexture({
    normalMap: '/textures/showroom/muro/interno/normal.jpg',
    roughnessMap: '/textures/showroom/muro/interno/roughness.jpg',
  });

  // Texture per la Lightmap/AO della sedia e del quadro (Arredamento SX)
  const ombraSediaTex = useTexture('/textures/showroom/interno/ombra_sedia.jpg'); 
  const ombraQuadroTex = useTexture('/textures/showroom/interno/ombra_quadro.jpg');
  
  // Texture per la Lightmap/AO di Arredamento DX (mobile)
  const ombraLibriTex = useTexture('/textures/showroom/interno/ombra_libri.jpg');
  const ombraSpecchioTex = useTexture('/textures/showroom/interno/ombra_specchio.jpg');
  const ombraTerraTex = useTexture('/textures/showroom/interno/ombra_terra.jpg');
  const ombraVasoTex = useTexture('/textures/showroom/interno/ombra_vaso.jpg');
  const ombraTavoloTex = useTexture('/textures/showroom/interno/ombra_tavolo.jpg');
  
  // Texture per la Lightmap/AO dei Battiscopa
  const ombraBattiscopaDxTex = useTexture('/textures/showroom/interno/ombra_battiscopa_dx.jpg');
  const ombraBattiscopaSxTex = useTexture('/textures/showroom/interno/ombra_battiscopa_sx.jpg');

  // Riferimento al materiale dello specchio per l'animazione
  const specchioMatRef = useRef(null);

  useLayoutEffect(() => {
    // 0. Setup delle mappe ombre e muro
    [
      ombraSediaTex, ombraQuadroTex, ombraLibriTex, ombraSpecchioTex, 
      ombraTerraTex, ombraVasoTex, ombraTavoloTex, 
      ombraBattiscopaDxTex, ombraBattiscopaSxTex
    ].forEach(tex => {
      if (tex) {
        tex.colorSpace = THREE.SRGBColorSpace; 
        tex.flipY = false;
        tex.channel = 1; 
      }
    });

    Object.values(muroTextures).forEach((tex) => {
      if (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1.2, 1.2);
      }
    });

    // 0.5 APPLICAZIONE MATERIALE MURO INTERNO DINAMICO
    muro.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(wallColor),
          normalMap: muroTextures.normalMap,
          roughnessMap: muroTextures.roughnessMap,
          roughness: 0.85,
          side: THREE.DoubleSide,
          envMapIntensity: 0.6 // Permette alla luce di riflettere correttamente sul muro
        });
      }
    });

    // 1. APPLICAZIONE BAKE AD ARREDAMENTO_SX (Sedia + Quadro)
    arredamentoSx.scene.traverse((child) => {
      let appartieneASedia = child.name.toLowerCase().includes('sedia');
      let appartieneAQuadro = child.name.toLowerCase().includes('quadro');

      if (!appartieneASedia && !appartieneAQuadro && child.parent) {
         child.traverseAncestors((ancestor) => {
           if (ancestor.name.toLowerCase().includes('sedia')) appartieneASedia = true;
           if (ancestor.name.toLowerCase().includes('quadro')) appartieneAQuadro = true;
         });
      }

      if (child.isMesh && (appartieneASedia || appartieneAQuadro)) {
        const geom = child.geometry.clone();
        const activeTexture = appartieneASedia ? ombraSediaTex : ombraQuadroTex;
        
        if (!geom.attributes.uv1 && geom.attributes.uv) {
          geom.setAttribute('uv1', new THREE.BufferAttribute(geom.attributes.uv.array, 2));
        }
        child.geometry = geom;

        const applyShadowBake = (mat) => {
          const newMat = mat.clone();
          newMat.lightMap = activeTexture;
          newMat.lightMapIntensity = 1.0; 
          newMat.aoMap = activeTexture;
          newMat.aoMapIntensity = 1.0; 
          newMat.envMapIntensity = 0.5; 
          newMat.needsUpdate = true;
          return newMat;
        };

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(applyShadowBake);
          } else {
            child.material = applyShadowBake(child.material);
          }
        }
      }
    });

    // 2. APPLICAZIONE BAKE AD ARREDAMENTO_DX (Libri, Specchio, Terra, Vaso, Tavolo)
    mobile.scene.traverse((child) => {
      const name = child.name.toLowerCase();
      let targetName = null;

      // Escludiamo categoricamente il vetro
      if (name.includes('vetro')) return;

      if (name.includes('libri')) targetName = 'libri';
      else if (name.includes('specchio')) targetName = 'specchio';
      else if (name.includes('terra')) targetName = 'terra';
      else if (name.includes('vaso')) targetName = 'vaso';
      else if (name.includes('tavolo')) targetName = 'tavolo';

      if (!targetName && child.parent) {
         child.traverseAncestors((ancestor) => {
           const aName = ancestor.name.toLowerCase();
           if (aName.includes('libri')) targetName = 'libri';
           else if (aName.includes('specchio')) targetName = 'specchio';
           else if (aName.includes('terra')) targetName = 'terra';
           else if (aName.includes('vaso')) targetName = 'vaso';
           else if (aName.includes('tavolo')) targetName = 'tavolo';
         });
      }

      if (child.isMesh && targetName) {
        const activeTexture = 
          targetName === 'libri' ? ombraLibriTex :
          targetName === 'specchio' ? ombraSpecchioTex :
          targetName === 'terra' ? ombraTerraTex :
          targetName === 'vaso' ? ombraVasoTex :
          ombraTavoloTex;

        const geom = child.geometry.clone();
        if (!geom.attributes.uv1 && geom.attributes.uv) {
          geom.setAttribute('uv1', new THREE.BufferAttribute(geom.attributes.uv.array, 2));
        }
        child.geometry = geom;

        const applyShadowBake = (mat) => {
          if (mat.name.toLowerCase().includes('vetro')) return mat;

          const newMat = mat.clone();
          newMat.lightMap = activeTexture;
          newMat.lightMapIntensity = 1.0; 
          newMat.aoMap = activeTexture;
          
          if (targetName === 'tavolo') {
            newMat.aoMapIntensity = 1;  
            newMat.envMapIntensity = 0.5; 
          } else {
            newMat.aoMapIntensity = 1.0; 
            newMat.envMapIntensity = 0.5; 
          }
          
          newMat.needsUpdate = true;
          return newMat;
        };

        if (child.material) {
          child.material = Array.isArray(child.material) 
            ? child.material.map(applyShadowBake) 
            : applyShadowBake(child.material);
        }
      }
    });

    // 3. APPLICAZIONE BAKE AI BATTISCOPA
    const applyBattiscopaShadow = (scene, texture) => {
      scene.traverse((child) => {
        if (child.isMesh) {
          const geom = child.geometry.clone();
          if (!geom.attributes.uv1 && geom.attributes.uv) {
            geom.setAttribute('uv1', new THREE.BufferAttribute(geom.attributes.uv.array, 2));
          }
          child.geometry = geom;

          const applyShadowBake = (mat) => {
            const newMat = mat.clone();
            newMat.lightMap = texture;
            newMat.lightMapIntensity = 0.85; 
            newMat.aoMap = texture;
            newMat.aoMapIntensity = 0.8;   
            newMat.envMapIntensity = 0.65; 
            newMat.needsUpdate = true;
            return newMat;
          };

          if (child.material) {
            child.material = Array.isArray(child.material) 
              ? child.material.map(applyShadowBake) 
              : applyShadowBake(child.material);
          }
        }
      });
    };

    applyBattiscopaShadow(battiscopaDx.scene, ombraBattiscopaDxTex);
    applyBattiscopaShadow(battiscopaSx.scene, ombraBattiscopaSxTex);

    // 4. SETUP SPECCHIO
    riflessoTex.wrapS = THREE.MirroredRepeatWrapping;
    riflessoTex.wrapT = THREE.MirroredRepeatWrapping;
    riflessoTex.colorSpace = THREE.SRGBColorSpace;
    riflessoTex.repeat.set(0.8, 0.8); 
    riflessoTex.offset.set(0.4, 0.4); 

    const mirrorMaterial = new THREE.MeshPhysicalMaterial({
      map: riflessoTex,                  
      color: new THREE.Color('#c0c0c0'), 
      metalness: 0.1,                    
      roughness: 0.1,                    
      clearcoat: 1.0,                    
      clearcoatRoughness: 0.0,           
      envMapIntensity: 1.5               
    });
    
    specchioMatRef.current = mirrorMaterial;

    // 5. CICLO GLOBALE MATERIALI (ESCLUSO IL MURO PER PROTEGGERE IL SUO COLORE DINAMICO)
    [pavimento.scene, arredamentoSx.scene, mobile.scene, battiscopaDx.scene, battiscopaSx.scene].forEach(scene => {
      scene.traverse(child => {
        if (child.isMesh) {
          
          const processGenericMaterial = (mat) => {
            const matName = mat.name.toLowerCase();
            const childName = child.name.toLowerCase();
            
            if (matName.includes('specchio_vetro') || matName.includes('vetro') || childName.includes('vetro')) {
              return mirrorMaterial; 
            }

            const bakeNames = ['sedia', 'quadro', 'libri', 'specchio', 'terra', 'vaso', 'tavolo', 'battiscopa'];
            let isProtected = bakeNames.some(n => childName.includes(n));
            
            if (!isProtected && child.parent) {
              child.traverseAncestors((ancestor) => {
                if (bakeNames.some(n => ancestor.name.toLowerCase().includes(n))) {
                  isProtected = true;
                }
              });
            }

            if (!isProtected) {
              mat.side = THREE.DoubleSide;
              mat.envMapIntensity = 0.6;
            }
            
            return mat;
          };

          if (Array.isArray(child.material)) {
            child.material = child.material.map(processGenericMaterial);
          } else {
            child.material = processGenericMaterial(child.material);
          }
        }
      });
    });
  }, [muro.scene, pavimento.scene, arredamentoSx.scene, mobile.scene, battiscopaDx.scene, battiscopaSx.scene, riflessoTex, ombraSediaTex, ombraQuadroTex, ombraLibriTex, ombraSpecchioTex, ombraTerraTex, ombraVasoTex, ombraTavoloTex, ombraBattiscopaDxTex, ombraBattiscopaSxTex, muroTextures, wallColor]);

  useFrame(({ camera }) => {
    if (specchioMatRef.current && specchioMatRef.current.map) {
      const moveX = camera.position.x * -0.04; 
      const moveY = camera.position.y * -0.04;
      
      specchioMatRef.current.map.offset.x = 0.3 + moveX;
      specchioMatRef.current.map.offset.y = 0.3 + moveY;
    }
  });

  return (
    <group>
      <primitive object={muro.scene} />
      <primitive object={pavimento.scene} />
      <primitive object={arredamentoSx.scene} />
      <primitive object={mobile.scene} />
      <primitive object={battiscopaDx.scene} />
      <primitive object={battiscopaSx.scene} />
    </group>
  );
}

// === COMPONENTE FINESTRE ===
function Finestre({ isExternal }) {
  const path = isExternal ? 'esterno' : 'interno';
  const suffix = isExternal ? '' : '_interna';
  
  const dx = useGLTF(`/models/showroom/${path}/finestra_dx${suffix}.glb`);
  const sx = useGLTF(`/models/showroom/${path}/finestra_sx${suffix}.glb`);
  
  const shadowMaps = useTexture({
    dx: `/textures/showroom/finestre/AO_Finestra_Dx.png`,
    sx: `/textures/showroom/finestre/AO_Finestra_Sx.png`
  });

  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene, index) => {
      const currentMap = index === 0 ? shadowMaps.dx : shadowMaps.sx;
      
      if (isExternal) {
        applyAOMap(scene, currentMap);
      }
      
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
              envMapIntensity: 1.5    
            });
          }
        }
      });
    });
  }, [dx, sx, shadowMaps, isExternal]);

  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// === COMPONENTE TENDE ===
function Tende({ isExternal }) {
  const path = isExternal ? 'esterno' : 'interno';
  const suffix = isExternal ? '' : '_interna';

  const dx = useGLTF(`/models/showroom/${path}/tenda_dx${suffix}.glb`);
  const sx = useGLTF(`/models/showroom/${path}/tenda_sx${suffix}.glb`);
  
  const shadowMaps = useTexture({
    dx: `/textures/showroom/finestre/Ombra_Tenda_Dx.png`,
    sx: `/textures/showroom/finestre/Ombra_Tenda_Sx.png`
  });

  useLayoutEffect(() => {
    if (isExternal) {
      applyAOMap(dx.scene, shadowMaps.dx);
      applyAOMap(sx.scene, shadowMaps.sx);
    }
  }, [dx, sx, shadowMaps, isExternal]);

  return (
    <group>
      <primitive object={dx.scene} />
      <primitive object={sx.scene} />
    </group>
  );
}

// === COMPONENTE PIANTE ===
function Piante() {
  const dx = useGLTF('/models/showroom/esterno/pianta_dx.glb');
  const sx = useGLTF('/models/showroom/esterno/pianta_sx.glb');
  
  useLayoutEffect(() => {
    [dx.scene, sx.scene].forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const applyTweaks = (mat) => {
            mat.side = THREE.DoubleSide;
            const matName = mat.name.toLowerCase();
            if (matName.includes('foglia') || matName.includes('leaf')) {
              mat.envMapIntensity = 0.3;
            } else {
              mat.envMapIntensity = 0.8;
            }
          };
          if (Array.isArray(child.material)) child.material.forEach(applyTweaks);
          else applyTweaks(child.material);
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

// --- SCENA PRINCIPALE AGGIORNATA CON I DUE COLORI ---
export function ShowroomScene({ viewMode, extWallColor, intWallColor }) {
  const showExterior = viewMode === 'external';

  return (
    <group>
      {/* VISTA ESTERNA */}
      <group visible={showExterior}>
        <ShowroomWall color={extWallColor} />
        <ShowroomFloor />
        <Finestre isExternal={true} />
        <Tende isExternal={true} />
        <Piante />
        <OmbraStatica modelPath={'/models/showroom/esterno/piano_ombra.glb'} urlTexture={'/textures/showroom/piante/ombra_dx.png'} />
        <OmbraStatica modelPath={'/models/showroom/esterno/piano_ombra_muro.glb'} urlTexture={'/textures/showroom/piante/ombra_dx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/esterno/piano_ombra_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx.png'} />
        <OmbraStatica modelPath={'/models/showroom/esterno/piano_ombra_muro_sx.glb'} urlTexture={'/textures/showroom/piante/ombra_sx_muro.png'} /> 
        <OmbraStatica modelPath={'/models/showroom/esterno/piano_ombra_porta.glb'} urlTexture={'/textures/showroom/piante/ombra_porta.png'} />
      </group>

      {/* VISTA INTERNA */}
      <group visible={!showExterior}>
        <InteriorRoom wallColor={intWallColor} />
        <Finestre isExternal={false} />
        <Tende isExternal={false} />
        
        {/* Ombra Pavimento Sedia */}
        <OmbraStatica 
          modelPath={'/models/showroom/interno/piano_ombra_sedia.glb'} 
          urlTexture={'/textures/showroom/interno/ombra_sedia_pavimento.png'}
          opacity={0.35} 
        />

        {/* Ombra Muro Sinistra */}
        <OmbraStatica 
          modelPath={'/models/showroom/interno/piano_ombra_muro_sx.glb'} 
          urlTexture={'/textures/showroom/interno/ombra_muro_sx.png'}
          opacity={1} 
        />

        {/* Ombra Muro Destra */}
        <OmbraStatica 
          modelPath={'/models/showroom/interno/piano_ombra_muro_dx.glb'} 
          urlTexture={'/textures/showroom/interno/ombra_muro_dx.png'}
          opacity={0.75} 
        />
        
        {/* Ombra Pavimento Tavolo */}
        <OmbraStatica 
          modelPath={'/models/showroom/interno/piano_ombra_tavolo.glb'} 
          urlTexture={'/textures/showroom/interno/ombra_tavolo_pavimento.png'} 
        />
      </group>
    </group>
  );
}

// --- PRELOAD ---
useGLTF.preload('/models/showroom/esterno/muro_esterno.glb');
useGLTF.preload('/models/showroom/esterno/pavimento_esterno.glb');
useGLTF.preload('/models/showroom/esterno/finestra_dx.glb');
useGLTF.preload('/models/showroom/esterno/finestra_sx.glb');
useGLTF.preload('/models/showroom/esterno/tenda_dx.glb');
useGLTF.preload('/models/showroom/esterno/tenda_sx.glb');
useGLTF.preload('/models/showroom/esterno/pianta_dx.glb');
useGLTF.preload('/models/showroom/esterno/pianta_sx.glb');
useGLTF.preload('/models/showroom/esterno/piano_ombra.glb');
useGLTF.preload('/models/showroom/esterno/piano_ombra_muro.glb');
useGLTF.preload('/models/showroom/esterno/piano_ombra_sx.glb');
useGLTF.preload('/models/showroom/esterno/piano_ombra_muro_sx.glb');
useGLTF.preload('/models/showroom/esterno/piano_ombra_porta.glb');

useGLTF.preload('/models/showroom/interno/muro_interno.glb');
useGLTF.preload('/models/showroom/interno/pavimento_interno.glb');
useGLTF.preload('/models/showroom/interno/arredamento_sx.glb');
useGLTF.preload('/models/showroom/interno/arredamento_dx.glb');
useGLTF.preload('/models/showroom/interno/battiscopa_dx.glb');
useGLTF.preload('/models/showroom/interno/battiscopa_sx.glb');
useGLTF.preload('/models/showroom/interno/finestra_dx_interna.glb');
useGLTF.preload('/models/showroom/interno/finestra_sx_interna.glb');
useGLTF.preload('/models/showroom/interno/tenda_dx_interna.glb');
useGLTF.preload('/models/showroom/interno/tenda_sx_interna.glb');

useGLTF.preload('/models/showroom/interno/piano_ombra_sedia.glb');
useGLTF.preload('/models/showroom/interno/piano_ombra_muro_sx.glb');
useGLTF.preload('/models/showroom/interno/piano_ombra_muro_dx.glb');
useGLTF.preload('/models/showroom/interno/piano_ombra_tavolo.glb');