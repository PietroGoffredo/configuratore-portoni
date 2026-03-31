/* eslint-disable react/no-unknown-property */
import React, { useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const getFirstGeometry = (nodes) => {
  const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh');
  return meshName ? nodes[meshName].geometry : null;
};

// Mantiene la compatibilità per l'Ambient Occlusion del legno/metallo
const ensureUV2 = (geometry) => {
  if (geometry && geometry.attributes.uv && !geometry.attributes.uv2) {
    geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
  }
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

// --- PARTI FISSE DEL PORTONE ---
const PlainPart = ({ path, color, scenario }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  
  useMemo(() => ensureUV2(geometry), [geometry]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow={scenario === 'modern'} receiveShadow={scenario === 'modern'} frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} shadowSide={THREE.BackSide} />
    </mesh>
  );
};

const MetalPart = ({ path, scenario }) => {
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

  useMemo(() => ensureUV2(geometry), [geometry]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow={scenario === 'modern'} receiveShadow={scenario === 'modern'} frustumCulled={false}>
       <meshStandardMaterial {...propsMetallo} color="#ffffff" metalness={1.0} roughness={0.3} envMapIntensity={1.5} side={THREE.DoubleSide} shadowSide={THREE.BackSide} />
    </mesh>
  );
};

const ConfigurablePart = ({ path, config, scenario }) => {
  const { nodes } = useGLTF(path);
  const geometry = getFirstGeometry(nodes);
  
  useMemo(() => ensureUV2(geometry), [geometry]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow={scenario === 'modern'} receiveShadow={scenario === 'modern'} frustumCulled={false}>
      {config.isSolid ? <MaterialeSolido config={config} /> : <MaterialeTexturizzato config={config} />}
    </mesh>
  );
};


// --- GRUPPI ---

export function GruppoEsterno({ config, viewMode, scenario }) {
  const basePath = '/models/nordic/nordic_01/';
  const isHPL = config.category === 'hpl';
  
  // Modifica: ora il gruppo esterno scompare quando si clicca "Vista Interna", anche nello Studio
  const show = viewMode === 'external';

  return (
    <group visible={show}>
      <MetalPart path={`${basePath}anello_pannello_esterno.glb`} scenario={scenario} />
      <PlainPart path={`${basePath}core_pannello_esterno.glb`} color={isHPL ? '#24272d' : config.hex} scenario={scenario} />
      <ConfigurablePart path={`${basePath}overlay_pannello_esterno.glb`} config={config} scenario={scenario} />
    </group>
  );
}

export function GruppoInterno({ config, viewMode, scenario }) {
  const path = '/models/nordic/pannello_interno_liscio/pannello_interno_liscio.glb';
  
  // Modifica: ora il gruppo interno scompare quando si clicca "Vista Esterna", anche nello Studio
  const show = viewMode === 'internal';

  return (
    <group visible={show}>
      <ConfigurablePart path={path} config={config} scenario={scenario} />
    </group>
  );
}

export function GruppoComune({ scenario }) {
  const pathStruttura = '/models/nordic/struttura/struttura.glb';
  const pathTelaio = '/models/nordic/telaio/telaio.glb';
  const okumeConfig = { folder: 'altro/legno_okume', isTextured: true, id: 'legno_okume_fixed' };

  return (
    <group visible={true}>
      <ConfigurablePart path={pathStruttura} config={okumeConfig} scenario={scenario} />
      <ConfigurablePart path={pathTelaio} config={okumeConfig} scenario={scenario} />
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