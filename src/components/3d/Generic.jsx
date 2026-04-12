/* eslint-disable react/no-unknown-property */
import React, { useLayoutEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// 1. UTILITY: Estrae la geometria principale (Evita duplicazioni di codice)
export const getFirstGeometry = (nodes) => {
  const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh');
  return meshName ? nodes[meshName].geometry : null;
};

// 2. COMPONENTE: Motore Universale per le Ombre Baked
export function OmbraStatica({ modelPath, urlTexture }) {
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