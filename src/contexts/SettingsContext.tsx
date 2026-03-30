import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { fetchSettings } from '../services/supabaseService';

interface SettingsContextValue {
  settings: Record<string, unknown>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data || {});
    } catch (err) {
      console.error('Error fetching global settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
