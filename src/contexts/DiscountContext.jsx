import { createContext, useContext, useState, useEffect } from 'react';

const DiscountContext = createContext();

export function DiscountProvider({ children }) {
    const [activeDiscount, setActiveDiscount] = useState(null);

    // Load from session storage if exists
    useEffect(() => {
        const saved = sessionStorage.getItem('active_discount');
        if (saved) {
            try {
                setActiveDiscount(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing saved discount:', e);
            }
        }
    }, []);

    const applyDiscount = (offer) => {
        setActiveDiscount(offer);
        sessionStorage.setItem('active_discount', JSON.stringify(offer));
    };

    const removeDiscount = () => {
        setActiveDiscount(null);
        sessionStorage.removeItem('active_discount');
    };

    return (
        <DiscountContext.Provider value={{ activeDiscount, applyDiscount, removeDiscount }}>
            {children}
        </DiscountContext.Provider>
    );
}

export function useDiscount() {
    const context = useContext(DiscountContext);
    if (!context) {
        throw new Error('useDiscount must be used within a DiscountProvider');
    }
    return context;
}
