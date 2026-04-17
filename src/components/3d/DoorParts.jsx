/* eslint-disable react/no-unknown-property */
import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getFirstGeometry } from './Generic';
// Importiamo l'hook e la funzione di preload una volta sola
import { useEncryptedGLTF, preloadEncryptedGLTF } from '../../hooks/useEncryptedGLTF';

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

// --- COMPONENTE BASE PER PARTI SINGOLE ---
const ConfigurablePart = ({ path, config, scenario }) => {
  const fileName = path.split('/').pop().replace('.glb', '.enc');
  const securePath = `/models/nordic_secure/${fileName}`;
  
  const { nodes } = useEncryptedGLTF(securePath);
  const geometry = getFirstGeometry(nodes);
  
  useMemo(() => ensureUV2(geometry), [geometry]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow={scenario === 'showroom'} receiveShadow={scenario === 'showroom'} frustumCulled={false}>
      {config.isSolid ? <MaterialeSolido config={config} /> : <MaterialeTexturizzato config={config} />}
    </mesh>
  );
};

// --- GRUPPI PRINCIPALI DELLA PORTA ---

export function GruppoEsterno({ config, viewMode, scenario }) {
  const show = viewMode === 'external';
  const isHPL = config.category === 'hpl';

  // CARICAMENTO DEL FILE UNICO CRIPTATO
  const { nodes } = useEncryptedGLTF('/models/nordic_secure/nordic_01_esterno.enc');

  const propsMetallo = useTexture({
    map: '/textures/altro/metallo_spazzolato/color.jpg',
    normalMap: '/textures/altro/metallo_spazzolato/normal.png',
    roughnessMap: '/textures/altro/metallo_spazzolato/roughness.jpg',
    aoMap: '/textures/altro/metallo_spazzolato/ao.jpg',
  });

  useMemo(() => {
    Object.values(propsMetallo).forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
    if(propsMetallo.map) propsMetallo.map.colorSpace = THREE.SRGBColorSpace;
    if(propsMetallo.normalMap) propsMetallo.normalMap.colorSpace = THREE.NoColorSpace;
    if(propsMetallo.roughnessMap) propsMetallo.roughnessMap.colorSpace = THREE.NoColorSpace;
    if(propsMetallo.aoMap) propsMetallo.aoMap.colorSpace = THREE.NoColorSpace;
  }, [propsMetallo]);

  useMemo(() => {
    if (nodes) {
      if (nodes.Anello) ensureUV2(nodes.Anello.geometry);
      if (nodes.Core) ensureUV2(nodes.Core.geometry);
      if (nodes.Overlay) ensureUV2(nodes.Overlay.geometry);
    }
  }, [nodes]);

  if (!nodes || !nodes.Anello || !nodes.Core || !nodes.Overlay) return null;

  return (
    <group visible={show}>
      <mesh geometry={nodes.Anello.geometry} castShadow={scenario === 'showroom'} receiveShadow={scenario === 'showroom'} frustumCulled={false}>
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

      <mesh geometry={nodes.Core.geometry} castShadow={scenario === 'showroom'} receiveShadow={scenario === 'showroom'} frustumCulled={false}>
        <meshStandardMaterial 
          color={isHPL ? '#24272d' : config.hex} 
          roughness={0.5} 
          side={THREE.DoubleSide} 
          shadowSide={THREE.BackSide} 
        />
      </mesh>

      <mesh geometry={nodes.Overlay.geometry} castShadow={scenario === 'showroom'} receiveShadow={scenario === 'showroom'} frustumCulled={false}>
        {config.isSolid ? <MaterialeSolido config={config} /> : <MaterialeTexturizzato config={config} />}
      </mesh>
    </group>
  );
}

export function GruppoInterno({ config, viewMode, scenario }) {
  const path = '/models/nordic/pannello_interno_liscio/pannello_interno_liscio.glb';
  const show = viewMode === 'internal';

  // Nessun "return null"! Rendiamo solo invisibile il gruppo.
  return (
    <group visible={show}>
      <ConfigurablePart path={path} config={config} scenario={scenario} />
    </group>
  );
}

export function GruppoComune({ scenario }) {
  // Disabilitato per ora
  return null;
}

// --- PRELOAD E PRE-DECRIPTAZIONE GLOBALE ---

// 1. Preload delle texture
const texturesToPreload = [
  '/textures/altro/metallo_spazzolato/color.jpg',
  '/textures/altro/legno_okume/color.jpg'
];
texturesToPreload.forEach(f => useTexture.preload(f));

// 2. Preload dei modelli criptati (Fondamentale per eliminare la schermata bianca)
preloadEncryptedGLTF('/models/nordic_secure/nordic_01_esterno.enc');
preloadEncryptedGLTF('/models/nordic_secure/pannello_interno_liscio.enc');