import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockQueueDataAccessLog } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockQueueDataAccessLog: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/dataAccess', () => ({
  queueDataAccessLog: mockQueueDataAccessLog,
}));

import { useAuthStore, type User } from '@/stores/authStore';
import { usePlatformData } from './usePlatformData';

const patientUser: User = {
  id: 'profile-1',
  email: 'marie@example.com',
  role: 'patient',
  firstName: 'Fallback',
  lastName: 'Patient',
};

const patientRow = {
  id: 'patient-1',
  profile_id: patientUser.id,
  first_name: 'Marie',
  last_name: 'Dubois',
  email: patientUser.email,
  phone: '+32 470 00 00 00',
  street: 'Rue de Test',
  house_number: '12',
  postal_code: '1000',
  city: 'Bruxelles',
  niss: '93.05.14-123.45',
  mutuality: 'MC',
  mutuality_number: '12345678901',
  prescribing_doctor: 'Dr. Martin',
  doctor_phone: '+32 2 555 55 55',
  photo_url: null,
  notes: null,
  gender: 'F',
  date_of_birth: '1993-05-14',
  is_active: true,
  katz_category: 'A',
  katz_score: 6,
  last_visit_at: null,
  next_visit_at: null,
  lat: null,
  lng: null,
  created_at: '2026-03-09T08:00:00.000Z',
  updated_at: '2026-03-09T08:00:00.000Z',
};

function createMaybeSingleResponse<T>(data: T | null) {
  return {
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function createOrderedResponse<T>(data: T[]) {
  return {
    order: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function createTableQuery(table: string) {
  switch (table) {
    case 'patients':
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => createMaybeSingleResponse(patientRow)),
        })),
      };
    case 'patient_allergies':
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => createOrderedResponse([{ label: 'Penicilline' }])),
        })),
      };
    case 'patient_pathologies':
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => createOrderedResponse([{ label: 'Diabete' }])),
        })),
      };
    case 'patient_dashboard_state':
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            createMaybeSingleResponse({
              nurse_name: 'Infirmiere Laurent',
              eta_minutes: 12,
              eta_status: 'preparing',
              visits_today: 2,
              health_tip: 'Buvez de l eau apres votre traitement.',
            })
          ),
        })),
      };
    case 'medication_reminders':
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            createOrderedResponse([
              {
                id: 'reminder-1',
                name: 'Insuline',
                scheduled_for: '08:30:00',
                status: 'taken',
              },
            ])
          ),
        })),
      };
    case 'patient_timeline_events':
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            createOrderedResponse([
              {
                id: 'timeline-1',
                event_time: '09:15:00',
                label: 'Visite infirmiere terminee',
                status: 'done',
              },
            ])
          ),
        })),
      };
    case 'patient_vital_snapshots':
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            createOrderedResponse([
              {
                label: 'Tension',
                value: '12/8',
                unit: '',
                tone: 'green',
              },
            ])
          ),
        })),
      };
    default:
      throw new Error(`Unexpected table query: ${table}`);
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('usePlatformData', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockQueueDataAccessLog.mockReset();
    useAuthStore.setState({
      user: patientUser,
      loading: false,
      initialized: true,
    });
    mockFrom.mockImplementation((table: string) => createTableQuery(table));
  });

  it('fetches live patient data on first mount even with placeholder data', async () => {
    const { result } = renderHook(() => usePlatformData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data.patient.profile.firstName).toBe(patientUser.firstName);

    await waitFor(() => {
      expect(result.current.data.patient.profile.firstName).toBe('Marie');
    });

    expect(result.current.data.patient.nurseETA.name).toBe('Infirmiere Laurent');
    expect(result.current.data.patient.nurseETA.visits).toBe(2);
    expect(result.current.data.patient.medReminders).toHaveLength(1);
    expect(mockFrom).toHaveBeenCalledWith('patients');
    expect(mockQueueDataAccessLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tableName: 'patients',
        action: 'read',
        recordId: patientRow.id,
      })
    );
  });
});
