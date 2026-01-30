/* eslint-disable react/no-unknown-property */
import React, { useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const getFirstGeometry = (nodes) => {
  const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh');
  return meshName ? nodes[meshName].geometry : null;
};

// --- MATERIALI ---

const MaterialeSolido = ({ config }) => {
  return (
    <meshStandardMaterial 
      color={config.hex} 
      roughness={config.roughness || 0.4} 
      envMapIntensity={0.8} 
      side={THREE.DoubleSide} 
      shadowSide={THREE.BackSide} 
    />
  );
};

const MaterialeTexturizzato = ({ config }) => {
  const basePath = `/textures/${config.folder}/`;
  const mapsConfig = {};

  // 1. Mappa Colore
  if (config.isTextured || config.type === 'hpl_tex') {
    mapsConfig.map = basePath + 'color.jpg';
  }
  
  // 2. Mappe Dati Standard
  mapsConfig.normalMap = basePath + 'normal.png';
  mapsConfig.roughnessMap = basePath + 'roughness.jpg';
  
  // 3. AO Map (Esclusione specifica per HPL 5004 che non ce l'ha)
  if (config.id !== 'hpl_5004') {
    mapsConfig.aoMap = basePath + 'ao.jpg';
  }

  const textures = useTexture(mapsConfig);

  useMemo(() => {
    // Configurazione ripetizione texture
    Object.values(textures).forEach((t) => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(2, 2); 
        t.colorSpace = THREE.SRGBColorSpace;
      }
    });
    
    // Correzione Color Space: Dati lineari per mappe fisiche (Normal, Roughness, AO)
    const dataMaps = [textures.normalMap, textures.roughnessMap, textures.aoMap];
    dataMaps.forEach(t => { 
        if(t) t.colorSpace = THREE.NoColorSpace; 
    });
    
    // La mappa colore DEVE essere sRGB
    if(textures.map) textures.map.colorSpace = THREE.SRGBColorSpace;

  }, [textures]);

  const commonProps = {
    normalMap: textures.normalMap,
    roughnessMap: textures.roughnessMap,
    aoMap: textures.aoMap,
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide, 
  };

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

  return (
    <meshStandardMaterial 
      map={textures.map}
      aoMapIntensity={0.8} // Intensità AO standard
      envMapIntensity={0.8}
      {...commonProps}
    />
  );
};

// --- COMPONENTI PARTE SINGOLA ---

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
        shadowSide={THREE.BackSide} 
      />
    </mesh>
  );
};

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
    if(propsMetallo.map) {
        propsMetallo.map.wrapS = propsMetallo.map.wrapT = THREE.RepeatWrapping;
        propsMetallo.map.colorSpace = THREE.SRGBColorSpace;
    }
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
         shadowSide={THREE.BackSide}
       />
    </mesh>
  );
};

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


// --- ASSEMBLAGGIO ---

export function Nordic01Esterno({ config }) {
  const basePath = '/models/nordic/nordic_01/';
  const isHPL = config.category === 'hpl';
  
  return (
    <group dispose={null}>
      <MetalPart path={`${basePath}anello_pannello_esterno.glb`} />
      <PlainPart path={`${basePath}core_pannello_esterno.glb`} color={isHPL ? '#24272d' : config.hex} />
      <ConfigurablePart path={`${basePath}overlay_pannello_esterno.glb`} config={config} />
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

// STRUTTURA & TELAIO (Texture Legno Okume Applicata)
export function StrutturaCompleta() {
  const pathStruttura = '/models/nordic/struttura/struttura.glb';
  const pathTelaio = '/models/nordic/telaio/telaio.glb';
  
  // Configurazione fissa per Legno Okume
  const okumeConfig = {
    folder: 'altro/legno_okume', // public/textures/altro/legno_okume
    isTextured: true,
    id: 'legno_okume_fixed' // ID fittizio per evitare conflitti
  };

  return (
    <group dispose={null}>
      {/* Usiamo ConfigurablePart per applicare la texture */}
      <ConfigurablePart path={pathStruttura} config={okumeConfig} />
      <ConfigurablePart path={pathTelaio} config={okumeConfig} />
    </group>
  );
}

const files = [
  '/models/nordic/nordic_01/anello_pannello_esterno.glb',
  '/models/nordic/nordic_01/core_pannello_esterno.glb',
  '/models/nordic/nordic_01/overlay_pannello_esterno.glb',
  '/models/nordic/pannello_interno_liscio/pannello_interno_liscio.glb',
  '/models/nordic/struttura/struttura.glb',
  '/models/nordic/telaio/telaio.glb',
  '/textures/altro/metallo_spazzolato/color.jpg',
  '/textures/altro/legno_okume/color.jpg'
];

files.forEach(f => useGLTF.preload(f));