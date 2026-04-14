import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

export function useAuthHandler() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authExternalMessage, setAuthExternalMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const handleUrlParams = async () => {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      // CASO A: Conferma Registrazione
      if (hash.includes('type=signup') || queryParams.get('verified') === 'true') {
        setTimeout(async () => {
          await supabase.auth.signOut(); 
          setAuthExternalMessage({ 
            type: 'success', 
            text: 'Account attivato con successo! Inserisci le tue credenziali per accedere.' 
          });
          setIsAuthModalOpen(true);
          window.history.replaceState(null, '', window.location.pathname);
        }, 500);
      }
      // CASO B: Reset Password
      else if (hash.includes('type=recovery')) {
        setAuthExternalMessage({ 
          type: 'success', 
          text: 'Inserisci la tua nuova password.' 
        });
        sessionStorage.setItem('force_password_update', 'true');
        setIsAuthModalOpen(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
      // CASO C: Errore generico
      else if (hashParams.get('error')) {
        const errorDescription = hashParams.get('error_description') || 'Il link fornito è invalido o scaduto.';
        setAuthExternalMessage({ 
          type: 'error', 
          text: `Attenzione: ${errorDescription.replace(/\+/g, ' ')}` 
        });
        setIsAuthModalOpen(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleUrlParams();
  }, []);

  return {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authExternalMessage,
    setAuthExternalMessage
  };
}