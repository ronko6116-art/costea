// src/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initSession = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    } catch (err) {
      console.error('Error al recuperar sesión:', err);
      setError('No se pudo recuperar la sesión. Es posible que necesites iniciar sesión de nuevo.');
      try {
        // Limpiar localStorage corrupto para evitar el bucle
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (cleanupErr) {
        console.error('No se pudo limpiar localStorage:', cleanupErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Timeout de seguridad: si getSession tarda más de 8s, desbloquear loading
    const timeoutId = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('Timeout recuperando sesión, forzando fin de carga');
          setError('La recuperación de sesión está tardando demasiado. Intenta de nuevo.');
          return false;
        }
        return prev;
      });
    }, 8000);

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      setError(null);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [initSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setError(null);
  };

  const retry = () => {
    initSession();
  };

  const value = {
    session,
    loading,
    error,
    signOut,
    retry,
    user: session?.user ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}