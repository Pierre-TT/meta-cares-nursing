import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  syncSession: vi.fn(),
  storageFrom: vi.fn(),
  storageUpload: vi.fn(),
  storageGetPublicUrl: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    auth: {
      updateUser: mocks.updateUser,
      getSession: mocks.getSession,
    },
    storage: {
      from: mocks.storageFrom,
    },
  },
}));

import { ProfileSettingsPage } from './ProfileSettingsPage';
import { useAuthStore, type User } from '@/stores/authStore';

const nurseUser: User = {
  id: 'user-1',
  email: 'alice@metacares.be',
  role: 'nurse',
  firstName: 'Alice',
  lastName: 'Laurent',
  phone: '+32 470 11 22 33',
  avatarUrl: 'https://example.com/alice.png',
  inamiNumber: '5-12345-67-890',
  professionalStatus: 'independant',
  bceNumber: '0123.456.789',
  companyName: 'Cabinet Laurent',
  professionalStreet: 'Rue des Soins',
  professionalHouseNumber: '42',
  professionalPostalCode: '1000',
  professionalCity: 'Bruxelles',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfileSettingsPage />
    </MemoryRouter>
  );
}

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:avatar-preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });

    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mocks.syncSession.mockResolvedValue(nurseUser);
    mocks.storageFrom.mockReturnValue({
      upload: mocks.storageUpload,
      getPublicUrl: mocks.storageGetPublicUrl,
    });
    mocks.storageUpload.mockResolvedValue({ error: null });
    mocks.storageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.metacares.be/profile-images/user-1/avatar' },
    });

    useAuthStore.setState({
      user: nurseUser,
      loading: false,
      initialized: true,
      syncSession: mocks.syncSession,
    });
  });

  it('uploads a local profile image and saves nurse professional information', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Prénom/i), { target: { value: 'Alicia' } });
    fireEvent.change(screen.getByLabelText(/^Nom$/i), { target: { value: 'Martin' } });
    fireEvent.change(screen.getByLabelText(/Téléphone/i), { target: { value: '+32 470 99 88 77' } });
    fireEvent.change(screen.getByLabelText(/Numéro INAMI/i), { target: { value: '9-99999-99-999' } });
    fireEvent.change(screen.getByLabelText(/Statut professionnel/i), {
      target: { value: 'independant_complementaire' },
    });
    fireEvent.change(screen.getByLabelText(/Numéro de BCE/i), { target: { value: '0987.654.321' } });
    fireEvent.change(screen.getByLabelText(/Nom de société/i), { target: { value: 'Cabinet Martin' } });
    fireEvent.change(screen.getByLabelText(/^Rue$/i), { target: { value: 'Avenue Louise' } });
    fireEvent.change(screen.getByLabelText(/Numéro$/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/Code postal/i), { target: { value: '1050' } });
    fireEvent.change(screen.getByLabelText(/Ville/i), { target: { value: 'Ixelles' } });

    const avatarFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Photo de profil/i), {
      target: { files: [avatarFile] },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer le profil/i }));

    await waitFor(() => {
      expect(mocks.storageFrom).toHaveBeenCalledWith('profile-images');
      expect(mocks.storageUpload).toHaveBeenCalledWith('user-1/avatar', avatarFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/png',
      });
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice@metacares.be',
          first_name: 'Alicia',
          last_name: 'Martin',
          phone: '+32 470 99 88 77',
          avatar_url: 'https://cdn.metacares.be/profile-images/user-1/avatar',
          inami_number: '9-99999-99-999',
          professional_status: 'independant_complementaire',
          bce_number: '0987.654.321',
          company_name: 'Cabinet Martin',
          professional_street: 'Avenue Louise',
          professional_house_number: '250',
          professional_postal_code: '1050',
          professional_city: 'Ixelles',
        })
      );
    });

    expect(mocks.eq).toHaveBeenCalledWith('id', 'user-1');
    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          first_name: 'Alicia',
          last_name: 'Martin',
          full_name: 'Alicia Martin',
          phone: '+32 470 99 88 77',
          avatar_url: 'https://cdn.metacares.be/profile-images/user-1/avatar',
          inami_number: '9-99999-99-999',
          professional_status: 'independant_complementaire',
          bce_number: '0987.654.321',
          company_name: 'Cabinet Martin',
          professional_street: 'Avenue Louise',
          professional_house_number: '250',
          professional_postal_code: '1050',
          professional_city: 'Ixelles',
          role: 'nurse',
        }),
      })
    );
    expect(mocks.syncSession).toHaveBeenCalled();
    expect(await screen.findByText(/Profil mis à jour/i)).toBeInTheDocument();
  });

  it('updates the password for the current user', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Nouveau mot de passe$/i), {
      target: { value: 'new-password-123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), {
      target: { value: 'new-password-123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Mettre à jour le mot de passe/i }));

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
    });
    expect(await screen.findByText(/Mot de passe mis à jour/i)).toBeInTheDocument();
  });

  it('hides nurse-only professional fields for patient accounts', () => {
    useAuthStore.setState({
      user: {
        ...nurseUser,
        role: 'patient',
        inamiNumber: undefined,
        professionalStatus: undefined,
        bceNumber: undefined,
        companyName: undefined,
        professionalStreet: undefined,
        professionalHouseNumber: undefined,
        professionalPostalCode: undefined,
        professionalCity: undefined,
      },
    });

    renderPage();

    expect(screen.queryByLabelText(/Numéro INAMI/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Statut professionnel/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Numéro de BCE/i)).not.toBeInTheDocument();
  });
});
