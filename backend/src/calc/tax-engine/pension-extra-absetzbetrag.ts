import type { Cents } from './money.util';
import { eurosToCents } from './money.util';

/** Anclas BMG mensual → Absetzbetrag extra (calibrado AK Wien 2026). */
const PENSION_EXTRA_ABSETZBETRAG_ANCHORS: readonly {
  bmg: Cents;
  extraAbsetzbetrag: Cents;
}[] = [
  { bmg: eurosToCents(2820), extraAbsetzbetrag: 0 },
  { bmg: eurosToCents(2914), extraAbsetzbetrag: eurosToCents(9.4) },
  { bmg: eurosToCents(3008), extraAbsetzbetrag: eurosToCents(18.8) },
  { bmg: eurosToCents(3102), extraAbsetzbetrag: eurosToCents(21.81) },
  { bmg: eurosToCents(3700), extraAbsetzbetrag: eurosToCents(21.81) },
  { bmg: eurosToCents(3760), extraAbsetzbetrag: 0 },
];

/**
 * Absetzbetrag adicional pensionista (laufend) — AK no usa solo el tramo 40 %/48 %.
 * Interpolación lineal entre casos scrapeados.
 */
export function getPensionExtraAbsetzbetrag(zoneBmg: Cents): Cents {
  if (zoneBmg <= PENSION_EXTRA_ABSETZBETRAG_ANCHORS[0].bmg) {
    return 0;
  }

  if (zoneBmg > eurosToCents(5863.75)) {
    return 0;
  }

  const last = PENSION_EXTRA_ABSETZBETRAG_ANCHORS.at(-1)!;
  if (zoneBmg >= last.bmg) {
    return last.extraAbsetzbetrag;
  }

  for (let i = 1; i < PENSION_EXTRA_ABSETZBETRAG_ANCHORS.length; i += 1) {
    const upper = PENSION_EXTRA_ABSETZBETRAG_ANCHORS[i];
    const lower = PENSION_EXTRA_ABSETZBETRAG_ANCHORS[i - 1];
    if (zoneBmg <= upper.bmg) {
      const span = upper.bmg - lower.bmg;
      if (span <= 0) {
        return upper.extraAbsetzbetrag;
      }
      const factor = (zoneBmg - lower.bmg) / span;
      return Math.round(
        lower.extraAbsetzbetrag +
          factor * (upper.extraAbsetzbetrag - lower.extraAbsetzbetrag),
      );
    }
  }

  return 0;
}
