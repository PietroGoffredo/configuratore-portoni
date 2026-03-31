import React, { useMemo, useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function VillaCompleta(props) {
  // 1. Carichiamo i modelli
  const principale = useGLTF('/models/nordic/scenario/Zona_Principale.glb');
  const secondaria = useGLTF('/models/nordic/scenario/Zona_Secondaria.glb');
  const terreno = useGLTF('/models/nordic/scenario/Terreno_Bake.glb'); 
  const dettaglio = useGLTF('/models/nordic/scenario/Zona_Dettaglio.glb'); 
  const vegetazione = useGLTF('/models/nordic/scenario/Ambiente_Leggero_Vegetazione.glb'); 
  const ambienteNoOmbre = useGLTF('/models/nordic/scenario/Ambiente_Leggero_NoOmbre.glb');

  // 2. Carichiamo SOLO le 4 texture strutturali (Nessun bake per la vegetazione)
  const ombraPrincipale = useTexture('/textures/bake_principale_4k.jpg');
  const ombraSecondaria = useTexture('/textures/bake_secondario_2k.jpg');
  const ombraTerreno = useTexture('/textures/bake_terreno.jpg'); 
  const ombraDettaglio = useTexture('/textures/bake_dettaglio_2k.jpg'); 

  // 3. Setup delle texture
  useMemo(() => {
    [ombraPrincipale, ombraSecondaria, ombraTerreno, ombraDettaglio].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false;
      tex.channel = 1; 
    });
  }, [ombraPrincipale, ombraSecondaria, ombraTerreno, ombraDettaglio]);

  // 4. LA FUNZIONE MAGICA PER IL BAKE (Solo architettura e terreno)
  const applyBakeShader = (sceneToBake, shadowMapTexture, customIntensity = 0.5) => {
    sceneToBake.traverse((child) => {
      if (child.isMesh) {
        child.receiveShadow = false; 
        child.castShadow = false;

        if (!child.geometry.attributes.uv1 && child.geometry.attributes.uv) {
          child.geometry.setAttribute('uv1', child.geometry.attributes.uv);
        }

        if (child.material) {
          child.material = child.material.clone(); 
          child.material.lightMap = shadowMapTexture;
          child.material.lightMapIntensity = customIntensity; 
          child.material.roughness = 1.0;
          child.material.envMapIntensity = 0.2; 

          child.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <lightmap_fragment>',
              `// Comportamento additivo standard disattivato`
            );
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              `
              #include <dithering_fragment>
              #ifdef USE_LIGHTMAP
                vec4 ombraBaked = texture2D( lightMap, vLightMapUv );
                vec3 moltiplicatoreOmbra = mix(vec3(1.0), ombraBaked.rgb, lightMapIntensity);
                gl_FragColor.rgb *= moltiplicatoreOmbra;
              #endif
              `
            );
          };
          child.material.needsUpdate = true;
        }
      }
    });
  };

  useEffect(() => {
    // --- APPLICHIAMO IL BAKE ALLE ZONE STRUTTURALI ---
    if (principale.scene) applyBakeShader(principale.scene, ombraPrincipale, 0.5);
    if (secondaria.scene) applyBakeShader(secondaria.scene, ombraSecondaria, 0.5);
    if (terreno.scene) applyBakeShader(terreno.scene, ombraTerreno, 0.5);
    if (dettaglio.scene) applyBakeShader(dettaglio.scene, ombraDettaglio, 0.5); 

    // --- LA SOLUZIONE PER LA VEGETAZIONE (OMBRELLE SCURE CUSTOM) ---
    if (vegetazione.scene) {
      vegetazione.scene.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = true; 
          child.castShadow = true;   
          
          if (child.material) {
            // Riconosciamo le foglie
            if (child.material.map && (child.material.transparent || child.material.alphaMap)) {
              child.material.transparent = false; 
              child.material.alphaTest = 0.15;    
              child.material.side = THREE.DoubleSide; 
            }

            child.material.envMapIntensity = 0.0; 
            child.material.roughness = 1.0;

            // IL FILTRO SHADER PER SCURIRE SOLO LE OMBRE DEGLI ALBERELLI
            child.material.onBeforeCompile = (shader) => {
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                #include <dithering_fragment>
                
                // 1. Calcoliamo la luminosità del pixel (0.0 = nero, 1.0 = bianco)
                float luma = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
                
                // --- REGOLA L'INTENSITÀ DELL'OMBRA QUI SOTTO ---
                // Più il valore si avvicina a 0.0, più l'ombra sarà nera profonda.
                // Più si avvicina a 1.0, più l'ombra sarà chiara. Prova 0.2 o 0.1.
                float intensitaOmbra = 0.2; 
                
                // Creiamo la versione scurita del colore originale
                vec3 coloreScuro = gl_FragColor.rgb * intensitaOmbra;
                
                // Se il pixel è in penombra (luma basso), applichiamo il colore scuro.
                // Se è colpito dal sole (luma alto), lo lasciamo brillante e intatto.
                gl_FragColor.rgb = mix(coloreScuro, gl_FragColor.rgb, smoothstep(0.0, 0.5, luma));
                `
              );
            };

            child.material.needsUpdate = true;
          }
        }
      });
    }

    // --- SETUP ELEMENTI ISOLATI EXTRA ---
    if (ambienteNoOmbre.scene) {
      ambienteNoOmbre.scene.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = true; 
          child.castShadow = false; 
          
          if (child.material) {
            child.material.envMapIntensity = 0.0; 
            child.material.roughness = 1.0;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [principale.scene, secondaria.scene, terreno.scene, dettaglio.scene, vegetazione.scene, ambienteNoOmbre.scene, ombraPrincipale, ombraSecondaria, ombraTerreno, ombraDettaglio]);

  return (
    <group {...props} dispose={null}>
      <primitive object={principale.scene} />
      <primitive object={secondaria.scene} />
      <primitive object={terreno.scene} />
      <primitive object={dettaglio.scene} />
      <primitive object={vegetazione.scene} />
      <primitive object={ambienteNoOmbre.scene} />
    </group>
  );
}

// Preload 
useGLTF.preload('/models/nordic/scenario/Zona_Principale.glb');
useGLTF.preload('/models/nordic/scenario/Zona_Secondaria.glb');
useGLTF.preload('/models/nordic/scenario/Terreno_Bake.glb');
useGLTF.preload('/models/nordic/scenario/Zona_Dettaglio.glb');
useGLTF.preload('/models/nordic/scenario/Ambiente_Leggero_Vegetazione.glb');
useGLTF.preload('/models/nordic/scenario/Ambiente_Leggero_NoOmbre.glb');
useTexture.preload('/textures/bake_principale_4k.jpg');
useTexture.preload('/textures/bake_secondario_2k.jpg');
useTexture.preload('/textures/bake_terreno.jpg');
useTexture.preload('/textures/bake_dettaglio_2k.jpg');