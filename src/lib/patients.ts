/**
 * Patient data model — DPI (Dossier Patient Informatisé)
 */

export type KatzCategory = 'O' | 'A' | 'B' | 'C' | 'Cd';

export interface Patient {
  id: string;
  niss: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'X';
  phone: string;
  email?: string;
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    lat?: number;
    lng?: number;
  };
  mutuality: string;        // mutualité
  mutualityNumber: string;
  katzCategory?: KatzCategory;
  katzScore?: number;
  prescribingDoctor: string;
  doctorPhone?: string;
  allergies: string[];
  pathologies: string[];
  notes?: string;
  isActive: boolean;
  lastVisit?: string;
  nextVisit?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  patientId: string;
  nurseId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  acts: VisitAct[];
  vitalSigns?: VitalSigns;
  notes?: string;
  signature?: string;
}

export interface VisitAct {
  code: string;
  label: string;
  valueW: number;
  category: 'toilette' | 'injection' | 'wound' | 'medication' | 'consultation' | 'other';
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  glycemia?: number;
  weight?: number;
  pain?: number; // 0-10
}

// ── Mock Data ──

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    niss: '85.07.15-123.45',
    firstName: 'Marie',
    lastName: 'Dubois',
    dateOfBirth: '1945-03-12',
    gender: 'F',
    phone: '+32 471 23 45 67',
    address: { street: 'Rue des Tilleuls', houseNumber: '23', postalCode: '1000', city: 'Bruxelles', lat: 50.8467, lng: 4.3525 },
    mutuality: 'Mutualité Chrétienne',
    mutualityNumber: '115-1234567-89',
    katzCategory: 'B',
    katzScore: 28,
    prescribingDoctor: 'Dr. Van den Berg',
    doctorPhone: '+32 2 123 45 67',
    allergies: ['Pénicilline', 'Latex'],
    pathologies: ['Diabète type 2', 'Hypertension', 'Ulcère veineux jambe gauche'],
    isActive: true,
    lastVisit: '2026-03-05',
    nextVisit: '2026-03-06T10:30:00',
    createdAt: '2024-06-15',
  },
  {
    id: 'p2',
    niss: '50.03.22-567.89',
    firstName: 'Pierre',
    lastName: 'Janssen',
    dateOfBirth: '1950-03-22',
    gender: 'M',
    phone: '+32 475 98 76 54',
    address: { street: 'Avenue Louise', houseNumber: '45', postalCode: '1050', city: 'Ixelles', lat: 50.8333, lng: 4.3667 },
    mutuality: 'Solidaris',
    mutualityNumber: '206-9876543-21',
    katzCategory: 'C',
    katzScore: 35,
    prescribingDoctor: 'Dr. Lejeune',
    allergies: [],
    pathologies: ['Diabète type 1', 'Insuffisance cardiaque', 'AVC séquellaire'],
    isActive: true,
    lastVisit: '2026-03-05',
    nextVisit: '2026-03-06T08:00:00',
    createdAt: '2023-11-20',
  },
  {
    id: 'p3',
    niss: '38.11.05-234.56',
    firstName: 'Jeanne',
    lastName: 'Lambert',
    dateOfBirth: '1938-11-05',
    gender: 'F',
    phone: '+32 473 11 22 33',
    address: { street: 'Chaussée de Waterloo', houseNumber: '112', postalCode: '1060', city: 'Saint-Gilles', lat: 50.8283, lng: 4.3475 },
    mutuality: 'Mutualité Libre',
    mutualityNumber: '319-4567890-12',
    katzCategory: 'Cd',
    katzScore: 42,
    prescribingDoctor: 'Dr. Peeters',
    allergies: ['Aspirine'],
    pathologies: ['Démence modérée', 'Ostéoporose', 'Plaie sacrum stade III'],
    isActive: true,
    lastVisit: '2026-03-05',
    nextVisit: '2026-03-06T09:15:00',
    createdAt: '2024-01-10',
  },
  {
    id: 'p4',
    niss: '60.08.30-789.01',
    firstName: 'André',
    lastName: 'Willems',
    dateOfBirth: '1960-08-30',
    gender: 'M',
    phone: '+32 476 55 66 77',
    address: { street: 'Rue Haute', houseNumber: '8', postalCode: '1000', city: 'Bruxelles', lat: 50.8399, lng: 4.3488 },
    mutuality: 'Partenamut',
    mutualityNumber: '407-1112233-44',
    katzCategory: 'A',
    katzScore: 18,
    prescribingDoctor: 'Dr. Dupont',
    allergies: [],
    pathologies: ['BPCO', 'Post-op prothèse hanche'],
    isActive: true,
    lastVisit: '2026-03-04',
    nextVisit: '2026-03-06T11:00:00',
    createdAt: '2025-09-01',
  },
  {
    id: 'p5',
    niss: '72.05.18-345.67',
    firstName: 'Claudine',
    lastName: 'Martin',
    dateOfBirth: '1972-05-18',
    gender: 'F',
    phone: '+32 479 88 99 00',
    address: { street: 'Boulevard Anspach', houseNumber: '56', postalCode: '1000', city: 'Bruxelles', lat: 50.8505, lng: 4.3488 },
    mutuality: 'Mutualité Chrétienne',
    mutualityNumber: '115-5566778-90',
    katzCategory: 'O',
    prescribingDoctor: 'Dr. Renard',
    allergies: ['Iode'],
    pathologies: ['Diabète gestationnel (historique)', 'Injection insuline'],
    isActive: true,
    lastVisit: '2026-03-03',
    nextVisit: '2026-03-07T08:30:00',
    createdAt: '2025-12-01',
  },
];
