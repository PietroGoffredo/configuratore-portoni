import React from 'react';
import '../../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      
      {/* 1. SEZIONE SUPERIORE */}
      <div className="footer-top">
        
        {/* Social Buttons (Sinistra) */}
        <div className="social-group">
          
          {/* Facebook */}
          <a 
            href="https://www.facebook.com/people/Fiorebanisteria/100054396344871/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn"
            data-tooltip="Facebook"
          >
            <svg viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>

          {/* Instagram (SVG Corretto per fill) */}
          <a 
            href="https://www.instagram.com/fiorebanisteria?igshid=YmMyMTA2M2Y%3D" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn"
            data-tooltip="Instagram"
          >
            <svg viewBox="0 0 24 24">
               <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

        </div>

        {/* Pulsante Contattaci (Destra) */}
        <a href="https://www.fiorebanisteria.com/contatti/" className="contact-btn">
          CONTATTACI
        </a>

      </div>

      {/* 2. SEZIONE INFERIORE */}
      <div className="footer-bottom">
        
        {/* Copyright (Sinistra) */}
        <div className="copyright-text">
          <span>FIORE FILIPPO E FIGLI© P.IVA 049823207252026| By </span>
          <a href="https://www.linkedin.com/in/pietro-goffredo-980b07386/" className="copyright-highlight">Pietro Goffredo</a>
          <span> | </span>
          <a href="https://www.fiorebanisteria.com/privacy-policy/" className="privacy-link">Privacy/Policy</a>
        </div>

        {/* Contatti Rapidi (Destra) */}
        <div className="contact-info">
          <a href="tel:0803101053" className="contact-link" style={{ marginBottom: '5px' }}>080.310.10.53</a>
          <a href="mailto:info@fiorebanisteria.com" className="contact-link">info@fiorebanisteria.com</a>
        </div>

      </div>
    </footer>
  );
}