import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { Database, Tables } from '@/lib/database.types';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

export type UserRole = Database['public']['Enums']['user_role'];
export type ProfessionalStatus = Database['public']['Enums']['professional_status'];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  inamiNumber?: string;
  professionalStatus?: ProfessionalStatus;
  bceNumber?: string;
  companyName?: string;
  professionalStreet?: string;
  professionalHouseNumber?: string;
  professionalPostalCode?: string;
  professionalCity?: string;
}

interface SyncSessionOptions {
  showLoading?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  syncSession: (session: Session | null, options?: SyncSessionOptions) => Promise<User | null>;
  logout: () => void;
}

type ProfileRow = Pick<
  Tables<'profiles'>,
  | 'id'
  | 'email'
  | 'role'
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'avatar_url'
  | 'inami_number'
  | 'professional_status'
  | 'bce_number'
  | 'company_name'
  | 'professional_street'
  | 'professional_house_number'
  | 'professional_postal_code'
  | 'professional_city'
>;

export const roleHomeRoutes: Record<UserRole, string> = {
  nurse: '/nurse',
  coordinator: '/coordinator',
  patient: '/patient',
  admin: '/admin',
  billing_office: '/billing',
};

export const roleProfileRoutes: Record<UserRole, string> = {
  nurse: '/nurse/profile',
  coordinator: '/coordinator/profile',
  patient: '/patient/profile',
  admin: '/admin/profile',
  billing_office: '/billing/profile',
};

let initializationPromise: Promise<void> | null = null;
let authSubscriptionBound = false;

function normalizeRole(role: string | null | undefined): UserRole {
  switch (role) {
    case 'nurse':
    case 'coordinator':
    case 'patient':
    case 'admin':
    case 'billing_office':
      return role;
    default:
      return 'patient';
  }
}

function getMetadataString(metadata: SupabaseUser['user_metadata'], key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getMetadataProfessionalStatus(metadata: SupabaseUser['user_metadata']): ProfessionalStatus | undefined {
  const value = getMetadataString(metadata, 'professional_status');

  switch (value) {
    case 'independant':
    case 'independant_complementaire':
    case 'salarie':
      return value;
    default:
      return undefined;
  }
}

function buildFallbackName(authUser: SupabaseUser) {
  const fullName = getMetadataString(authUser.user_metadata, 'full_name');
  const firstName =
    getMetadataString(authUser.user_metadata, 'first_name') ?? fullName?.split(' ')[0] ?? 'Meta';
  const lastNameFromFullName = fullName?.split(' ').slice(1).join(' ');
  const lastName =
    getMetadataString(authUser.user_metadata, 'last_name') ??
    (lastNameFromFullName && lastNameFromFullName.length > 0 ? lastNameFromFullName : 'Cares');

  return { firstName, lastName };
}

function mapProfileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    email: profile.email,
    role: normalizeRole(profile.role),
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    inamiNumber: profile.inami_number ?? undefined,
    professionalStatus: profile.professional_status ?? undefined,
    bceNumber: profile.bce_number ?? undefined,
    companyName: profile.company_name ?? undefined,
    professionalStreet: profile.professional_street ?? undefined,
    professionalHouseNumber: profile.professional_house_number ?? undefined,
    professionalPostalCode: profile.professional_postal_code ?? undefined,
    professionalCity: profile.professional_city ?? undefined,
  };
}

function mapAuthUserToFallback(authUser: SupabaseUser): User {
  const { firstName, lastName } = buildFallbackName(authUser);

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    role: normalizeRole(getMetadataString(authUser.user_metadata, 'role')),
    firstName,
    lastName,
    phone: getMetadataString(authUser.user_metadata, 'phone'),
    avatarUrl: getMetadataString(authUser.user_metadata, 'avatar_url'),
    inamiNumber: getMetadataString(authUser.user_metadata, 'inami_number'),
    professionalStatus: getMetadataProfessionalStatus(authUser.user_metadata),
    bceNumber: getMetadataString(authUser.user_metadata, 'bce_number'),
    companyName: getMetadataString(authUser.user_metadata, 'company_name'),
    professionalStreet: getMetadataString(authUser.user_metadata, 'professional_street'),
    professionalHouseNumber: getMetadataString(authUser.user_metadata, 'professional_house_number'),
    professionalPostalCode: getMetadataString(authUser.user_metadata, 'professional_postal_code'),
    professionalCity: getMetadataString(authUser.user_metadata, 'professional_city'),
  };
}

async function loadUserFromSession(session: Session | null): Promise<User | null> {
  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, role, first_name, last_name, phone, avatar_url, inami_number, professional_status, bce_number, company_name, professional_street, professional_house_number, professional_postal_code, professional_city'
    )
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    return mapAuthUserToFallback(session.user);
  }

  return data ? mapProfileToUser(data) : mapAuthUserToFallback(session.user);
}

function resetUserScopedData() {
  queryClient.removeQueries();
}

function ensureAuthSubscription() {
  if (authSubscriptionBound) {
    return;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    void useAuthStore.getState().syncSession(session, { showLoading: false });
  });

  authSubscriptionBound = true;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user, loading: false, initialized: true }),
  setLoading: (loading) => set({ loading }),
  initialize: async () => {
    ensureAuthSubscription();

    if (get().initialized && !get().loading) {
      return;
    }

    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      set({ loading: true });

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        await get().syncSession(data.session, { showLoading: false });
      } catch {
        resetUserScopedData();
        set({ user: null, loading: false, initialized: true });
      }
    })().finally(() => {
      initializationPromise = null;
    });

    return initializationPromise;
  },
  syncSession: async (session, { showLoading = true } = {}) => {
    if (showLoading) {
      set({ loading: true });
    }

    try {
      const previousUserId = get().user?.id ?? null;
      const nextUser = await loadUserFromSession(session);

      if (previousUserId !== (nextUser?.id ?? null)) {
        resetUserScopedData();
      }

      set({ user: nextUser, loading: false, initialized: true });
      return nextUser;
    } catch {
      resetUserScopedData();
      set({ user: null, loading: false, initialized: true });
      return null;
    }
  },
  logout: () => {
    resetUserScopedData();
    set({ user: null, loading: false, initialized: true });
    void supabase.auth.signOut();
  },
}));
