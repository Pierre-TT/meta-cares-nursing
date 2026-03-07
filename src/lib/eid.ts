/**
 * Belgian eID data model & parser
 * Supports NFC reading (ICAO-compliant since Jan 2021)
 * Ref: EU Regulation 2019/1157
 */

export interface BelgianEid {
  nationalNumber: string;  // NISS / Rijksregisternummer  (XX.XX.XX-XXX.XX)
  lastName: string;
  firstName: string;
  dateOfBirth: string;      // YYYY-MM-DD
  gender: 'M' | 'F' | 'X';
  nationality: string;
  placeOfBirth: string;
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
  };
  cardNumber: string;
  validFrom: string;        // YYYY-MM-DD
  validUntil: string;       // YYYY-MM-DD
  photoBase64?: string;
  chipAuthSuccess: boolean;
}

/**
 * Format a raw national number (11 digits) into XX.XX.XX-XXX.XX
 */
export function formatNationalNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return raw;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}-${digits.slice(6, 9)}.${digits.slice(9, 11)}`;
}

/**
 * Validate Belgian national number (modulo 97 check)
 */
export function validateNationalNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return false;

  const base = parseInt(digits.slice(0, 9), 10);
  const check = parseInt(digits.slice(9, 11), 10);

  // Try 19XX birth year first
  if (97 - (base % 97) === check) return true;

  // Try 20XX birth year (prefix with 2)
  const base2000 = parseInt('2' + digits.slice(0, 9), 10);
  return 97 - (base2000 % 97) === check;
}

/**
 * Extract date of birth from national number
 */
export function birthDateFromNISS(niss: string): string | null {
  const digits = niss.replace(/\D/g, '');
  if (digits.length !== 11) return null;

  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);

  // Determine century using modulo 97 check
  const base = parseInt(digits.slice(0, 9), 10);
  const check = parseInt(digits.slice(9, 11), 10);
  const century = (97 - (base % 97) === check) ? '19' : '20';

  return `${century}${yy.toString().padStart(2, '0')}-${mm}-${dd}`;
}

/**
 * Parse gender from national number (digit at position 6-8)
 */
export function genderFromNISS(niss: string): 'M' | 'F' | 'X' {
  const digits = niss.replace(/\D/g, '');
  if (digits.length !== 11) return 'X';
  const seq = parseInt(digits.slice(6, 9), 10);
  return seq % 2 === 1 ? 'M' : 'F';
}

/**
 * Mock NFC read — simulates reading a Belgian eID via NFC
 * In production, this would use Capacitor NFC plugin (e.g., @nicemobdev/capacitor-nfc)
 */
export function mockNfcRead(): Promise<BelgianEid> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        nationalNumber: '85.07.15-123.45',
        lastName: 'DUPONT',
        firstName: 'Marie',
        dateOfBirth: '1985-07-15',
        gender: 'F',
        nationality: 'Belge',
        placeOfBirth: 'Bruxelles',
        address: {
          street: 'Rue des Tilleuls',
          houseNumber: '23',
          postalCode: '1000',
          city: 'Bruxelles',
        },
        cardNumber: '592-1234567-89',
        validFrom: '2021-03-15',
        validUntil: '2031-03-14',
        chipAuthSuccess: true,
      });
    }, 2000);
  });
}
