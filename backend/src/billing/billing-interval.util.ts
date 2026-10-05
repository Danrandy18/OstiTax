import type { BillingInterval } from '../auth/mail/mail-templates';

const DAY_MS = 24 * 60 * 60_000;

/**
 * Deduce el tipo de plan por la duracion del periodo facturado, sin depender de que la API
 * del proveedor incluya el precio en la linea de la factura.
 */
export function intervalFromPeriod(
  start: Date | null,
  end: Date | null,
): BillingInterval {
  if (!start || !end) return null;
  const days = (end.getTime() - start.getTime()) / DAY_MS;
  if (days >= 25 && days <= 35) return 'monthly';
  if (days >= 170 && days <= 195) return 'semiannual';
  if (days >= 350 && days <= 380) return 'yearly';
  return null;
}
