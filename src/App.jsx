import React, { useState, Suspense, useTransition, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';

import Interface from './components/ui/Interface';
import { TEXTURES_DATA } from './constants/data';
import { PannelloEsterno4Incisioni, PannelloInterno, StrutturaCompleta } from './components/3d/DoorParts';
import { ComponenteMetallo } from './components/3d/Generic';
import './styles/App.css';

export default function App() {
  const [intCentralConfig, setIntCentralConfig] = useState(TEXTURES_DATA.colors[3]); 
  const [intCorniceConfig, setIntCorniceConfig] = useState(TEXTURES_DATA.woods[2]); 
  const [finManigliaInt, setFinManigliaInt] = useState("silver");

  const [extCentralConfig, setExtCentralConfig] = useState(TEXTURES_DATA.colors[3]); 
  const [extCorniceConfig, setExtCorniceConfig] = useState(TEXTURES_DATA.woods[2]); 
  const [finManiglioneExt, setFinManiglioneExt] = useState("silver");

  const [openSections, setOpenSections] = useState({
    esterni: true, accessori_ext: true, interni: true
  });
  
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
     const { folder, file } = newItem;
     const mapsToLoad = [`/textures/${folder}/${file}`];
     const isFrassino = folder === 'legno_frassino';
     if (!isFrassino) {
       mapsToLoad.push(`/textures/${folder}/normal.png`);
       mapsToLoad.push(`/textures/${folder}/ao.jpg`);
     }
     if (!isFrassino && folder !== 'pannello') {
       mapsToLoad.push(`/textures/${folder}/roughness.jpg`);
     }
     await Promise.all(mapsToLoad.map(url => preloadImage(url)));
     startTransition(() => {
       setter(newItem);
     });
  };

  useEffect(() => {
    if (!isPending) {
      setLoadingState({ category: null, id: null });
    }
  }, [isPending]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const availableOptions = [
    ...TEXTURES_DATA.woods.filter(w => w.id !== 'legno_frassino'),
    ...TEXTURES_DATA.colors
  ];

  const extState = { 
    central: extCentralConfig, 
    setCentral: (item) => handleTextureChange(setExtCentralConfig, item, 'ext_central'),
    cornice: extCorniceConfig, 
    setCornice: (item) => handleTextureChange(setExtCorniceConfig, item, 'ext_cornice'),
    maniglia: finManiglioneExt, 
    setManiglia: setFinManiglioneExt
  };
  
  const intState = { 
    central: intCentralConfig, 
    setCentral: (item) => handleTextureChange(setIntCentralConfig, item, 'int_central'),
    cornice: intCorniceConfig, 
    setCornice: (item) => handleTextureChange(setIntCorniceConfig, item, 'int_cornice'),
    maniglia: finManigliaInt, 
    setManiglia: setFinManigliaInt 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      <Navbar />

      {/* MODIFICHE APPLICATE QUI:
          1. overflowY: 'auto' -> Abilita scroll verticale
          2. overflowX: 'hidden' -> DISABILITA scroll orizzontale indesiderato
          3. id="main-scroll-container" -> Permette a ScrollToTop di trovarlo
      */}
      <div 
        id="main-scroll-container"
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }} 
      >
        
        {/* CONFIGURATORE */}
        <div className="app-container" style={{ flex: 1, minHeight: 'auto' }}>
          
          {/* LEFT: 3D VIEWER */}
          <div className="viewer-area">
            <div className={`canvas-frame ${isFullscreen ? 'fullscreen' : ''}`}>
              
              <button 
                className="fullscreen-toggle" 
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Riduci" : "Schermo Intero"}
              >
                {isFullscreen ? '✕' : '⤢'} 
              </button>

              <Canvas 
                shadows 
                camera={{ position: [-1, 1, 3.5], fov: 45 }} 
                style={{ touchAction: "none" }}
              >
                <color attach="background" args={['#eeeeee']} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                <Environment preset="city" />

                <Suspense fallback={null}>
                    <group position={[-0.1, -0.95, 0]}>
                       <StrutturaCompleta />
                       <PannelloInterno configCentrale={intCentralConfig} configCornice={intCorniceConfig} />
                       <ComponenteMetallo 
                          modelPath="/models/maniglia_interna.glb" 
                          finitura={finManigliaInt} 
                          pos={[0.159, 1.0475, -0.1389]} 
                          rot={[0, Math.PI, 0]} 
                       />
                       <PannelloEsterno4Incisioni configCentrale={extCentralConfig} configCornice={extCorniceConfig} />
                       <ComponenteMetallo 
                          modelPath="/models/maniglione_esterno.glb" 
                          finitura={finManiglioneExt} 
                          pos={[0.25, 1.0475, -0.016]} 
                          rot={[0, 0, 0]} 
                       />
                    </group>
                </Suspense>
                <OrbitControls 
                  makeDefault 
                  minPolarAngle={0} 
                  maxPolarAngle={Math.PI} 
                  enablePan={false}
                  target={[0.4, 0.3, 0]} 
                />
              </Canvas>
            </div>
          </div>

          {/* RIGHT: CONFIGURATION MENU */}
          <div className="sidebar-area">
            <div className="sidebar-header">
              <h1 className="brand-title">Configuratore</h1>
              <p className="config-subtitle">Personalizza il tuo portone</p>
            </div>

            <Interface 
              openSections={openSections} 
              toggleSection={toggleSection}
              availableOptions={availableOptions}
              extState={extState}
              intState={intState}
              loadingState={loadingState} 
            />

            <div style={{ padding: '30px 40px', borderTop: '1px solid #e6e6e6', background: '#fff' }}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', fontWeight:'700', fontSize:'1.1rem'}}>
                 <span>Totale Stimato</span>
                 <span>€ 2.450,00</span>
              </div>
              <button style={{ 
                width: '100%', padding: '16px', background: '#191919', color: '#fff', 
                border: 'none', fontWeight: '600', cursor: 'pointer', fontSize:'0.9rem'
              }}>
                SALVA CONFIGURAZIONE
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER & SCROLL TO TOP (Dentro lo scroll container) */}
        <Footer />
        <ScrollToTop />

      </div>
    </div>
  );
}