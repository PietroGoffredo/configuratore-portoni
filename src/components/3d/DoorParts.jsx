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

  if (config.isTextured || config.type === 'hpl_tex') mapsConfig.map = basePath + 'color.jpg';
  mapsConfig.normalMap = basePath + 'normal.png';
  mapsConfig.roughnessMap = basePath + 'roughness.jpg';
  if (config.id !== 'hpl_5004') mapsConfig.aoMap = basePath + 'ao.jpg';

  const textures = useTexture(mapsConfig);

  useMemo(() => {
    Object.values(textures).forEach((t) => {
      if (t) { 
        t.wrapS = t.wrapT = THREE.RepeatWrapping; 
        t.repeat.set(2, 2); 
        t.colorSpace = THREE.SRGBColorSpace; 
      }
    });
    const dataMaps = [textures.normalMap, textures.roughnessMap, textures.aoMap];
    dataMaps.forEach(t => { if(t) t.colorSpace = THREE.NoColorSpace; });
    if(textures.map) textures.map.colorSpace = THREE.SRGBColorSpace;
  }, [textures]);

  const commonProps = { 
    normalMap: textures.normalMap, 
    roughnessMap: textures.roughnessMap, 
    aoMap: textures.aoMap, 
    side: THREE.DoubleSide, 
    shadowSide: THREE.BackSide 
  };

  if (config.isHybrid) {
    return <meshStandardMaterial color={config.hex} aoMapIntensity={0.5} roughness={1} envMapIntensity={0.5} {...commonProps} />;
  }
  return <meshStandardMaterial map={textures.map} aoMapIntensity={0.8} envMapIntensity={0.8} {...commonProps} />;
};

// --- PARTI FISSE ---
const PlainPart = ({ path, color }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} shadowSide={THREE.BackSide} />
    </mesh>
  );
};

const MetalPart = ({ path }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  const propsMetallo = useTexture({
    map: '/textures/altro/metallo_spazzolato/color.jpg',
    normalMap: '/textures/altro/metallo_spazzolato/normal.png',
    roughnessMap: '/textures/altro/metallo_spazzolato/roughness.jpg',
    aoMap: '/textures/altro/metallo_spazzolato/ao.jpg',
  });
  useMemo(() => {
    Object.values(propsMetallo).forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
    propsMetallo.map.colorSpace = THREE.SRGBColorSpace;
    propsMetallo.normalMap.colorSpace = THREE.NoColorSpace;
    propsMetallo.roughnessMap.colorSpace = THREE.NoColorSpace;
    propsMetallo.aoMap.colorSpace = THREE.NoColorSpace;
  }, [propsMetallo]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
       <meshStandardMaterial {...propsMetallo} color="#ffffff" metalness={1.0} roughness={0.3} envMapIntensity={1.5} side={THREE.DoubleSide} shadowSide={THREE.BackSide} />
    </mesh>
  );
};

const ConfigurablePart = ({ path, config }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
      {config.isSolid ? <MaterialeSolido config={config} /> : <MaterialeTexturizzato config={config} />}
    </mesh>
  );
};

// --- ENVIRONMENT PART ---
const EnvironmentPart = ({ modelPath, textureFolder, repeat = 4 }) => {
  const { nodes } = useGLTF(modelPath);
  const geometry = getFirstGeometry(nodes);
  const textures = useTexture({
    map: `${textureFolder}/color.jpg`,
    normalMap: `${textureFolder}/normal.png`,
    roughnessMap: `${textureFolder}/roughness.jpg`,
    aoMap: `${textureFolder}/ao.jpg`,
  });
  useMemo(() => {
    Object.values(textures).forEach(t => { if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); } });
    textures.map.colorSpace = THREE.SRGBColorSpace;
    textures.normalMap.colorSpace = THREE.NoColorSpace;
    textures.roughnessMap.colorSpace = THREE.NoColorSpace;
    textures.aoMap.colorSpace = THREE.NoColorSpace;
  }, [textures, repeat]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} receiveShadow castShadow frustumCulled={false}>
      <meshStandardMaterial {...textures} side={THREE.DoubleSide} shadowSide={THREE.BackSide} envMapIntensity={0.5} />
    </mesh>
  );
};

// --- GRUPPI ---

export function GruppoEsterno({ config, viewMode, scenario }) {
  const basePath = '/models/nordic/nordic_01/';
  const basePathMuro = '/models/nordic/muro/';
  const texPavimentoExt = '/textures/ambiente/pavimento_ext'; 
  const isHPL = config.category === 'hpl';
  
  // MODIFICA 3: In Studio, mostra sempre il lato
  const show = viewMode === 'external' || scenario === 'studio';
  const showEnv = scenario !== 'studio';

  return (
    <group visible={show}>
      <group visible={showEnv}>
        <EnvironmentPart modelPath={`${basePathMuro}pavimento_esterno.glb`} textureFolder={texPavimentoExt} repeat={6} />
      </group>
      
      <MetalPart path={`${basePath}anello_pannello_esterno.glb`} />
      <PlainPart path={`${basePath}core_pannello_esterno.glb`} color={isHPL ? '#24272d' : config.hex} />
      <ConfigurablePart path={`${basePath}overlay_pannello_esterno.glb`} config={config} />
    </group>
  );
}

export function GruppoInterno({ config, viewMode, scenario }) {
  const path = '/models/nordic/pannello_interno_liscio/pannello_interno_liscio.glb';
  const basePathMuro = '/models/nordic/muro/';
  const texPavimentoInt = '/textures/ambiente/pavimento_int';
  
  // MODIFICA 3: In Studio, mostra sempre il lato
  const show = viewMode === 'internal' || scenario === 'studio';
  const showEnv = scenario !== 'studio';

  return (
    <group visible={show}>
      <group visible={showEnv}>
        <EnvironmentPart modelPath={`${basePathMuro}pavimento_interno.glb`} textureFolder={texPavimentoInt} repeat={6} />
      </group>
      <ConfigurablePart path={path} config={config} />
    </group>
  );
}

export function GruppoComune({ scenario }) {
  const pathStruttura = '/models/nordic/struttura/struttura.glb';
  const pathTelaio = '/models/nordic/telaio/telaio.glb';
  const pathMuro = '/models/nordic/muro/muro.glb';
  const texMuro = '/textures/ambiente/muro';
  const okumeConfig = { folder: 'altro/legno_okume', isTextured: true, id: 'legno_okume_fixed' };

  const showEnv = scenario !== 'studio';

  return (
    <group visible={true}>
      <group visible={showEnv}>
        <EnvironmentPart modelPath={pathMuro} textureFolder={texMuro} repeat={4} />
      </group>
      <ConfigurablePart path={pathStruttura} config={okumeConfig} />
      <ConfigurablePart path={pathTelaio} config={okumeConfig} />
    </group>
  );
}

// Preload dei file
const files = [
  '/models/nordic/nordic_01/anello_pannello_esterno.glb',
  '/models/nordic/nordic_01/core_pannello_esterno.glb',
  '/models/nordic/nordic_01/overlay_pannello_esterno.glb',
  '/models/nordic/pannello_interno_liscio/pannello_interno_liscio.glb',
  '/models/nordic/struttura/struttura.glb',
  '/models/nordic/telaio/telaio.glb',
  '/models/nordic/muro/muro.glb',
  '/models/nordic/muro/pavimento_interno.glb',
  '/models/nordic/muro/pavimento_esterno.glb',
  '/textures/altro/metallo_spazzolato/color.jpg',
  '/textures/altro/legno_okume/color.jpg'
];

files.forEach(f => useGLTF.preload(f));