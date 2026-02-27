import React from 'react';
import '../../styles/OrderSummary.css';

export default function OrderSummary({ extFinish, intFinish }) {
  return (
    <div className="final-summary-section">
      <div className="summary-left">
        <div className="photo-grid">
          <div className="photo-item photo-main">
            <div style={{ width: '100%', height: '100%', background: extFinish?.hex || '#fff' }}>Rendering Esterno</div>
          </div>
          <div className="photo-item photo-sub-top">
            <div style={{ width: '100%', height: '100%', background: intFinish?.hex || '#fff' }}>Interno</div>
          </div>
          <div className="photo-item photo-sub-bot">
            <div style={{ width: '100%', height: '100%', background: '#333', color: '#fff' }}>Dettaglio</div>
          </div>
        </div>
      </div>
      <div className="summary-right">
        <h2 className="brand-title" style={{ fontSize: '1.5rem' }}>Riepilogo Ordine</h2>
        <ul className="summary-list">
          <li><span className="summary-label">Modello</span><span className="summary-value">Nordic 01</span></li>
          <li><span className="summary-label">Esterno</span><span className="summary-value">{extFinish?.label}</span></li>
          <li><span className="summary-label">Interno</span><span className="summary-value">{intFinish?.label}</span></li>
        </ul>
        <div className="total-price-box">
          <span>Totale</span><span>€ 2.450,00</span>
        </div>
        <button className="action-btn">Conferma e Procedi</button>
      </div>
    </div>
  );
}