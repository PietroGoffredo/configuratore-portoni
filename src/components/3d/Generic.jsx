/* eslint-disable react/no-unknown-property */
import React from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const getFirstGeometry = (nodes) => {
  const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh');
  return meshName ? nodes[meshName].geometry : null;
};

export function ComponenteMetallo({ modelPath, finitura, pos, rot }) {
  const { nodes } = useGLTF(modelPath);
  const geometry = getFirstGeometry(nodes);

  const propsMetallo = useTexture({
    map: '/textures/altro/metallo_spazzolato/color.jpg',
    normalMap: '/textures/altro/metallo_spazzolato/normal.png',
    roughnessMap: '/textures/altro/metallo_spazzolato/roughness.jpg',
    aoMap: '/textures/altro/metallo_spazzolato/ao.jpg',
  });

  if (propsMetallo) {
    Object.values(propsMetallo).forEach(t => {
      if(t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(4, 4);
        t.colorSpace = THREE.SRGBColorSpace;
      }
    });
  }

  if (!geometry) return null;

  return (
    <group position={pos} rotation={rot} dispose={null}>
      <mesh 
        geometry={geometry} 
        castShadow 
        receiveShadow
        frustumCulled={false}
      >
        <meshStandardMaterial 
          {...propsMetallo} 
          color="#ffffff" 
          metalness={1.0} 
          roughness={0.3} 
          envMapIntensity={1.5} 
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}