import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AbsencesPage } from './AbsencesPage';
import { CoordinatorBillingPage } from './CoordinatorBillingPage';
import { MessagesPage } from './MessagesPage';
import { PlanningPage } from './PlanningPage';
import { ReconciliationPage } from './ReconciliationPage';
import { ShiftPage } from './ShiftPage';
import { StatsPage } from './StatsPage';

vi.mock('@/hooks/useHadData', () => ({
  useHadEpisodes: () => ({
    data: [],
    isLoading: false,
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

function mockDownloadApis() {
  Object.defineProperty(window.URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:download'),
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
}

describe('Coordinator workflows', () => {
  it('auto-assigns pending visits from the planning page', () => {
    render(
      <MemoryRouter>
        <PlanningPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Auto-assign/i }));

    expect(screen.getByRole('status')).toHaveTextContent('2 visite(s) assignee(s) automatiquement.');
    expect(screen.queryByRole('button', { name: /Auto-assign/i })).not.toBeInTheDocument();
  }, 15000);

  it('sends a direct coordinator message', () => {
    render(<MessagesPage />);

    fireEvent.change(screen.getAllByLabelText(/message/i)[0], {
      target: { value: 'Retard confirme sur la tournee sud.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer message direct/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Message direct .*Marie Laurent/i);
    expect(screen.getByText('Retard confirme sur la tournee sud.')).toBeInTheDocument();
  });

  it('assigns a replacement from the absences page', () => {
    render(<AbsencesPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /Assigner/i })[0]);

    expect(screen.getByRole('status')).toHaveTextContent(/Thomas Maes.*Sophie Dupuis/i);
  });

  it('approves a shift swap request', () => {
    render(<ShiftPage />);

    fireEvent.click(screen.getByRole('button', { name: /Approuver/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Thomas Maes.*Laura Van Damme/i);
  });

  it('exports coordinator statistics', () => {
    mockDownloadApis();
    render(<StatsPage />);

    fireEvent.click(screen.getByRole('button', { name: /^Exporter$/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Export statistiques/i);
  });

  it('exports reconciliation data', async () => {
    mockDownloadApis();
    render(<ReconciliationPage />);

    fireEvent.click(screen.getByRole('button', { name: /Synth/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Exporter rapprochement/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Export rapprochement/i);
  }, 15000);

  it('sends the coordinator billing batch', () => {
    render(<CoordinatorBillingPage />);

    fireEvent.click(screen.getByRole('button', { name: /Lot eFact/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/Lot eFact/i);
  });
});
