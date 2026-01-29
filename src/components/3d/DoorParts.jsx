/* eslint-disable react/no-unknown-property */
import React, { useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- GESTIONE MATERIALI ---

const MaterialeSolido = ({ config }) => {
  return (
    <meshStandardMaterial 
      color={config.hex} 
      roughness={config.roughness || 0.4} 
      envMapIntensity={0.8} 
      side={THREE.DoubleSide}
    />
  );
};

const MaterialeTexturizzato = ({ config }) => {
  const basePath = `/textures/${config.folder}/`;
  const mapsConfig = {};

  // Carica la mappa colore solo se necessario
  if (config.isTextured || config.type === 'hpl_tex') {
    mapsConfig.map = basePath + 'color.jpg';
  }
  
  mapsConfig.normalMap = basePath + 'normal.png';
  mapsConfig.roughnessMap = basePath + 'roughness.jpg';
  mapsConfig.aoMap = basePath + 'ao.jpg';

  const textures = useTexture(mapsConfig);

  useMemo(() => {
    // 1. CONFIGURAZIONE MAPPA COLORE (sRGB)
    if (textures.map) {
      textures.map.colorSpace = THREE.SRGBColorSpace;
      textures.map.wrapS = textures.map.wrapT = THREE.RepeatWrapping;
      textures.map.repeat.set(2, 2);
    }

    // 2. CONFIGURAZIONE MAPPE DATI (Linear / NoColorSpace) - CRUCIALE PER IL FIX COLORE
    const dataMaps = [textures.normalMap, textures.roughnessMap, textures.aoMap];
    
    dataMaps.forEach((t) => {
      if (t) {
        t.colorSpace = THREE.NoColorSpace; // Non convertire in sRGB!
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(2, 2);
      }
    });

  }, [textures]);

  const commonProps = {
    normalMap: textures.normalMap,
    roughnessMap: textures.roughnessMap,
    aoMap: textures.aoMap,
    side: THREE.DoubleSide,
  };

  // Ibrido (Nobilitato: Colore Hex + Mappe Fisiche)
  if (config.isHybrid) {
    return (
      <meshStandardMaterial 
        color={config.hex} 
        aoMapIntensity={0.5}
        roughness={1} 
        envMapIntensity={0.5}
        {...commonProps}
      />
    );
  }

  // Texture Pura (HPL Texturizzato)
  return (
    <meshStandardMaterial 
      map={textures.map}
      aoMapIntensity={0.8}
      envMapIntensity={0.8}
      {...commonProps}
    />
  );
};

// Helper Geometria
const getFirstGeometry = (nodes) => {
  const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh');
  return meshName ? nodes[meshName].geometry : null;
};

// --- COMPONENTI PARTE SINGOLA ---

// 1. Parte SENZA Texture (Struttura, Telaio, Core Nero)
const PlainPart = ({ path, color }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
      <meshStandardMaterial 
        color={color} 
        roughness={0.5} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
};

// 2. Parte Metallo (Anello)
const MetalPart = ({ path }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  if (!geometry) return null;

  const propsMetallo = useTexture({
    map: '/textures/altro/metallo_spazzolato/color.jpg',
    normalMap: '/textures/altro/metallo_spazzolato/normal.png',
    roughnessMap: '/textures/altro/metallo_spazzolato/roughness.jpg',
    aoMap: '/textures/altro/metallo_spazzolato/ao.jpg',
  });

  useMemo(() => {
    if (propsMetallo.map) {
      propsMetallo.map.wrapS = propsMetallo.map.wrapT = THREE.RepeatWrapping;
      propsMetallo.map.colorSpace = THREE.SRGBColorSpace;
    }
    // Anche qui, le mappe dati del metallo devono essere lineari
    if(propsMetallo.normalMap) propsMetallo.normalMap.colorSpace = THREE.NoColorSpace;
    if(propsMetallo.roughnessMap) propsMetallo.roughnessMap.colorSpace = THREE.NoColorSpace;
    if(propsMetallo.aoMap) propsMetallo.aoMap.colorSpace = THREE.NoColorSpace;
  }, [propsMetallo]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
       <meshStandardMaterial 
         {...propsMetallo} 
         color="#ffffff" 
         metalness={1.0} 
         roughness={0.3} 
         envMapIntensity={1.5} 
         side={THREE.DoubleSide} 
       />
    </mesh>
  );
};

// 3. Parte Configurabile (Pannelli, Overlay)
const ConfigurablePart = ({ path, config }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
      {config.isSolid ? (
        <MaterialeSolido key={config.id + '_solid'} config={config} />
      ) : (
        <MaterialeTexturizzato key={config.id + '_tex'} config={config} />
      )}
    </mesh>
  );
};


// --- ASSEMBLAGGIO MODELLI ---

export function Nordic01Esterno({ config }) {
  const basePath = '/models/nordic/nordic_01/';
  const isHPL = config.category === 'hpl';
  
  return (
    <group dispose={null}>
      {/* ANELLO */}
      <MetalPart path={`${basePath}anello_pannello_esterno.glb`} />
      
      {/* CORE (Nero se HPL, altrimenti tinta unita) */}
      <PlainPart 
        path={`${basePath}core_pannello_esterno.glb`} 
        color={isHPL ? '#24272d' : config.hex} 
      />
      
      {/* OVERLAY */}
      {/* Manteniamo un offset infinitesimale (0.5mm) per evitare glitch su alcune GPU */}
      <group position={[0, 0, 0]}>
        <ConfigurablePart 
          path={`${basePath}overlay_pannello_esterno.glb`} 
          config={config} 
        />
      </group>
    </group>
  );
}

export function PannelloInterno({ config }) {
  const path = '/models/nordic/pannello_interno_liscio/pannello_interno_liscio.glb';
  return (
    <group dispose={null}>
      <ConfigurablePart path={path} config={config} />
    </group>
  );
}

// STRUTTURA & TELAIO PULITI
// Bianco neutro (#ffffff)
export function StrutturaCompleta() {
  const pathStruttura = '/models/nordic/struttura/struttura.glb';
  const pathTelaio = '/models/nordic/telaio/telaio.glb';
  const colorNeutro = "#ffffff"; 

  return (
    <group dispose={null}>
      <PlainPart path={pathStruttura} color={colorNeutro} />
      <PlainPart path={pathTelaio} color={colorNeutro} />
    </group>
  );
}

// Preload
const files = [
  '/models/nordic/nordic_01/anello_pannello_esterno.glb',
  '/models/nordic/nordic_01/core_pannello_esterno.glb',
  '/models/nordic/nordic_01/overlay_pannello_esterno.glb',
  '/models/nordic/pannello_interno_liscio/pannello_interno_liscio.glb',
  '/models/nordic/struttura/struttura.glb',
  '/models/nordic/telaio/telaio.glb',
  '/textures/altro/metallo_spazzolato/color.jpg'
];

files.forEach(f => useGLTF.preload(f));