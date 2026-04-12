import React from 'react';
import { Environment } from '@react-three/drei';

export default function Lighting() {
  return (
    <>
      {/* Ambiente HDR per riflessi e rifrazioni del vetro */}
      <Environment 
        files="/textures/showroom/luce_studio.hdr" 
        background={false} 
        environmentIntensity={0.7} 
      />
      
      {/* Luce emisferica per schiarire le ombre (Cielo/Terra) */}
      <hemisphereLight 
        skyColor="#b1d1ff" 
        groundColor="#3d2b1f" 
        intensity={0.5} 
      />
      
      {/* Sole di Mezzogiorno: Caldo e zenitale */}
      <directionalLight 
        position={[2, 10, 4]} 
        intensity={2.0} 
        color="#fff1d0" 
        castShadow={false} // Usiamo ombre baked per performance
      />
      
      {/* Luce di rimbalzo fredda dall'atmosfera */}
      <directionalLight 
        position={[-5, 2, -2]} 
        intensity={0.4} 
        color="#d0e0ff" 
      />
    </>
  );
}