import React, { useState, useEffect } from 'react';
import '../../styles/ScrollToTop.css';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const toggleVisibility = () => {
      // PUNTO 1: Compare "poco dopo" (es. 100px invece di 300px)
      if (scrollContainer.scrollTop > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    scrollContainer.addEventListener('scroll', toggleVisibility);
    return () => scrollContainer.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const start = scrollContainer.scrollTop;
    const startTime = performance.now();
    const duration = 1000; // 0.6 secondi esatti

    // Funzione Easing (Ease In Out Cubic) per fluidità morbida
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    };

    const animateScroll = (currentTime) => {
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1); // Da 0 a 1
      const ease = easeInOutCubic(progress); // Applica la curva fluida

      // Muovi lo scroll
      scrollContainer.scrollTop = start * (1 - ease);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <button 
      className={`scroll-to-top ${isVisible ? 'visible' : ''}`} 
      onClick={scrollToTop}
      aria-label="Torna su"
    >
      <svg viewBox="0 0 24 24">
        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path>
      </svg>
    </button>
  );
}