import React, { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function VillaTestModel(props) {
  const { nodes, materials } = useGLTF('/Villa_Test_React.glb')

  useEffect(() => {
    // 1. FIX FOGLIE E PIANTE (Elimina i contorni finti e l'effetto piani incastrati)
    const foliageMaterialNames = [
      'Wild Bush_Leaf.038', 
      'Evergreen_Leaf_1.005', 
      'Evergreen_Leaf_1.007', 
      'Material.005', 
      'Material.006', 
      'fern', 
      'phlox leaf', 
      'phlox flower',
      'AlexandraPalm',
      'pine procedural.001',
      'pine procedural.002'
    ];

    foliageMaterialNames.forEach(name => {
      const mat = materials[name];
      if (mat) {
        mat.transparent = false; 
        mat.alphaTest = 0.5;     
        mat.side = THREE.DoubleSide; 
        mat.depthWrite = true;   
        mat.needsUpdate = true;
      }
    });

    // 2. FIX SCALA TEXTURE ARCHITETTURA (Applica i valori esatti del nodo Mapping)
    const scaleTexture = (material, repeatX, repeatY) => {
      if (!material) return;
      // Cerchiamo le varie mappe (Colore, Normal, Roughness) e le scaliamo
      const maps = [material.map, material.normalMap, material.roughnessMap, material.aoMap];
      maps.forEach(map => {
        if (map) {
          map.wrapS = THREE.RepeatWrapping;
          map.wrapT = THREE.RepeatWrapping;
          map.repeat.set(repeatX, repeatY);
          map.needsUpdate = true;
        }
      });
    };

    // Applicazione delle tue scale perfette
    scaleTexture(materials['Spanish Stone Wall'], 22, 22);
    scaleTexture(materials.Plaster, 0.025, 0.025);
    scaleTexture(materials['White Stone'], 20, 20);

    // Se in futuro vuoi scalare anche il prato, ti basta aggiungere:
    // scaleTexture(materials.Grass, 5, 5); 

  }, [materials]);

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Prato.geometry}
        material={materials.Grass}
        position={[0, -0.034, 4.57]}
        scale={[6.336, 7.693, 7.693]}
      />
      <group position={[-7.783, 0.529, 1.12]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube010.geometry}
          material={materials['Spanish Stone Wall']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube010_1.geometry}
          material={materials.Plaster}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube010_2.geometry}
          material={materials['White Stone']}
        />
      </group>
      <group position={[-0.574, 1.85, 0.159]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_1.geometry}
          material={materials.lamp_2}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_1_1.geometry}
          material={materials.lamp_2_emissive}
        />
      </group>
      <group position={[1.573, 1.85, 0.159]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_1001.geometry}
          material={materials['lamp_2.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_1001_1.geometry}
          material={materials['lamp_2_emissive.001']}
        />
      </group>
      <group position={[-3.087, 4.868, 0.858]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001.geometry}
          material={materials.Glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_1.geometry}
          material={materials['Alu. Powder Coat.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_2.geometry}
          material={materials[' Gasket Rubber.001']}
        />
      </group>
      <group position={[-2.415, 1.211, -0.014]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane809.geometry}
          material={materials.Glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane809_1.geometry}
          material={materials['Alu. Powder Coat']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane809_2.geometry}
          material={materials[' Gasket Rubber']}
        />
      </group>
      <group position={[-0.796, 4.868, 0.858]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001.geometry}
          material={materials.Glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_1.geometry}
          material={materials['Alu. Powder Coat.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_2.geometry}
          material={materials[' Gasket Rubber.001']}
        />
      </group>
      <group position={[1.494, 4.868, 0.858]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001.geometry}
          material={materials.Glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_1.geometry}
          material={materials['Alu. Powder Coat.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_2.geometry}
          material={materials[' Gasket Rubber.001']}
        />
      </group>
      <group position={[3.785, 4.868, 0.858]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001.geometry}
          material={materials.Glass}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_1.geometry}
          material={materials['Alu. Powder Coat.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane001_2.geometry}
          material={materials[' Gasket Rubber.001']}
        />
      </group>
      <group position={[-1.354, 0, 3.653]} rotation={[-Math.PI, 1.225, -Math.PI]} scale={0.922}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.tree002_1.geometry}
          material={materials['pine procedural.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.tree002_2.geometry}
          material={materials['Material.005']}
        />
      </group>
      <group position={[-4.377, -0.041, 3.031]} scale={0.801}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Alexandra_Palm_1a038.geometry}
          material={materials.AlexandraPalm}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Alexandra_Palm_1a038_1.geometry}
          material={materials['Wild Bush_Leaf.038']}
        />
      </group>
      <group position={[-4.071, -0.041, 3.408]} rotation={[Math.PI, -0.483, Math.PI]} scale={0.354}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Alexandra_Palm_1a038.geometry}
          material={materials.AlexandraPalm}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Alexandra_Palm_1a038_1.geometry}
          material={materials['Wild Bush_Leaf.038']}
        />
      </group>
      <group position={[-4.86, -0.041, 3.423]} rotation={[0, -1.378, 0]} scale={0.446}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Alexandra_Palm_1a038.geometry}
          material={materials.AlexandraPalm}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Alexandra_Palm_1a038_1.geometry}
          material={materials['Wild Bush_Leaf.038']}
        />
      </group>
      <group position={[-9.914, -0.036, 4.709]} scale={0.509}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[-9.922, -0.036, 1.131]} rotation={[0, -0.772, 0]} scale={0.57}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[-9.758, -0.036, -2.593]} rotation={[0, -1.289, 0]} scale={0.518}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[-9.914, -0.036, -6.37]} rotation={[0, -1.201, 0]} scale={0.59}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[-9.758, -0.036, -9.906]} rotation={[0, -1.289, 0]} scale={0.518}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[9.295, -0.036, -9.061]} rotation={[Math.PI, 0, Math.PI]} scale={0.564}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[9.56, -0.036, -5.737]} rotation={[-Math.PI, 0.772, -Math.PI]} scale={0.57}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group
        position={[9.139, -0.036, -2.229]}
        rotation={[-Math.PI, 1.289, -Math.PI]}
        scale={0.518}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[9.295, -0.036, 1.233]} rotation={[-Math.PI, 1.201, -Math.PI]} scale={0.509}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[9.139, -0.036, 4.838]} rotation={[-Math.PI, 1.289, -Math.PI]} scale={0.518}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3.geometry}
          material={materials['Pine_Bark.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_short_3_1.geometry}
          material={materials['Evergreen_Leaf_1.005']}
        />
      </group>
      <group position={[-10.981, 0.002, -1.217]} scale={0.252}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[-12.038, 0.002, 3.407]} rotation={[0, -0.398, 0]} scale={0.169}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[-11.838, 0.002, -4.397]} rotation={[0, -0.87, 0]} scale={0.2}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[-12.033, 0.002, -8.206]} rotation={[0, -1.301, 0]} scale={0.221}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[11.129, 0.002, -3.873]} rotation={[Math.PI, 0, Math.PI]} scale={0.24}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[11.39, 0.002, -7.7]} rotation={[-Math.PI, 0.398, -Math.PI]} scale={0.203}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[10.648, 0.002, -0.445]} rotation={[-Math.PI, 0.87, -Math.PI]} scale={0.257}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[10.304, 0.002, 2.811]} rotation={[-Math.PI, 1.301, -Math.PI]} scale={0.221}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2.geometry}
          material={materials['Twisted_Oak_Bark.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.evergreen_douglasfir_2_1.geometry}
          material={materials['Evergreen_Leaf_1.007']}
        />
      </group>
      <group position={[3.2, -0.041, 1.942]} rotation={[0, 0.415, 0]} scale={1.488}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.tree003.geometry}
          material={materials['pine procedural.002']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.tree003_1.geometry}
          material={materials['Material.006']}
        />
      </group>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.fern.geometry}
        material={materials.fern}
        position={[3.741, -0.037, 3.341]}
        rotation={[-Math.PI, 0.019, -Math.PI]}
        scale={1.268}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.fern001.geometry}
        material={materials.fern}
        position={[3.98, -0.037, 3.632]}
        rotation={[-Math.PI, 0.961, -Math.PI]}
        scale={0.732}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.fern002.geometry}
        material={materials.fern}
        position={[-2.522, -0.037, 1.461]}
        rotation={[0, 0.637, 0]}
        scale={1.495}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.fern003.geometry}
        material={materials.fern}
        position={[-2.338, -0.037, 1.793]}
        rotation={[0, -0.31, 0]}
        scale={0.63}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.fern004.geometry}
        material={materials.fern}
        position={[-2.885, -0.037, 1.444]}
        rotation={[0, -1.148, 0]}
        scale={0.483}
      />
      <group position={[-0.576, -0.041, 0.358]} rotation={[-2.56, 1.208, 2.755]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Tree005.geometry}
          material={materials['phlox stem']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Tree005_1.geometry}
          material={materials['phlox leaf']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Tree005_2.geometry}
          material={materials['phlox flower']}
        />
      </group>
      <group position={[1.575, -0.041, 0.329]} rotation={[-2.408, 1.276, 2.594]} scale={0.966}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Tree005.geometry}
          material={materials['phlox stem']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Tree005_1.geometry}
          material={materials['phlox leaf']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Tree005_2.geometry}
          material={materials['phlox flower']}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/Villa_Test_React.glb')