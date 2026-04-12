import { useState, useTransition, useEffect } from 'react';
import * as THREE from 'three';

export function useTextureManager(defaultExt, defaultInt) {
  const [extFinish, setExtFinish] = useState(defaultExt); 
  const [intFinish, setIntFinish] = useState(defaultInt);
  const [loadingState, setLoadingState] = useState({ category: null, id: null });
  const [isPending, startTransition] = useTransition();

  const preloadImage = (url) => {
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (tex) => resolve(tex), undefined, () => resolve(null));
    });
  };

  const handleTextureChange = async (setter, newItem, category) => {
     if (newItem.id === loadingState.id && category === loadingState.category) return; 
     setLoadingState({ category: category, id: newItem.id });
     
     const mapsToLoad = [];
     if (newItem.isTextured || newItem.isHybrid || newItem.type === 'hpl_tex') {
       const folder = `/textures/${newItem.folder}/`;
       if(newItem.type === 'hpl_tex' || newItem.isTextured) mapsToLoad.push(folder + 'color.jpg');
       mapsToLoad.push(folder + 'normal.png');
       mapsToLoad.push(folder + 'roughness.jpg');
       if (newItem.id !== 'hpl_5004') mapsToLoad.push(folder + 'ao.jpg');
     }

     if (mapsToLoad.length > 0) await Promise.all(mapsToLoad.map(url => preloadImage(url)));
     else await new Promise(r => setTimeout(r, 200)); 
     
     startTransition(() => setter(newItem));
  };

  useEffect(() => { if (!isPending) setLoadingState({ category: null, id: null }); }, [isPending]);

  return {
    extFinish,
    intFinish,
    extState: { finish: extFinish, setFinish: (item) => handleTextureChange(setExtFinish, item, 'ext_main') },
    intState: { finish: intFinish, setFinish: (item) => handleTextureChange(setIntFinish, item, 'int_main') },
    loadingState
  };
}