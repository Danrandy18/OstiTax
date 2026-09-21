import { GWG_LIMIT_EUR, parseReceipt, toAmount } from './receipt-parser';

const SUPERMARKET = `
BILLA AG
Filiale 1234 Wien
UID ATU12345678
Datum: 12.09.2026 17:42
Vollkornbrot            2,49
Milch 1L                1,29
Kaffee                  5,99
SUMME                   9,77
BAR                    10,00
Rückgeld                0,23
MwSt 10%   0,89   Netto 8,88
Bon-Nr. 004512
`;

const LAPTOP_INVOICE = `
MediaMarkt Handels GmbH
Landstraßer Hauptstraße 1, 1030 Wien
RECHNUNG
Rechnungsnummer: RE-2026-004711
Rechnungsdatum: 03.03.2026
1 x Notebook 15 Zoll        1.299,00
Zwischensumme               1.082,50
20% USt                       216,50
Gesamtbetrag EUR            1.299,00
`;

const TRAIN_TICKET = `
ÖBB Personenverkehr AG
Fahrkarte Wien Hbf - Graz Hbf
Datum 21.06.2026
Preis inkl. 10% USt         27,90
Zu zahlen                   27,90
`;

const PLUMBER = `
Installateur Huber e.U.
Rechnung Nr. 2026/118
Datum: 2026-05-14
Reparatur Wasserhahn, Arbeitszeit 2 Std.  130,00
Materialkosten                            40,00
Gesamtsumme brutto                       204,00
enthaltene USt 20%                        34,00
`;

const SEMINAR = `
WIFI Steiermark
Seminarbeitrag Excel Fortbildung
Beleg-Nr.: 778899
Datum: 15.10.2026
Summe: 189,00 EUR
`;

describe('toAmount', () => {
  it('lee formatos europeos y con punto', () => {
    expect(toAmount('1.234,56')).toBe(1234.56);
    expect(toAmount('23,45')).toBe(23.45);
    expect(toAmount('23.45')).toBe(23.45);
    expect(toAmount('1.299,00')).toBe(1299);
  });
});

describe('parseReceipt — supermercado', () => {
  const r = parseReceipt(SUPERMARKET);

  it('lee el comercio, la fecha y el numero de bon', () => {
    expect(r.merchant.value).toBe('BILLA AG');
    expect(r.date.value).toBe('2026-09-12');
    expect(r.documentNumber.value).toBe('004512');
  });

  it('toma el total y no el efectivo ni el cambio', () => {
    expect(r.total.value).toBe(9.77);
    expect(r.total.evidence).toContain('SUMME');
  });

  it('calcula el IVA del 10 %', () => {
    expect(r.vat.rate).toBe(10);
    expect(r.vat.amount).toBe(0.89);
    expect(r.vat.net).toBe(8.88);
  });

  it('no lo clasifica en una categoria fiscal', () => {
    expect(r.category).toBe('other');
    expect(r.depreciation).toBe(false);
  });
});

describe('parseReceipt — factura de un portatil', () => {
  const r = parseReceipt(LAPTOP_INVOICE);

  it('lee numero de factura, fecha, comercio y total', () => {
    expect(r.documentNumber.value).toBe('RE-2026-004711');
    expect(r.date.value).toBe('2026-03-03');
    expect(r.merchant.value).toBe('MediaMarkt Handels GmbH');
    expect(r.total.value).toBe(1299);
  });

  it('usa el total y no la suma intermedia', () => {
    expect(r.total.evidence).toContain('Gesamtbetrag');
  });

  it('IVA del 20 % con la cuota impresa', () => {
    expect(r.vat.rate).toBe(20);
    expect(r.vat.amount).toBe(216.5);
    expect(r.vat.net).toBe(1082.5);
  });

  it('material de trabajo por encima de 1.000 EUR: se marca para amortizar (GWG)', () => {
    expect(r.category).toBe('workEquipment');
    expect(r.depreciation).toBe(true);
    expect(r.gwgLimit).toBe(GWG_LIMIT_EUR);
  });
});

describe('parseReceipt — otras categorias', () => {
  it('billete de tren: gastos de viaje, IVA 10 %', () => {
    const r = parseReceipt(TRAIN_TICKET);
    expect(r.category).toBe('travel');
    expect(r.total.value).toBe(27.9);
    expect(r.vat.rate).toBe(10);
    expect(r.date.value).toBe('2026-06-21');
  });

  it('factura de un instalador: servicios del hogar, fecha ISO y cuota impresa', () => {
    const r = parseReceipt(PLUMBER);
    expect(r.category).toBe('homeServices');
    expect(r.date.value).toBe('2026-05-14');
    expect(r.documentNumber.value).toBe('2026/118');
    expect(r.total.value).toBe(204);
    expect(r.vat.rate).toBe(20);
    expect(r.vat.amount).toBe(34);
    expect(r.depreciation).toBe(false);
  });

  it('seminario: formacion', () => {
    const r = parseReceipt(SEMINAR);
    expect(r.category).toBe('training');
    expect(r.total.value).toBe(189);
    expect(r.documentNumber.value).toBe('778899');
  });

  it('un gasto de material por debajo de 1.000 EUR no se amortiza', () => {
    const r = parseReceipt(
      'Conrad Electronic\nUSB Headset\nSumme 89,90\n20% USt 14,98',
    );
    expect(r.category).toBe('workEquipment');
    expect(r.depreciation).toBe(false);
  });
});

describe('parseReceipt — casos limite', () => {
  it('varios tipos de IVA: avisa y no inventa la cuota', () => {
    const r = parseReceipt(
      'Spar Filiale\nDatum 01.02.2026\nA 10% USt 1,20\nB 20% USt 2,40\nSumme 30,00',
    );
    expect(r.vat.rates).toEqual([20, 10]);
    expect(r.vat.amount).toBeNull();
    expect(r.warnings).toContain('vat_mixed_rates');
  });

  it('ignora un 10 % de descuento como si fuera IVA', () => {
    const r = parseReceipt('Shop GmbH\n10% Rabatt -2,00\nSumme 18,00');
    expect(r.vat.rate).toBeNull();
    expect(r.warnings).toContain('vat_missing');
  });

  it('rechaza fechas imposibles', () => {
    const r = parseReceipt('Laden\nDatum 31.02.2026\nSumme 5,00');
    expect(r.date.value).toBeNull();
    expect(r.warnings).toContain('date_missing');
  });

  it('acepta el ano de dos cifras', () => {
    const r = parseReceipt('Laden\nDatum 05.11.26\nSumme 5,00');
    expect(r.date.value).toBe('2026-11-05');
  });

  it('texto ilegible: todo vacio, categoria other y avisos', () => {
    const r = parseReceipt('#### ~~ ¿¿ ;;');
    expect(r.total.value).toBeNull();
    expect(r.date.value).toBeNull();
    expect(r.category).toBe('other');
    expect(r.warnings).toEqual(
      expect.arrayContaining(['total_missing', 'date_missing']),
    );
  });

  it('sin palabra de total usa el mayor importe y avisa de que es una suposicion', () => {
    const r = parseReceipt('Kiosk\nZeitung 2,50\nKaffee 3,80');
    expect(r.total.value).toBe(3.8);
    expect(r.warnings).toContain('total_guessed');
  });

  it('no confunde una fecha con un importe', () => {
    const r = parseReceipt('Laden\n12.09.2026\nSumme 7,50');
    expect(r.total.value).toBe(7.5);
  });
});
