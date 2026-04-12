import { useState } from 'react';

export function usePhotoCapture(webglContextRef) {
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const handleTakePhoto = async (isInteractionModeSwitching) => {
    if (isTakingPhoto || !webglContextRef.current || isInteractionModeSwitching) return;
    setIsTakingPhoto(true);

    await new Promise(resolve => setTimeout(resolve, 50));
    const { gl, scene, camera } = webglContextRef.current;
    
    const originalDpr = gl.getPixelRatio();
    gl.setPixelRatio(3); // Alta risoluzione per il preventivo
    gl.render(scene, camera); 
    
    const dataURL = gl.domElement.toDataURL('image/jpeg', 1.0);
    gl.setPixelRatio(originalDpr);
    gl.render(scene, camera);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'Nordic_01_Configurazione.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsTakingPhoto(false);
  };

  return { isTakingPhoto, handleTakePhoto };
}