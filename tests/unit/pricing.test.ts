import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from '../../src/utils/pricing';

describe('calculateBookingPrice', () => {
  it('calcula precio base sin descuento ni extras', () => {
    const r = calculateBookingPrice({ pricePerNight: 100, nights: 3, taxPct: 0, depositPct: 50 });
    expect(r.subtotal).toBe(300);
    expect(r.discountAmount).toBe(0);
    expect(r.total).toBe(300);
    expect(r.deposit).toBe(150);
  });

  it('aplica descuento porcentual correctamente', () => {
    const r = calculateBookingPrice({ pricePerNight: 100, nights: 2, discountPct: 10, taxPct: 0, depositPct: 100 });
    expect(r.subtotal).toBe(200);
    expect(r.discountAmount).toBe(20);
    expect(r.subtotalWithDiscount).toBe(180);
    expect(r.total).toBe(180);
    expect(r.deposit).toBe(180);
  });

  it('aplica IVA correctamente', () => {
    const r = calculateBookingPrice({ pricePerNight: 100, nights: 1, taxPct: 10, depositPct: 50 });
    expect(r.taxes).toBe(10);
    expect(r.total).toBe(110);
    expect(r.deposit).toBe(55);
  });

  it('calcula depósito parcial correctamente', () => {
    const r = calculateBookingPrice({ pricePerNight: 100, nights: 2, taxPct: 0, depositPct: 30 });
    expect(r.total).toBe(200);
    expect(r.deposit).toBe(60);
  });

  it('incluye suplemento de temporada por noche', () => {
    const r = calculateBookingPrice({
      pricePerNight: 100, nights: 2, extraNightSupplement: 20, taxPct: 0, depositPct: 50,
    });
    expect(r.extra).toBe(40);
    expect(r.subtotalWithExtras).toBe(240);
    expect(r.total).toBe(240);
  });

  it('redondea impuestos con fracciones', () => {
    const r = calculateBookingPrice({ pricePerNight: 75, nights: 1, taxPct: 10, depositPct: 50 });
    expect(r.taxes).toBe(8); // 75 * 0.10 = 7.5 → round → 8
    expect(r.total).toBe(83);
  });

  it('redondea depósito con fracciones', () => {
    const r = calculateBookingPrice({ pricePerNight: 100, nights: 1, taxPct: 0, depositPct: 33 });
    expect(r.deposit).toBe(33); // 100 * 0.33 = 33 exacto
  });

  it('resultado para 0 noches es todo cero', () => {
    const r = calculateBookingPrice({ pricePerNight: 100, nights: 0, taxPct: 10, depositPct: 50 });
    expect(r.subtotal).toBe(0);
    expect(r.total).toBe(0);
    expect(r.deposit).toBe(0);
  });

  it('descuento + IVA + suplemento combinados', () => {
    const r = calculateBookingPrice({
      pricePerNight: 100, nights: 2,
      discountPct: 10,
      extraNightSupplement: 10,
      taxPct: 10,
      depositPct: 50,
    });
    // subtotal: 200, discount: 20, subtotalWithDiscount: 180
    // extra: 20, subtotalWithExtras: 200
    // taxes: 20, total: 220, deposit: 110
    expect(r.subtotal).toBe(200);
    expect(r.discountAmount).toBe(20);
    expect(r.extra).toBe(20);
    expect(r.taxes).toBe(20);
    expect(r.total).toBe(220);
    expect(r.deposit).toBe(110);
  });
});
