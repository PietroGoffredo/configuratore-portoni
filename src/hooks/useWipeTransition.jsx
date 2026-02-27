import { useState, useRef, useEffect } from 'react';

export function useWipeTransition({
  CAMERA_PRESETS,
  interactionMode,
  viewMode, setViewMode,
  setActiveAngle,
  setUiActiveAngleId,
  setCameraTrigger,
  webglContextRef,
  canvasContainerRef,
  isSwitching, setIsSwitching,
  isScenarioSwitching,
  isTakingPhoto,
  isInteractionModeSwitching,
  setIsBlackout,
  scenario
}) {
  const [dragUI, setDragUI] = useState({ 
    active: false, image: null, clipPath: 'inset(0 0 0 0)', offset: 0, 
    finalOffset: 0, finalClipPath: 'inset(0 0 0 0)', animating: false, duration: 0.55 
  });

  const [zoomConfig, setZoomConfig] = useState({ active: false, originX: 50, originY: 50, x: 0, y: 0, instant: false });
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentPresetIndexRef = useRef(0);
  const current3DAngleIdRef = useRef(CAMERA_PRESETS[0].id);
  
  const dragRef = useRef({ 
    isDragging: false, startX: 0, startY: 0, currentX: 0, startTime: 0,
    moved: false, containerWidth: 0, hasCaptured: false, direction: null, 
    targetIndex: 0, originalIndex: 0, history: [] 
  });
  const transitionTokenRef = useRef(0);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false); 
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
        setTimeout(() => setZoomConfig(prev => ({ ...prev, instant: false })), 50);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (canvasContainerRef.current) await canvasContainerRef.current.requestFullscreen();
      } else {
        if (zoomConfig.active) {
            setIsPhotoZoomed(false);
            setIsDraggingUI(false);
            setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
        }
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Errore Fullscreen:", err);
    }
  };

  const change3DScene = (angle) => {
      if (!angle) return;
      if (angle.type !== viewMode) setViewMode(angle.type);
      setActiveAngle(angle);
      current3DAngleIdRef.current = angle.id;
      setCameraTrigger(Date.now());
  };

  const resetToIdle = () => {
      const correctAngle = CAMERA_PRESETS[currentPresetIndexRef.current];
      const needsSync = current3DAngleIdRef.current !== correctAngle.id || viewMode !== correctAngle.type;
      
      if (needsSync) {
        change3DScene(correctAngle);
        setTimeout(() => {
            setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
        }, 150); 
      } else {
        setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
      }
  };

  const cancelDrag = () => {
    if (!dragRef.current.isDragging) return;

    if (!zoomConfig.active && interactionMode === 'static' && dragRef.current.hasCaptured) {
        const token = Date.now();
        transitionTokenRef.current = token;

        currentPresetIndexRef.current = dragRef.current.originalIndex;
        setUiActiveAngleId(CAMERA_PRESETS[dragRef.current.originalIndex].id);

        setDragUI(prev => ({
            ...prev, animating: true, duration: 0.25, finalOffset: 0, finalClipPath: 'inset(0 0 0 0)'
        }));

        setTimeout(() => {
            if (transitionTokenRef.current === token) {
               const origAngle = CAMERA_PRESETS[dragRef.current.originalIndex];
               if (origAngle.type !== viewMode) setViewMode(origAngle.type);
               setActiveAngle(origAngle);
               setCameraTrigger(Date.now());

               setTimeout(() => {
                   if (transitionTokenRef.current === token) {
                      setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
                   }
               }, 150); 
            }
        }, 250); 
    } else if (!zoomConfig.active) {
        setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
    }

    if (dragRef.current.element) {
        try { dragRef.current.element.releasePointerCapture(dragRef.current.pointerId); } catch(err){}
    }
    dragRef.current.isDragging = false;
    setIsDraggingUI(false);
  };

  const executeWipeTransition = async (direction, targetIndex) => {
    const isNext = direction === 'next';
    const targetAngle = CAMERA_PRESETS[targetIndex];

    currentPresetIndexRef.current = targetIndex;
    setUiActiveAngleId(targetAngle.id); 

    let image = dragUI.active ? dragUI.image : null;
    
    if (!image && webglContextRef.current) {
        const { gl, scene, camera } = webglContextRef.current;
        gl.render(scene, camera);
        image = gl.domElement.toDataURL('image/jpeg', 0.9);
    }

    const token = Date.now();
    transitionTokenRef.current = token;

    setDragUI({
        active: true, image, animating: false, offset: 0, finalOffset: 0, duration: 0.55,
        clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)'
    });

    await new Promise(r => setTimeout(r, 20)); 
    if (transitionTokenRef.current !== token) return;
    
    change3DScene(targetAngle);
    
    await new Promise(r => setTimeout(r, 40)); 
    if (transitionTokenRef.current !== token) return;

    const width = window.innerWidth;
    const finalX = isNext ? -width * 0.05 : width * 0.05;
    const finalClip = isNext ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';

    setDragUI(prev => ({
        ...prev, animating: true, duration: 0.55,
        finalOffset: finalX,
        finalClipPath: finalClip
    }));

    setTimeout(() => {
        if (transitionTokenRef.current === token) {
            resetToIdle();
        }
    }, 550); 
  };

  const handleGalleryNavigation = (direction, forcedTargetIndex = null) => {
    if (isSwitching || isScenarioSwitching || isTakingPhoto || isInteractionModeSwitching || dragUI.active) return;
    
    let currentIndex = currentPresetIndexRef.current;
    let newIndex = forcedTargetIndex !== null ? forcedTargetIndex : 
        (direction === 'next' ? (currentIndex + 1) % CAMERA_PRESETS.length : (currentIndex - 1 + CAMERA_PRESETS.length) % CAMERA_PRESETS.length);
    
    if (currentIndex === newIndex) return;

    currentPresetIndexRef.current = newIndex;

    if (zoomConfig.active) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false);
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
    }

    executeWipeTransition(direction, newIndex);
  };

  const handlePointerDown = (e) => {
    if (interactionMode !== 'static') return;
    if (!zoomConfig.active && dragUI.active) return;
    
    try { e.target.setPointerCapture(e.pointerId); } catch(err){}
    e.preventDefault();
    
    const token = Date.now();
    transitionTokenRef.current = token;
    setUiActiveAngleId(CAMERA_PRESETS[currentPresetIndexRef.current].id); 

    const rect = canvasContainerRef.current.getBoundingClientRect();
    
    let image = null;
    if (webglContextRef.current && !zoomConfig.active) {
        const { gl, scene, camera } = webglContextRef.current;
        gl.render(scene, camera);
        image = gl.domElement.toDataURL('image/jpeg', 0.9);
        setDragUI({ 
            active: true, image, animating: false, offset: 0, finalOffset: 0, duration: 0.55,
            clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)' 
        });
    }

    dragRef.current = {
      isDragging: true, startX: e.clientX, startY: e.clientY, currentX: e.clientX, startTime: Date.now(),
      lastX: zoomConfig.x, lastY: zoomConfig.y, 
      moved: false, containerWidth: rect.width,
      hasCaptured: false, direction: null, targetIndex: 0, originalIndex: currentPresetIndexRef.current,
      history: [{ x: e.clientX, time: Date.now() }],
      pointerId: e.pointerId, element: e.target
    };

    if (zoomConfig.active) setIsDraggingUI(true); 
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.currentX = e.clientX;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    dragRef.current.history.push({ x: e.clientX, time: Date.now() });
    if (dragRef.current.history.length > 6) dragRef.current.history.shift();
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;

    if (zoomConfig.active) {
      setDragUI({active: false, image: null}); 
      setZoomConfig(prev => ({ ...prev, x: dragRef.current.lastX + (dx / 4.5), y: dragRef.current.lastY + (dy / 4.5) }));
    } else {
      const width = dragRef.current.containerWidth;
      
      const photoDx = dx * 0.05; 
      const cutPx = Math.abs(dx) * 0.85; 
      let percent = Math.min((cutPx / width) * 100, 100);

      if (!dragRef.current.hasCaptured && Math.abs(dx) > 15) {
          dragRef.current.hasCaptured = true;
          
          const dir = dx < 0 ? 'next' : 'prev';
          dragRef.current.direction = dir;
          const currentIndex = dragRef.current.originalIndex;
          const nextIndex = dir === 'next' ? (currentIndex + 1) % CAMERA_PRESETS.length : (currentIndex - 1 + CAMERA_PRESETS.length) % CAMERA_PRESETS.length;
          
          dragRef.current.targetIndex = nextIndex;
          const tAngle = CAMERA_PRESETS[nextIndex];
          
          setTimeout(() => {
              if (dragRef.current.isDragging || dragRef.current.moved) {
                  change3DScene(tAngle);
              }
          }, 40); 
      } 
      
      if (dragRef.current.hasCaptured) {
          if (dragRef.current.direction === 'next') {
              setDragUI(prev => ({ ...prev, animating: false, offset: photoDx, clipPath: `inset(0 ${percent}% 0 0)` }));
          } else {
              setDragUI(prev => ({ ...prev, animating: false, offset: photoDx, clipPath: `inset(0 0 0 ${percent}%)` }));
          }
      }
    }
  };

  const handlePointerUp = (e) => {
    try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
    if (!dragRef.current.isDragging) return;
    
    if (!zoomConfig.active && interactionMode === 'static' && dragRef.current.hasCaptured) {
      const endX = e.clientX || dragRef.current.currentX;
      const dx = endX - dragRef.current.startX;
      const now = Date.now();
      const history = dragRef.current.history;
      
      let pastPoint = history[0];
      for(let i = history.length - 1; i >= 0; i--) {
          if (now - history[i].time >= 50) {
              pastPoint = history[i];
              break;
          }
      }
      
      const dt = Math.max(now - pastPoint.time, 1);
      const terminalVelocity = Math.abs(endX - pastPoint.x) / dt;
      const width = dragRef.current.containerWidth;
      const absDx = Math.abs(dx);

      if (absDx < width * 0.05) {
          cancelDrag();
          return;
      }

      const isSlowAndFar = absDx >= width * 0.50;
      const isFastFlick = terminalVelocity > 0.65;

      const currentDir = dx < 0 ? 'next' : 'prev';
      const isValidDir = currentDir === dragRef.current.direction;

      if (isValidDir && (isSlowAndFar || isFastFlick)) {
          const isNext = dragRef.current.direction === 'next';
          const finalPhotoDx = isNext ? -width * 0.05 : width * 0.05; 
          const finalClip = isNext ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';

          currentPresetIndexRef.current = dragRef.current.targetIndex;
          setUiActiveAngleId(CAMERA_PRESETS[dragRef.current.targetIndex].id); 

          setDragUI(prev => ({
              ...prev, animating: true, duration: 0.55,
              finalOffset: finalPhotoDx,
              finalClipPath: finalClip
          }));
          
          const token = Date.now();
          transitionTokenRef.current = token;
          setTimeout(() => {
              if (transitionTokenRef.current === token) {
                  resetToIdle();
              }
          }, 550); 

      } else {
          cancelDrag();
          return; 
      }
    } else {
        cancelDrag();
        return;
    }

    dragRef.current.isDragging = false;
    setIsDraggingUI(false); 
  };

  const handlePointerCancel = (e) => {
    try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
    cancelDrag();
  };

  const handleStaticClick = (e) => {
    if (interactionMode !== 'static' || isSwitching || isScenarioSwitching || isInteractionModeSwitching || dragUI.active) return;
    if (dragRef.current.moved) { dragRef.current.moved = false; return; }

    if (!document.fullscreenElement) {
      toggleFullscreen();
    } else {
      if (zoomConfig.active) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false);
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: false }));
      } else {
        setIsPhotoZoomed(true);
        if (canvasContainerRef.current) {
          const rect = canvasContainerRef.current.getBoundingClientRect();
          const ox = ((e.clientX - rect.left) / rect.width) * 100;
          const oy = ((e.clientY - rect.top) / rect.height) * 100;
          setZoomConfig({ active: true, originX: ox, originY: oy, x: 0, y: 0, instant: false });
        }
      }
    }
  };

  const handleAngleSelect = (angle) => {
    if (isSwitching || isScenarioSwitching || isTakingPhoto || isInteractionModeSwitching || dragUI.active) return;

    if (interactionMode === 'static') {
       const currentIndex = currentPresetIndexRef.current;
       const targetIndex = CAMERA_PRESETS.findIndex(p => p.id === angle.id);
       if (currentIndex === targetIndex) return;
       const direction = targetIndex > currentIndex ? 'next' : 'prev';
       handleGalleryNavigation(direction, targetIndex);
       return;
    }

    const isVilla = scenario !== 'studio';
    const needsViewSwitch = isVilla && angle.type !== viewMode;

    setUiActiveAngleId(angle.id);

    if (needsViewSwitch && interactionMode === '3d') {
      setIsSwitching(true);
      setIsBlackout(true);
      setTimeout(() => {
        setViewMode(angle.type);
        setActiveAngle(angle); 
        setCameraTrigger(Date.now()); 
        setTimeout(() => {
          setIsBlackout(false);
          setTimeout(() => {
            setIsSwitching(false);
          }, 500); 
        }, 100);
      }, 500); 
    } else {
      if (angle.type !== viewMode) setViewMode(angle.type);
      setActiveAngle(angle);
      setCameraTrigger(Date.now());
    }
  };

  const handleViewChange = (mode) => {
    if (mode === viewMode || isSwitching || isInteractionModeSwitching || dragUI.active) return;
    const defaultAngle = CAMERA_PRESETS.find(a => a.type === mode);
    
    if (interactionMode === 'static') {
      const targetIndex = CAMERA_PRESETS.findIndex(p => p.id === defaultAngle.id);
      handleGalleryNavigation('next', targetIndex);
      return;
    }
    
    const isVilla = scenario !== 'studio';

    if (defaultAngle) setUiActiveAngleId(defaultAngle.id);

    if (isVilla && interactionMode === '3d') {
      setIsSwitching(true);
      setIsBlackout(true); 
      setTimeout(() => {
        setViewMode(mode); 
        if(defaultAngle) {
          setActiveAngle(defaultAngle);
          setCameraTrigger(Date.now());
        }
        setTimeout(() => {
          setIsBlackout(false); 
          setTimeout(() => {
            setIsSwitching(false);
          }, 500); 
        }, 100); 
      }, 500); 
    } else {
      setViewMode(mode);
      if(defaultAngle) {
        setActiveAngle(defaultAngle);
        setCameraTrigger(Date.now());
      }
    }
  };

  return {
    dragUI,
    zoomConfig, setZoomConfig,
    isDraggingUI, setIsDraggingUI,
    isPhotoZoomed, setIsPhotoZoomed,
    isFullscreen,
    toggleFullscreen,
    handleGalleryNavigation,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleStaticClick,
    handleAngleSelect,
    handleViewChange
  };
}