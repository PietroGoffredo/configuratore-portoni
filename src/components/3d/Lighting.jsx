import React from 'react';
import { Environment } from '@react-three/drei';

export default function Lighting({ viewMode }) {
  const isExternal = viewMode === 'external';

  return (
    <>
      {/* Ambiente HDR Dinamico: Switcha tra esterno e interno */}
      <Environment 
        files={isExternal ? "/textures/showroom/luce_studio.hdr" : "/textures/showroom/luce_interna.hdr"} 
        background={false} 
        environmentIntensity={isExternal ? 0.7 : 0.9} 
      />
      
      {/* Luce emisferica */}
      <hemisphereLight 
        skyColor={isExternal ? "#b1d1ff" : "#ffffff"} 
        groundColor={isExternal ? "#3d2b1f" : "#e6e4df"} 
        intensity={isExternal ? 0.5 : 0.4} 
      />
      
      {/* Luce Direzionale (Sole) */}
      <directionalLight 
        position={isExternal ? [2, 10, 4] : [4, 6, -3]} 
        intensity={isExternal ? 2.0 : 1.2} 
        color="#fff1d0" 
        castShadow={false} 
      />

      {/* Luce di riempimento secondaria morbida */}
      <directionalLight 
        position={[-5, 2, -2]} 
        intensity={0.4} 
        color="#d0e0ff" 
        castShadow={false} 
      />
    </>
  );
}