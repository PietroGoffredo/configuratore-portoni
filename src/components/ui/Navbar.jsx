import React, { useState } from 'react';
import '../../styles/Navbar.css';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); 

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

  return (
    <nav className="navbar">
      {/* 1. LOGO */}
      <div className="navbar-logo" onClick={() => goTo('https://www.fiorebanisteria.com/')}>
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

        {/* ARREDAMENTO - RICHIESTA 2: URL AGGIORNATO */}
        <li className={`nav-item ${activeDropdown === 'arredamento' ? 'open' : ''}`}>
          {/* Container diviso */}
          <div className="nav-link has-dropdown split-view">
             {/* Parte Sinistra: Link al sito */}
             <a 
               href="https://www.fiorebanisteria.com/arredamento/" 
               className="split-view-text"
             >
                Arredamento
             </a>
             
             {/* Parte Destra: Freccia Toggle separata */}
             <div 
                className="arrow-toggle" 
                onClick={(e) => {
                  e.stopPropagation(); // Evita click indesiderati
                  handleDropdownClick('arredamento');
                }}
             >
             </div>
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

        <li className="nav-item">
          <a href="https://www.fiorebanisteria.com/" className="nav-link">Login</a>
        </li>

        {/* LINGUA - RICHIESTA 4: RIMOSSO STYLE INLINE */}
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
  );
}