import React, { useLayoutEffect, useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function ComponenteConTexture({ 
  modelPath, 
  textureConfig, 
  pos = [0,0,0], 
  rot = [0,0,0], 
  scale = [1,1,1] 
}) {
  const { scene } = useGLTF(modelPath);
  const sceneClone = useMemo(() => scene.clone(), [scene]);
  const { folder, file, tint } = textureConfig;

  // Logica Texture
  const texturePaths = { map: `/textures/${folder}/${file}` };
  const isFrassino = folder === 'legno_frassino';

  if (!isFrassino) {
    texturePaths.normalMap = `/textures/${folder}/normal.png`;
    texturePaths.aoMap = `/textures/${folder}/ao.jpg`;
  }
  if (!isFrassino && folder !== 'pannello') {
    texturePaths.roughnessMap = `/textures/${folder}/roughness.jpg`;
  }

  const textureProps = useTexture(texturePaths);

  useLayoutEffect(() => {
    Object.values(textureProps).forEach((t) => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1); 
        t.colorSpace = THREE.SRGBColorSpace;
      }
    });
    if (textureProps.normalMap) textureProps.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    if (textureProps.roughnessMap) textureProps.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
    if (textureProps.aoMap) textureProps.aoMap.colorSpace = THREE.LinearSRGBColorSpace;
  }, [textureProps]);

  useLayoutEffect(() => {
    sceneClone.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = new THREE.MeshStandardMaterial({
          map: textureProps.map,
          normalMap: textureProps.normalMap || null,
          normalScale: new THREE.Vector2(1, 1), 
          roughnessMap: textureProps.roughnessMap || null,
          aoMap: textureProps.aoMap || null,
          aoMapIntensity: 1.2,
          envMapIntensity: 1,
          roughness: textureProps.roughnessMap ? 1.0 : 0.8, 
          metalness: 0,
          side: THREE.DoubleSide, 
        });

        if (tint) obj.material.color.set(tint);
        else obj.material.color.set('#ffffff');
        
        obj.material.needsUpdate = true;
      }
    });
  }, [sceneClone, textureProps, tint]);

  return <primitive object={sceneClone} position={pos} rotation={rot} scale={scale} />;
}

export function ComponenteMetallo({ 
  modelPath, 
  finitura = 'silver', 
  pos = [0,0,0], 
  rot = [0,0,0], 
  scale = [1,1,1] 
}) {
  const { scene } = useGLTF(modelPath);
  const sceneClone = useMemo(() => scene.clone(), [scene]);

  const propsTexture = useTexture({
    map: '/textures/metallo_spazzolato/color.jpg',
    normalMap: '/textures/metallo_spazzolato/normal.png',
    roughnessMap: '/textures/metallo_spazzolato/roughness.jpg',
    aoMap: '/textures/metallo_spazzolato/ao.jpg',
  });

  useLayoutEffect(() => {
    [propsTexture.map, propsTexture.normalMap, propsTexture.roughnessMap, propsTexture.aoMap].forEach(t => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(2, 2); 
        t.colorSpace = THREE.SRGBColorSpace; 
      }
    });
    // Set Linear for non-color maps
    if (propsTexture.normalMap) propsTexture.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    if (propsTexture.roughnessMap) propsTexture.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
  }, [propsTexture]);

  useLayoutEffect(() => {
    sceneClone.traverse((object) => {
      if (object.isMesh) {
        object.material = new THREE.MeshStandardMaterial({
          map: propsTexture.map,
          normalMap: propsTexture.normalMap,
          roughnessMap: propsTexture.roughnessMap,
          aoMap: propsTexture.aoMap,
          metalness: 1, 
          roughness: 0.8, 
          envMapIntensity: 1.5,
          side: THREE.DoubleSide
        });

        if (finitura === 'nero') object.material.color.set('#2a2a2a'); 
        else object.material.color.set('#ffffff'); 
        
        object.material.needsUpdate = true;
      }
    });
  }, [sceneClone, propsTexture, finitura]);

  return <primitive object={sceneClone} position={pos} rotation={rot} scale={scale} />;
}