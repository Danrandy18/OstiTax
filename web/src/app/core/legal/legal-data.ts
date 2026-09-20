/**
 * Datos del titular para Impressum, politica de privacidad y borrado de cuenta.
 * Un unico sitio: al cambiar de direccion o de correo basta editar este archivo.
 */
export const LEGAL = {
  owner: 'Randy Méndez Cabrera',
  tradeName: 'korevanSoftware',
  street: 'Ulmgasse 14C, 4. Stock',
  postalCode: '8053',
  city: 'Graz',
  state: 'Steiermark',
  country: 'Österreich',
  email: 'randymendezcabrera893@gmail.com',
  /** Fecha de la ultima revision de los textos legales (se muestra en cada pagina). */
  updatedAt: '2026-09-20',
  /**
   * Opcionales: se muestran en el Impressum solo si tienen valor. Un autonomo austriaco con
   * actividad comercial suele tener que indicarlos; completar con los datos reales.
   */
  vatId: '',
  tradeAuthority: '',
  chamber: '',
} as const;

export function legalAddress(): string {
  return `${LEGAL.street}, ${LEGAL.postalCode} ${LEGAL.city}, ${LEGAL.state}, ${LEGAL.country}`;
}
