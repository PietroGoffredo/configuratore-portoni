// src/components/ui/ProfileDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { jsPDF } from 'jspdf';
import { 
  TbUser, TbBuildingStore, TbMail, TbLogout, 
  TbLock, TbDownload, TbTrash, TbFileText, 
  TbEye, TbCalendar, TbPlus, TbSettings, TbArrowLeft, TbAlertTriangle, TbCheck, TbX, TbInfoCircle
} from "react-icons/tb";
import '../../styles/ProfileDashboard.css';

// --- REGOLE DI VALIDAZIONE ---
const validatePhone = (phone) => /^(\+39|0039)?\s?3\d{2}\s?\d{6,7}$|^0\d{1,3}\s?\d{5,7}$/.test(phone.replace(/\s/g, ''));
const validateCAP = (cap) => /^\d{5}$/.test(cap);

export default function ProfileDashboard({ onLogout, onNewConfig }) {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- STATI DI NAVIGAZIONE CON ANIMAZIONI ---
  // Fasi possibili: 'dashboard-enter' | 'dashboard-leave' | 'settings-enter' | 'settings-leave'
  const [viewPhase, setViewPhase] = useState('dashboard-enter'); 
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null); 
  const [notification, setNotification] = useState(null);

  // --- STATI FORM MODIFICA ---
  const [editData, setEditData] = useState({
    first_name: '', last_name: '', company_name: '', phone: '', postal_code: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    fetchUserDataAndDocuments();
  }, []);

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUserDataAndDocuments = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(user);
      resetEditForm(user); // Inizializza i dati form con i dati reali

      const { data: configs, error: dbError } = await supabase
        .from('configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setDocuments(configs || []);
    } catch (err) {
      console.error("Errore nel caricamento:", err);
      setError("Impossibile caricare i dati. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
  };

  // --- LOGICA TRANSIZIONI E RESET (Indipendenza delle schermate) ---
  const resetEditForm = (currentUser) => {
    if (!currentUser) return;
    setEditData({
      first_name: currentUser.user_metadata.first_name || '',
      last_name: currentUser.user_metadata.last_name || '',
      company_name: currentUser.user_metadata.company_name || '',
      phone: currentUser.user_metadata.phone || '',
      postal_code: currentUser.user_metadata.postal_code || ''
    });
    setSaveMessage(null);
  };

  const handleOpenSettings = () => {
    setViewPhase('dashboard-leave'); // Lancia l'animazione di uscita
    setTimeout(() => {
      resetEditForm(user); // Pulisce i dati "sporchi"
      setViewPhase('settings-enter'); // Lancia l'animazione in entrata delle impostazioni
    }, 250); // 250ms corrisponde alla durata dell'animazione CSS
  };

  const handleCloseSettings = () => {
    setViewPhase('settings-leave'); // Animazione uscita impostazioni
    setTimeout(() => {
      setViewPhase('dashboard-enter'); // Animazione rientro dashboard
    }, 250);
  };

  // --- LOGICA SALVATAGGIO PROFILO ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveMessage(null);
    
    if (!editData.company_name || !editData.first_name || !editData.last_name || !editData.phone || !editData.postal_code) {
      setSaveMessage({ type: 'error', text: "Tutti i campi sono obbligatori." });
      return;
    }
    if (!validateCAP(editData.postal_code)) {
      setSaveMessage({ type: 'error', text: "Inserisci un CAP valido composto da 5 cifre." });
      return;
    }
    if (!validatePhone(editData.phone)) {
      setSaveMessage({ type: 'error', text: "Il formato del numero di telefono non è valido." });
      return;
    }

    setIsSavingProfile(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: editData
      });
      if (error) throw error;
      
      setUser(data.user);
      setSaveMessage({ type: 'success', text: 'Dati aziendali aggiornati con successo.' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      console.error("Errore salvataggio:", err);
      setSaveMessage({ type: 'error', text: 'Errore durante il salvataggio. Riprova.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- LOGICA DOCUMENTI ---
  const handleViewPdf = (docId) => showNotification("info", "Funzione di visualizzazione PDF in fase di integrazione.");
  const handleDownloadPdf = (docId) => showNotification("info", "Generazione del download in fase di integrazione.");
  
  const requestDeleteDocument = (docId) => setDocToDelete(docId);

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      const { error } = await supabase.from('configurations').delete().eq('id', docToDelete);
      if (error) throw error;
      
      setDocuments(prev => prev.filter(doc => doc.id !== docToDelete));
      showNotification("success", "Preventivo eliminato definitivamente.");
    } catch (err) {
      showNotification("error", "Errore durante l'eliminazione del documento.");
    } finally {
      setDocToDelete(null);
    }
  };

  // --- LOGICA ESPORTAZIONE DATI IN PDF ---
  const handleExportDataPDF = () => {
    try {
      const doc = new jsPDF();
      const meta = user.user_metadata;
      let y = 20;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Dati account - Fiore Ebanisteria", 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data di esportazione: ${new Date().toLocaleDateString('it-IT')}`, 20, y);
      y += 15;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Profilo aziendale", 20, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Ragione sociale: ${meta.company_name || 'Non specificata'}`, 20, y); y += 6;
      doc.text(`Referente: ${meta.first_name || ''} ${meta.last_name || ''}`, 20, y); y += 6;
      doc.text(`Email: ${user.email}`, 20, y); y += 6;
      doc.text(`Telefono: ${meta.phone || 'Non specificato'}`, 20, y); y += 6;
      doc.text(`CAP: ${meta.postal_code || 'Non specificato'}`, 20, y); y += 15;
      
      doc.setFont("helvetica", "bold");
      doc.text("Storico configurazioni archiviate", 20, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      if (documents.length > 0) {
        documents.forEach((d, idx) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`${idx + 1}. Rif: ${d.id.substring(0, 8).toUpperCase()} - Modello: ${d.model_name || 'Nordic 01'} - Creato il: ${new Date(d.created_at).toLocaleDateString('it-IT')}`, 20, y);
          y += 6;
        });
      } else {
        doc.text("Nessuna configurazione archiviata al momento.", 20, y);
      }
      
      doc.save(`Esportazione_Dati_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification("success", "Download dei dati completato con successo.");
    } catch(err) {
      showNotification("error", "Impossibile generare il PDF al momento.");
    }
  };

  const confirmAccountDeletion = () => {
    setIsDeleteModalOpen(false);
    window.location.href = `mailto:info@fiorebanisteria.com?subject=Richiesta Chiusura Account&body=Con la presente richiedo la chiusura definitiva del mio account aziendale associato all'email: ${user.email}. Sono consapevole della perdita di tutti i preventivi archiviati.`;
  };

  if (loading) {
    return (
      <div className="dashboard-container center-state">
        <div className="spinner"></div>
        <p className="loading-text">Accesso all'area riservata in corso...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container center-state unauth-state">
        <TbLock size={64} className="unauth-icon" />
        <h2 className="brand-title">Area riservata</h2>
        <p>Effettua il login per accedere al tuo archivio preventivi e ai dati aziendali.</p>
      </div>
    );
  }

  const meta = user.user_metadata;

  return (
    <div className="dashboard-container">
      
      {notification && (
        <div className={`global-notification ${notification.type}`}>
          {notification.type === 'success' && <TbCheck size={20} />}
          {notification.type === 'error' && <TbAlertTriangle size={20} />}
          {notification.type === 'info' && <TbInfoCircle size={20} />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-text-block">
          <h1 className="brand-title dashboard-main-title">
            {meta.company_name || 'Azienda partner'}
          </h1>
          <p className="dashboard-subtitle">Bentornato, {meta.first_name} {meta.last_name}</p>
        </div>
      </div>

      {/* RENDER CONDIZIONALE PER ANIMAZIONI (DASHBOARD O SETTINGS) */}
      {(viewPhase === 'dashboard-enter' || viewPhase === 'dashboard-leave') && (
        
        <div className={`dashboard-grid ${viewPhase}`}>
          
          <div className="dashboard-sidebar">
            <div className="dashboard-card profile-card">
              <h3 className="card-title">Riepilogo azienda</h3>
              <div className="info-list">
                <div className="info-row">
                  <div className="info-icon-box"><TbBuildingStore size={22} /></div>
                  <div className="info-content">
                    <span className="info-label">Ragione sociale</span>
                    <span className="info-value">{meta.company_name}</span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon-box"><TbMail size={22} /></div>
                  <div className="info-content">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                </div>
              </div>
              <button 
                className="btn-open-settings" 
                onClick={handleOpenSettings}
              >
                <TbSettings size={18} /> Gestisci account e dati
              </button>
            </div>
            
            <button className="btn-logout-sidebar" onClick={handleSignOut}>
              <TbLogout size={18} /> Esci dall'account
            </button>
          </div>

          <div className="dashboard-main">
            <div className="dashboard-card document-card">
              <div className="document-header-row">
                <h3 className="card-title">Archivio configurazioni</h3>
                <span className="document-count">{documents.length} Elementi</span>
              </div>
              
              {error && <div className="error-banner"><TbAlertTriangle size={18} /> {error}</div>}

              {documents.length === 0 ? (
                <div className="empty-state-box">
                  <div className="empty-icon-wrapper"><TbFileText size={48} /></div>
                  <h4>Nessuna configurazione salvata</h4>
                  <p>Non hai ancora salvato nulla nel tuo archivio.</p>
                  <button className="btn-new-config" onClick={() => { if(onNewConfig) onNewConfig(); else window.location.reload(); }}>
                    <TbPlus size={18} /> Nuova configurazione
                  </button>
                </div>
              ) : (
                <div className="document-list">
                  {documents.map((doc) => (
                    <div key={doc.id} className="document-row">
                      <div className="doc-icon"><TbFileText size={28} /></div>
                      <div className="doc-info">
                        <div className="doc-title-group">
                          <span className="doc-title">Preventivo {doc.model_name || 'Nordic 01'}</span>
                          <span className="doc-status status-saved">Salvato</span>
                        </div>
                        <div className="doc-meta">
                          <span className="doc-id">Rif: {doc.id.substring(0, 8).toUpperCase()}</span>
                          <span className="doc-date"><TbCalendar size={14} />{new Date(doc.created_at).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                      <div className="doc-actions">
                        <button className="doc-btn btn-view" onClick={() => handleViewPdf(doc.id)} title="Visualizza"><TbEye size={20} /></button>
                        <button className="doc-btn btn-download" onClick={() => handleDownloadPdf(doc.id)} title="Scarica PDF"><TbDownload size={20} /></button>
                        <button className="doc-btn btn-delete" onClick={() => requestDeleteDocument(doc.id)} title="Elimina"><TbTrash size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(viewPhase === 'settings-enter' || viewPhase === 'settings-leave') && (

        <div className={`settings-view-container ${viewPhase}`}>
          
          <div className="settings-header-wrapper">
            <button className="btn-back-dashboard" onClick={handleCloseSettings}>
              <TbArrowLeft size={20} /> Torna indietro
            </button>
          </div>

          <div className="settings-grid">
            
            <div className="dashboard-card form-card">
              <h3 className="card-title">Modifica i tuoi dati</h3>
              <p className="card-description">Aggiorna le informazioni di contatto. L'email associata all'account non può essere modificata per ragioni di sicurezza.</p>
              
              {saveMessage && (
                <div className={`status-message ${saveMessage.type}`}>
                  {saveMessage.type === 'success' && <TbCheck size={18} />}
                  {saveMessage.type === 'error' && <TbAlertTriangle size={18} />}
                  {saveMessage.text}
                </div>
              )}

              <form className="edit-profile-form" onSubmit={handleSaveProfile}>
                <div className="input-group">
                  <label>Ragione sociale</label>
                  <input type="text" value={editData.company_name} onChange={e => setEditData({...editData, company_name: e.target.value})} />
                </div>
                
                <div className="form-row">
                  <div className="input-group">
                    <label>Nome</label>
                    <input type="text" value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Cognome</label>
                    <input type="text" value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Telefono</label>
                    <input type="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>CAP</label>
                    <input type="text" value={editData.postal_code} onChange={e => setEditData({...editData, postal_code: e.target.value.replace(/\D/g, '')})} maxLength="5" />
                  </div>
                </div>

                <div className="input-group disabled-group">
                  <label>Email</label>
                  <input type="email" value={user.email} disabled />
                </div>

                <div className="form-actions-main">
                  <button type="submit" className="btn-save-main" disabled={isSavingProfile}>
                    {isSavingProfile ? <div className="spinner spinner-sm"></div> : <><TbCheck size={18} /> Salva modifiche</>}
                  </button>
                </div>
              </form>
            </div>

            <div className="dashboard-card danger-card">
              <h3 className="card-title">Dati e sicurezza</h3>
              
              <div className="action-block">
                <div className="action-info">
                  <h4>Esporta i tuoi dati</h4>
                  <p>Scarica una copia PDF con i dati del tuo account e dello storico delle configurazioni.</p>
                </div>
                <button className="btn-secondary-outline" onClick={handleExportDataPDF}>
                  <TbDownload size={18} /> Scarica dati
                </button>
              </div>

              <div className="action-block danger-zone">
                <div className="action-info">
                  <h4>Chiudi account</h4>
                  <p>L'eliminazione dell'account è un'operazione irreversibile e comporterà la perdita dei dati.</p>
                </div>
                <button className="btn-danger-outline" onClick={() => setIsDeleteModalOpen(true)}>
                  <TbTrash size={18} /> Elimina account
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODALE ELIMINAZIONE ACCOUNT --- */}
      {isDeleteModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <button className="modal-close-btn" onClick={() => setIsDeleteModalOpen(false)}><TbX size={24} /></button>
            
            <div className="modal-icon-warning">
              <TbAlertTriangle size={48} />
            </div>
            
            <h2 className="modal-title">Sei sicuro di voler chiudere l'account?</h2>
            
            <div className="modal-body-text">
              <p>Questa operazione non può essere annullata. Richiedendo la chiusura dell'account perderai immediatamente l'accesso a:</p>
              <ul className="retention-list">
                <li>Tutto il tuo <strong>archivio storico</strong> di configurazioni e preventivi.</li>
                <li>Le <strong>scontistiche dedicate</strong> a te riservate sui prodotti Fiore Ebanisteria.</li>
                <li>Il supporto diretto e la priorità sulle nuove collezioni.</li>
              </ul>
              <p className="modal-hint">Se hai solo bisogno di aggiornare l'email, ti consigliamo di contattare l'assistenza invece di eliminare l'account.</p>
            </div>

            <div className="modal-footer-actions">
              <button className="btn-cancel-modal" onClick={() => setIsDeleteModalOpen(false)}>
                Annulla e mantieni account
              </button>
              <button className="btn-confirm-delete" onClick={confirmAccountDeletion}>
                Sì, procedi con l'eliminazione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE ELIMINAZIONE SINGOLO DOCUMENTO --- */}
      {docToDelete && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content document-delete-modal">
            <button className="modal-close-btn" onClick={() => setDocToDelete(null)}><TbX size={24} /></button>
            
            <div className="modal-icon-warning danger-icon">
              <TbTrash size={48} />
            </div>
            
            <h2 className="modal-title">Eliminare il preventivo?</h2>
            
            <div className="modal-body-text" style={{ textAlign: 'center' }}>
              <p>Stai per eliminare definitivamente questa configurazione dall'archivio.</p>
              <p>L'azione è irreversibile. Procedere?</p>
            </div>

            <div className="modal-footer-actions row-actions">
              <button className="btn-cancel-modal outline" onClick={() => setDocToDelete(null)}>
                Annulla
              </button>
              <button className="btn-confirm-delete red-solid" onClick={confirmDeleteDocument}>
                Sì, elimina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}