import React from 'react';
import { Environment } from '@react-three/drei';

export default function Lighting() {
  return (
    <>
      {/* Ambiente HDR: fornisce riflessi per vetri/metalli e luce diffusa */}
      <Environment 
        files="/textures/showroom/luce_studio.hdr" 
        background={false} 
        environmentIntensity={0.8} // Leggermente alzato per far risaltare il telaio scuro
      />
      
      {/* Luce emisferica: riempie le ombre. Colori tenui per non "bruciare" il baking */}
      <hemisphereLight 
        skyColor="#ffffff" 
        groundColor="#e6e4df" 
        intensity={0.4} 
      />
      
      {/* Sole: dà direzione e riflessi speculari (NIENTE OMBRE DINAMICHE) */}
      <directionalLight 
        position={[3, 8, 5]} 
        intensity={1.2} 
        color="#fff5e6" 
        castShadow={false} // Fondamentale: ombre dinamiche disattivate
      />
    </>
  );
}