import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Currency = 'EUR' | 'GBP';

interface CurrencyContextValue {
  currency: Currency;
  rate: number;
  toggleCurrency: () => void;
  convertPrice: (eurPrice: number | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const FALLBACK_RATE = 0.86;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(
    () => (localStorage.getItem('currency') as Currency) || 'EUR'
  );
  const [rate, setRate] = useState<number>(FALLBACK_RATE);

  useEffect(() => {
    if (currency !== 'GBP') return;
    fetch('https://api.frankfurter.app/latest?from=EUR&to=GBP')
      .then(r => r.json())
      .then((data: { rates?: { GBP?: number } }) => {
        if (data?.rates?.GBP) setRate(data.rates.GBP);
      })
      .catch(() => {/* usa fallback */});
  }, [currency]);

  const toggleCurrency = () => {
    const next: Currency = currency === 'EUR' ? 'GBP' : 'EUR';
    setCurrency(next);
    localStorage.setItem('currency', next);
  };

  const convertPrice = (eurPrice: number | null | undefined): string => {
    if (!eurPrice && eurPrice !== 0) return '';
    if (currency === 'GBP') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(Math.round(eurPrice * rate));
    }
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(eurPrice);
  };

  return (
    <CurrencyContext.Provider value={{ currency, rate, toggleCurrency, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
