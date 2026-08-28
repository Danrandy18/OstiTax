/** Montos en céntimos (EUR) para evitar errores de coma flotante. */
export type Cents = number;

export function eurosToCents(euros: number): Cents {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: Cents): number {
  return cents / 100;
}

export function roundCents(value: number): Cents {
  return Math.round(value);
}

export function assertCents(value: number): Cents {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid monetary value');
  }
  return Math.round(value);
}
