import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/usePlatformData', () => ({
  useAdminPlatformData: () => ({
    data: {
      summary: {
        alertCount: 0,
        certificateDeadlines: 0,
      },
    },
  }),
}));

import { AdminLayout } from '@/layouts/AdminLayout';
import { BillingLayout } from '@/layouts/BillingLayout';
import { CoordinatorMorePage } from '@/pages/coordinator/CoordinatorMorePage';
import { useAuthStore, type User } from '@/stores/authStore';
import { MorePage } from '@/pages/nurse/MorePage';
import { PatientMorePage } from '@/pages/patient/PatientMorePage';

const baseUser: User = {
  id: 'user-1',
  email: 'user@metacares.be',
  role: 'patient',
  firstName: 'Meta',
  lastName: 'Cares',
};

function renderPatientMore() {
  return render(
    <MemoryRouter initialEntries={['/patient/more']}>
      <Routes>
        <Route path="/patient/more" element={<PatientMorePage />} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderNurseMore() {
  return render(
    <MemoryRouter initialEntries={['/nurse/more']}>
      <Routes>
        <Route path="/nurse/more" element={<MorePage />} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderCoordinatorMore() {
  return render(
    <MemoryRouter initialEntries={['/coordinator/more']}>
      <Routes>
        <Route path="/coordinator/more" element={<CoordinatorMorePage />} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderAdminLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>Admin home</div>} />
        </Route>
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderBillingLayout() {
  return render(
    <MemoryRouter initialEntries={['/billing']}>
      <Routes>
        <Route path="/billing" element={<BillingLayout />}>
          <Route index element={<div>Billing home</div>} />
        </Route>
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('logout access points', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: baseUser,
      loading: false,
      initialized: true,
    });
  });

  it('lets patient users disconnect from the more page', () => {
    const logout = vi.fn();
    useAuthStore.setState({
      user: {
        ...baseUser,
        role: 'patient',
      },
      logout,
    });

    renderPatientMore();

    fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('lets nurse users disconnect from the more page', () => {
    const logout = vi.fn();
    useAuthStore.setState({
      user: {
        ...baseUser,
        role: 'nurse',
      },
      logout,
    });

    renderNurseMore();

    fireEvent.click(screen.getByRole('button', { name: /^Déconnexion$/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('lets coordinator users disconnect from the more page', () => {
    const logout = vi.fn();
    useAuthStore.setState({
      user: {
        ...baseUser,
        role: 'coordinator',
      },
      logout,
    });

    renderCoordinatorMore();

    fireEvent.click(screen.getByRole('button', { name: /^Déconnexion$/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('keeps a mobile logout control available in the admin layout', () => {
    const logout = vi.fn();
    useAuthStore.setState({
      user: {
        ...baseUser,
        role: 'admin',
      },
      logout,
    });

    renderAdminLayout();

    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le menu/i }));

    const logoutButtons = screen.getAllByRole('button', { name: /Déconnexion/i });
    expect(logoutButtons).toHaveLength(2);

    fireEvent.click(logoutButtons[1]);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('keeps a mobile logout control available in the billing layout', () => {
    const logout = vi.fn();
    useAuthStore.setState({
      user: {
        ...baseUser,
        role: 'billing_office',
      },
      logout,
    });

    renderBillingLayout();

    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le menu/i }));

    const logoutButtons = screen.getAllByRole('button', { name: /Déconnexion/i });
    expect(logoutButtons).toHaveLength(2);

    fireEvent.click(logoutButtons[1]);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });
});
