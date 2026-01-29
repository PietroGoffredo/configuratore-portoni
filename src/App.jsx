import React, { useState, Suspense, useTransition, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';

import { TEXTURES_DATA } from './constants/data';
import { Nordic01Esterno, PannelloInterno, StrutturaCompleta } from './components/3d/DoorParts';
import './styles/App.css';

export default function App() {
  const defaultExt = TEXTURES_DATA.finishes.find(f => f.id === 'hpl_113');
  const defaultInt = TEXTURES_DATA.finishes.find(f => f.id === 'laccato_3151');

  const [extFinish, setExtFinish] = useState(defaultExt); 
  const [intFinish, setIntFinish] = useState(defaultInt);
  
  const [openSections, setOpenSections] = useState({ esterni: true, interni: true });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingState, setLoadingState] = useState({ category: null, id: null });

  const preloadImage = (url) => {
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (tex) => resolve(tex), undefined, (err) => resolve(null));
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
       mapsToLoad.push(folder + 'ao.jpg');
     }

     if (mapsToLoad.length > 0) {
       await Promise.all(mapsToLoad.map(url => preloadImage(url)));
     } else {
       await new Promise(r => setTimeout(r, 200)); 
     }

     startTransition(() => {
       setter(newItem);
     });
  };

  useEffect(() => {
    if (!isPending) setLoadingState({ category: null, id: null });
  }, [isPending]);

  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

  const extState = { 
    finish: extFinish, 
    setFinish: (item) => handleTextureChange(setExtFinish, item, 'ext_main')
  };
  
  const intState = { 
    finish: intFinish, 
    setFinish: (item) => handleTextureChange(setIntFinish, item, 'int_main')
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }} id="main-scroll-container">
        <div className="app-container" style={{ flex: 1, minHeight: 'auto' }}>
          
          <div className="viewer-area">
            <div className={`canvas-frame ${isFullscreen ? 'fullscreen' : ''}`}>
              <button className="fullscreen-toggle" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? '✕' : '⤢'} 
              </button>

              <Canvas 
                shadows 
                // Near 0.1 e Far 200 per massima precisione Z-Buffer
                camera={{ position: [0, 1, 4], fov: 45, near: 0.1, far: 200 }} 
                style={{ touchAction: "none" }}
              >
                <color attach="background" args={['#eeeeee']} />
                <ambientLight intensity={0.7} />
                
                {/* FIX BUG TRIANGOLI: shadow-bias negativo rimuove l'acne delle ombre */}
                <directionalLight 
                  position={[5, 10, 5]} 
                  intensity={1.5} 
                  castShadow 
                  shadow-bias={-0.0005} 
                />
                
                <Environment preset="city" />

                <Suspense fallback={null}>
                    {/* Tutto posizionato a 0,0,0 Assoluto */}
                    <group>
                       <StrutturaCompleta />
                       <PannelloInterno config={intFinish} />
                       <Nordic01Esterno config={extFinish} />
                    </group>
                </Suspense>
                
                {/* CAMERA TOTALMENTE LIBERA */}
                <OrbitControls 
                  makeDefault 
                  enablePan={true} 
                  enableZoom={true}
                  minDistance={0.1}
                  maxDistance={50}
                />
              </Canvas>
            </div>
          </div>

          <div className="sidebar-area">
            <div className="sidebar-header">
              <h1 className="brand-title">Configuratore</h1>
              <p className="config-subtitle">NORDIC 01</p>
            </div>

            <Interface 
              openSections={openSections} toggleSection={toggleSection}
              finishes={TEXTURES_DATA.finishes}
              extState={extState} intState={intState}
              loadingState={loadingState} 
            />

            <div style={{ padding: '30px 40px', borderTop: '1px solid var(--color-white-tert)', background: '#fff' }}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', fontWeight:'700', fontSize:'1.1rem', color: 'var(--color-grey-2)'}}>
                 <span>Totale Stimato</span><span>€ 2.450,00</span>
              </div>
              <button style={{ width: '100%', padding: '16px', background: 'var(--color-grey-3)', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize:'0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Richiedi Preventivo
              </button>
            </div>
          </div>
        </div>
        <Footer />
        <ScrollToTop />
      </div>
    </div>
  );
}