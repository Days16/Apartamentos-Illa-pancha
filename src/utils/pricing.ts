export interface PricingInput {
  pricePerNight: number;
  nights: number;
  discountPct?: number;
  taxPct?: number;
  extraNightSupplement?: number;
  depositPct?: number;
}

export interface SeasonPriceLike {
  start_date: string;
  end_date: string;
  price: number;
  type?: string | null;
}

export interface PricingResult {
  subtotal: number;
  discountAmount: number;
  subtotalWithDiscount: number;
  extra: number;
  subtotalWithExtras: number;
  taxes: number;
  total: number;
  deposit: number;
}

export function calculateBookingPrice(input: PricingInput): PricingResult {
  const {
    pricePerNight,
    nights,
    discountPct = 0,
    taxPct = 10,
    extraNightSupplement = 0,
    depositPct = 50,
  } = input;

  const subtotal = pricePerNight * nights;
  const discountAmount = discountPct > 0 ? subtotal * (discountPct / 100) : 0;
  const subtotalWithDiscount = subtotal - discountAmount;
  const extra = extraNightSupplement * nights;
  const subtotalWithExtras = subtotalWithDiscount + extra;
  const taxes = subtotalWithExtras * (taxPct / 100);
  const total = subtotalWithExtras + taxes;
  const deposit = total * (depositPct / 100);

  return {
    subtotal,
    discountAmount,
    subtotalWithDiscount,
    extra,
    subtotalWithExtras,
    taxes,
    total,
    deposit,
  };
}

export function getEffectivePricePerNight(
  basePrice: number,
  date: string,
  seasonPrices: SeasonPriceLike[]
): number {
  const activeSeason = seasonPrices.find(
    season => date >= season.start_date && date <= season.end_date && Number(season.price) > 0
  );
  return activeSeason ? Number(activeSeason.price) : basePrice;
}

export function getNightsInRange(checkin: string, checkout: string): string[] {
  if (!checkin || !checkout) return [];
  const start = new Date(checkin + 'T00:00:00');
  const end = new Date(checkout + 'T00:00:00');
  const nights: string[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    nights.push(`${y}-${m}-${day}`);
  }
  return nights;
}
