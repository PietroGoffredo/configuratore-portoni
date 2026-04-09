import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  TbUser, 
  TbBuildingStore, 
  TbMail, 
  TbDoor, 
  TbCalendar, 
  TbLogout, 
  TbFileDownload 
} from "react-icons/tb";
import '../../styles/ProfileDashboard.css';

export default function ProfileDashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserDataAndConfigs();
  }, []);

  const fetchUserDataAndConfigs = async () => {
    try {
      setLoading(true);
      
      // 1. Recuperiamo l'utente attivo
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(user);

      // 2. Recuperiamo lo storico delle configurazioni
      // La regola RLS su Supabase garantisce che scaricherà SOLO le sue
      const { data: configs, error: dbError } = await supabase
        .from('configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      
      setConfigurations(configs || []);

    } catch (err) {
      console.error("Errore nel caricamento della dashboard:", err);
      setError("Impossibile caricare i dati del profilo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
  };

  // --- STATO 1: CARICAMENTO IN CORSO ---
  if (loading) {
    return (
      <div className="dashboard-container loading-state">
        <div className="spinner"></div>
        <p>Caricamento Area Riservata...</p>
      </div>
    );
  }

  // --- STATO 2: NON AUTENTICATO ---
  if (!user) {
    return (
      <div className="dashboard-container unauth-state">
        <TbUser size={64} className="unauth-icon" />
        <h2 className="brand-title">Accesso Richiesto</h2>
        <p>Questa è un'area riservata ai rivenditori Fiore Ebanisteria.</p>
        <p>Effettua il login tramite la barra di navigazione per visualizzare le tue configurazioni salvate.</p>
      </div>
    );
  }

  // --- STATO 3: AUTENTICATO (DASHBOARD) ---
  const meta = user.user_metadata;

  return (
    <div className="dashboard-container">
      
      {/* HEADER DASHBOARD */}
      <div className="dashboard-header">
        <div>
          <h1 className="brand-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            Benvenuto, {meta.first_name || 'Rivenditore'}
          </h1>
          <p className="dashboard-subtitle">Gestisci il tuo profilo e lo storico dei tuoi preventivi.</p>
        </div>
        <button className="action-btn btn-secondary logout-btn" onClick={handleSignOut}>
          <TbLogout size={20} />
          Esci dal Profilo
        </button>
      </div>

      <div className="dashboard-grid">
        
        {/* COLONNA SINISTRA: DATI UTENTE */}
        <div className="dashboard-sidebar">
          <div className="profile-card">
            <h3 className="card-title">I Tuoi Dati</h3>
            
            <div className="profile-info-row">
              <TbUser className="info-icon" />
              <div>
                <span className="info-label">Nome Completo</span>
                <span className="info-value">{meta.first_name} {meta.last_name}</span>
              </div>
            </div>

            <div className="profile-info-row">
              <TbBuildingStore className="info-icon" />
              <div>
                <span className="info-label">Azienda</span>
                <span className="info-value">{meta.company_name || 'Non specificata'}</span>
              </div>
            </div>

            <div className="profile-info-row">
              <TbMail className="info-icon" />
              <div>
                <span className="info-label">Email di Accesso</span>
                <span className="info-value">{user.email}</span>
              </div>
            </div>
            
            {/* Pulsante segnaposto per sviluppi futuri */}
            <button className="edit-profile-link">Modifica i tuoi dati</button>
          </div>
        </div>

        {/* COLONNA DESTRA: STORICO CONFIGURAZIONI */}
        <div className="dashboard-main">
          <div className="configs-card">
            <h3 className="card-title">Le Tue Configurazioni Salvate ({configurations.length})</h3>
            
            {error && <p className="error-text">{error}</p>}

            {configurations.length === 0 ? (
              <div className="empty-configs">
                <TbDoor size={48} className="empty-icon" />
                <p>Non hai ancora salvato nessuna configurazione.</p>
                <p>Torna al configuratore per creare il tuo primo portone!</p>
              </div>
            ) : (
              <div className="configs-list">
                {configurations.map((config) => (
                  <div key={config.id} className="config-list-item">
                    <div className="config-item-header">
                      <span className="config-model-name">{config.model_name}</span>
                      <span className="config-date">
                        <TbCalendar size={16} />
                        {new Date(config.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    
                    <div className="config-item-details">
                      <div className="detail-pill">
                        <span className="pill-label">Esterno:</span>
                        <span className="pill-value">{config.configuration_data?.esterno}</span>
                      </div>
                      <div className="detail-pill">
                        <span className="pill-label">Interno:</span>
                        <span className="pill-value">{config.configuration_data?.interno}</span>
                      </div>
                      <div className="detail-pill">
                        <span className="pill-label">Apertura:</span>
                        <span className="pill-value">{config.configuration_data?.apertura || 'Destra'}</span>
                      </div>
                    </div>
                    
                    <div className="config-item-actions">
                      <button className="action-btn btn-secondary config-action-btn">
                        <TbFileDownload size={18} />
                        Scarica PDF (Stima)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}