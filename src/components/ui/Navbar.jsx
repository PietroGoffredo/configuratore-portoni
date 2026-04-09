import React, { useState, useEffect } from 'react';
import '../../styles/Navbar.css';
import AuthModal from './AuthModal'; 
import { supabase } from '../../config/supabaseClient'; // Importiamo Supabase per controllare la sessione

export default function Navbar({ currentView, setCurrentView }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); 
  
  // --- STATI AUTENTICAZIONE ---
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null); 

  // Controllo automatico della sessione Supabase all'avvio e ai cambiamenti
  useEffect(() => {
    // Recupera la sessione iniziale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Ascolta i cambiamenti di stato (es. quando l'utente fa login dal modale o logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const goTo = (url) => {
    window.location.href = url;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileMenuOpen) setActiveDropdown(null); 
  };

  const handleDropdownClick = (section) => {
    if (window.innerWidth > 800) return;
    setActiveDropdown(activeDropdown === section ? null : section);
  };

  // --- HANDLER MODALE LOGIN ---
  const handleLoginClick = (e) => {
    e.preventDefault();
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false); // Chiude il menu su mobile
  };

  // --- HANDLER LOGOUT ---
  const handleLogout = async (e) => {
    e.preventDefault();
    await supabase.auth.signOut(); // Esegue il logout effettivo dal server Supabase
    setUser(null);
    if (setCurrentView) setCurrentView('configurator'); // Riporta al configuratore se si era nella dashboard
  };

  return (
    <>
      <nav className="navbar">
        {/* 1. LOGO */}
        <div className="navbar-logo" onClick={() => {
            if (setCurrentView) setCurrentView('configurator');
            goTo('https://www.fiorebanisteria.com/');
        }}>
          <img src="/assets/logo_fiore_ebanisteria.png" alt="Fiore Ebanisteria" />
        </div>

        {/* 2. HAMBURGER */}
        <button 
          className={`hamburger hamburger--vortex ${isMobileMenuOpen ? 'is-active' : ''}`} 
          type="button"
          onClick={toggleMobileMenu}
        >
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </button>

        {/* 3. MENU */}
        <ul className={`navbar-menu ${isMobileMenuOpen ? 'is-open' : ''}`}>
          
          <li className="nav-item">
            <a href="https://www.fiorebanisteria.com/" className="nav-link">Home</a>
          </li>

          <li className="nav-item">
            <a href="https://www.fiorebanisteria.com/chi-siamo/" className="nav-link">Chi siamo</a>
          </li>

          {/* MISSION */}
          <li className={`nav-item ${activeDropdown === 'mission' ? 'open' : ''}`} onClick={() => handleDropdownClick('mission')}>
            <span className="nav-link has-dropdown">Mission</span>
            <ul className="dropdown-menu">
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/artigianalita/" className="dropdown-link">Artigianalità</a>
              </li>
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/artigianalita/#creativita" className="dropdown-link">Creatività</a>
              </li>
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/tecnologia-ed-ingegnerizzazione/" className="dropdown-link">Ricerca e sviluppo</a>
              </li>
            </ul>
          </li>

          {/* PORTE */}
          <li className={`nav-item ${activeDropdown === 'porte' ? 'open' : ''}`} onClick={() => handleDropdownClick('porte')}>
            <span className="nav-link has-dropdown">Porte</span>
            <ul className="dropdown-menu">
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/progetti-realizzati/" className="dropdown-link">Progetti personalizzati</a>
              </li>
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/collezioni-porte/" className="dropdown-link">Rivestimenti</a>
              </li>
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/cataloghi/" className="dropdown-link">Cataloghi</a>
              </li>
            </ul>
          </li>

          {/* ARREDAMENTO - SPLIT VIEW */}
          <li className={`nav-item ${activeDropdown === 'arredamento' ? 'open' : ''}`}>
            <div className="nav-link has-dropdown split-view">
               <a 
                 href="https://www.fiorebanisteria.com/arredamento/" 
                 className="split-view-text"
               >
                 Arredamento
               </a>
               <div 
                  className="arrow-toggle" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownClick('arredamento');
                  }}
               ></div>
            </div>
            <ul className="dropdown-menu">
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/arredo-bagno/" className="dropdown-link">Arredo bagno</a>
              </li>
              <li className="dropdown-item">
                <a href="https://www.fiorebanisteria.com/arredamenti-custom/" className="dropdown-link">Arredamenti custom</a>
              </li>
            </ul>
          </li>

          <li className="nav-item">
            <a href="https://www.fiorebanisteria.com/news/" className="nav-link">News</a>
          </li>

          <li className="nav-item">
            <a href="https://www.fiorebanisteria.com/contatti/" className="nav-link">Contatti</a>
          </li>

          {/* --- AREA RISERVATA (LOGIN / PROFILO) --- */}
          <li className={`nav-item ${activeDropdown === 'account' ? 'open' : ''}`} onClick={() => handleDropdownClick('account')}>
            {!user ? (
              <a 
                href="#" 
                className="nav-link" 
                onClick={handleLoginClick} 
                style={{ fontWeight: 'bold', color: 'var(--col-gold)' }}
              >
                Area Riservata
              </a>
            ) : (
              <>
                <span className="nav-link has-dropdown" style={{ fontWeight: 'bold', color: 'var(--col-gold)' }}>
                  Il mio Profilo
                </span>
                <ul className="dropdown-menu">
                  {/* Navigazione dinamica tra le viste */}
                  {currentView === 'configurator' ? (
                    <li className="dropdown-item">
                      <a href="#" className="dropdown-link" onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); setIsMobileMenuOpen(false); }}>Le mie Configurazioni</a>
                    </li>
                  ) : (
                    <li className="dropdown-item">
                      <a href="#" className="dropdown-link" onClick={(e) => { e.preventDefault(); setCurrentView('configurator'); setIsMobileMenuOpen(false); }}>Nuovo Preventivo</a>
                    </li>
                  )}
                  <li className="dropdown-item">
                    <a href="#" className="dropdown-link" onClick={handleLogout}>Esci</a>
                  </li>
                </ul>
              </>
            )}
          </li>

          {/* LINGUA */}
          <li className={`nav-item ${activeDropdown === 'lang' ? 'open' : ''}`} onClick={() => handleDropdownClick('lang')}>
            <div className="nav-link has-dropdown">
              <img src="/assets/it.png" alt="IT" className="flag-icon" />
            </div>
            <ul className="dropdown-menu flag">
              <li className="dropdown-item">
                <a href="#" className="dropdown-link">
                  <img src="/assets/en.png" alt="EN" className="flag-icon en" />
                </a>
              </li>
            </ul>
          </li>

        </ul>
      </nav>

      {/* --- INCLUSIONE DEL MODALE --- */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        // onLoginSuccess non è più strettamente necessario perché stiamo ascoltando l'evento in useEffect, ma lo manteniamo per compatibilità e reattività immediata
        onLoginSuccess={(userData) => setUser(userData)}
      />
    </>
  );
}