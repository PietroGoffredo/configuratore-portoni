import React, { useMemo, useLayoutEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function VillaTest(props) {
  // 1. Carica il modello compresso (nota il percorso corretto!)
  const { nodes, materials } = useGLTF('/models/nordic/scenario/Villa_Test-transformed.glb');
  
  // 2. Carica l'immagine dell'ombra baked
  const ombraMuro = useTexture('/textures/muro_shadow.jpg');

  useMemo(() => {
    ombraMuro.colorSpace = THREE.SRGBColorSpace;
    ombraMuro.flipY = false;
  }, [ombraMuro]);

  // 3. Genera il secondo canale UV per il muro (Necessario per leggere la LightMap)
  useLayoutEffect(() => {
    const muroGeom = nodes.Cube.geometry; // nodes.Cube è il tuo muro con l'intonaco
    if (muroGeom) {
      if (muroGeom.attributes.uv1 && !muroGeom.attributes.uv2) {
        muroGeom.setAttribute('uv2', muroGeom.attributes.uv1);
      } else if (!muroGeom.attributes.uv1 && !muroGeom.attributes.uv2) {
        // Salvagente nel caso in Blender non fosse stato esportato il canale UV aggiuntivo
        muroGeom.setAttribute('uv2', muroGeom.attributes.uv);
      }
    }
  }, [nodes]);

  return (
    <group {...props} dispose={null}>
      {/* ALBERI E PRATO */}
      <group name="Alberello" position={[2.172, -0.046, 3.072]} rotation={[0, 1.275, 0]} scale={0.955}>
        <mesh name="tree003" geometry={nodes.tree003.geometry} material={materials['pine procedural.002']} castShadow={false} receiveShadow={false} />
        <mesh name="tree003_1" geometry={nodes.tree003_1.geometry} material={materials['Material.006']} castShadow={false} receiveShadow={false} />
      </group>
      <mesh name="Prato" geometry={nodes.Prato.geometry} material={materials['Grass.001']} position={[0, -0.448, 0]} scale={10.667} castShadow={false} receiveShadow={false} />
      <mesh name="Aiutola" geometry={nodes.Aiutola.geometry} material={materials.mStone} position={[4.188, -0.225, 3.312]} castShadow={false} receiveShadow={false} />
      <mesh name="Terreno" geometry={nodes.Terreno.geometry} material={materials['Dirt Ground']} position={[3.764, -0.046, 2.157]} castShadow={false} receiveShadow={false} />
      
      <group name="Short_Evergreen_Mid-Poly_Tree" position={[-8.684, -0.449, 4.153]} scale={0.396}>
        <mesh name="evergreen_short_3004" geometry={nodes.evergreen_short_3004.geometry} material={materials['Pine_Bark.001']} castShadow={false} receiveShadow={false} />
        <mesh name="evergreen_short_3004_1" geometry={nodes.evergreen_short_3004_1.geometry} material={materials['Evergreen_Leaf_1.001']} castShadow={false} receiveShadow={false} />
      </group>

      {/* NUMERO CIVICO */}
      <mesh name="Curve" geometry={nodes.Curve.geometry} material={materials.PaletteMaterial001} position={[1.298, 1.945, 0.085]} rotation={[Math.PI / 2, 0, 0]} scale={1.438} castShadow={false} receiveShadow={false} />
      
      {/* === IL MURO CON L'OMBRA INIETTATA SULL'INTONACO === */}
      <mesh name="Cube" geometry={nodes.Cube.geometry} position={[-10.209, 0.85, -0.837]} scale={[0.603, 1, 1]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial 
          {...materials.mPlaster} // Mantiene l'intonaco originale di BlenderKit
          lightMap={ombraMuro}    // Applica la tua ombra
          lightMapIntensity={1.0} // Regola qui l'intensità dell'ombra (es. 0.8, 1.2, ecc.)
        />
      </mesh>

      {/* CASSETTA POSTALE E ALTRI DETTAGLI */}
      <group name="Circle024" position={[-0.259, 3, 1.509]}>
        <mesh name="Circle001" geometry={nodes.Circle001.geometry} material={materials['Light_Black Metal']} castShadow={false} receiveShadow={false} />
        <mesh name="Circle001_1" geometry={nodes.Circle001_1.geometry} material={materials.PaletteMaterial002} castShadow={false} receiveShadow={false} />
      </group>
      
      <mesh name="Blind_45cm003" geometry={nodes.Blind_45cm003.geometry} material={materials['Light Grey Matte Plastic']} position={[3.635, 2.299, -0.216]} rotation={[Math.PI, 0, Math.PI]} scale={[0.909, 0.907, 1]} castShadow={false} receiveShadow={false} />
      <mesh name="1floor003" geometry={nodes['1floor003'].geometry} material={materials.mRoof} position={[-0.399, -0.45, -0.288]} castShadow={false} receiveShadow={false} />
      <mesh name="window" geometry={nodes.window.geometry} material={materials.Glass} position={[-0.399, -0.45, -0.288]} castShadow={false} receiveShadow={false} />
      <mesh name="woodPlanks002" geometry={nodes.woodPlanks002.geometry} material={materials.mWood} position={[-0.399, -0.45, -0.288]} castShadow={false} receiveShadow={false} />
      <mesh name="Plane002" geometry={nodes.Plane002.geometry} material={materials.PaletteMaterial003} position={[1.302, 1.269, 0.123]} rotation={[Math.PI / 2, 0, 0]} scale={0.892} castShadow={false} receiveShadow={false} />
    </group>
  );
}

useGLTF.preload('/models/nordic/scenario/Villa_Test-transformed.glb');
useTexture.preload('/textures/muro_shadow.jpg');