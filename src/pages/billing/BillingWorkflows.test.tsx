import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BillingReconciliationPage } from './BillingReconciliationPage';
import { CorrectionsPage } from './CorrectionsPage';
import { EFactBatchesPage } from './EFactBatchesPage';
import { PatientAccountPage } from './PatientAccountPage';
import { RejectionsPage } from './RejectionsPage';
import { ReportsPage } from './ReportsPage';
import { WorkQueuePage } from './WorkQueuePage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Billing workflows', () => {
  it('sends draft eFact batches from the batches page', () => {
    render(<EFactBatchesPage />);

    fireEvent.click(screen.getByRole('button', { name: /Envoyer 1 brouillon/i }));

    expect(screen.getByRole('status')).toHaveTextContent('1 lot(s) envoye(s) vers MyCareNet.');
  });

  it('validates selected queue items', () => {
    render(<WorkQueuePage />);

    fireEvent.click(screen.getByRole('button', { name: /Selectionner tous les en attente/i }));
    fireEvent.click(screen.getByRole('button', { name: /Valider tout/i }));

    expect(screen.getByRole('status')).toHaveTextContent('4 prestation(s) validee(s) pour le prochain lot.');
    expect(screen.queryByRole('button', { name: /Valider tout/i })).not.toBeInTheDocument();
  });

  it('applies an AI rejection suggestion', () => {
    render(<RejectionsPage />);

    fireEvent.click(screen.getAllByRole('button', { name: /^Appliquer$/i })[0]);

    expect(screen.getByRole('status')).toHaveTextContent('Correction appliquee pour Martin Claudine.');
  });

  it('sends queued corrections via MyCareNet', () => {
    render(<CorrectionsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Envoyer les corrections via MyCareNet/i }));

    expect(screen.getByRole('status')).toHaveTextContent('2 correction(s) envoyee(s) via MyCareNet.');
  });

  it('opens reconciliation detail and prepares a claim', () => {
    render(<BillingReconciliationPage />);

    fireEvent.click(screen.getByText('LOT-2026-0088'));
    fireEvent.click(screen.getByRole('button', { name: /Creer reclamation/i }));
    fireEvent.click(screen.getByRole('button', { name: /Voir detail/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Reclamation preparee pour LOT-2026-0088.');
    expect(screen.getByText('Detail LOT-2026-0088')).toBeInTheDocument();
  });

  it('renews an expired patient agreement and opens the history modal', () => {
    render(<PatientAccountPage />);

    fireEvent.click(screen.getByText('Jean-Pierre Lemaire'));
    fireEvent.click(screen.getByRole('button', { name: /Renouveler/i }));
    fireEvent.click(screen.getByRole('button', { name: /Historique complet/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Renouvellement prepare pour Jean-Pierre Lemaire.');
    expect(screen.getByText('Historique Jean-Pierre Lemaire')).toBeInTheDocument();
  });

  it('exports a report file', () => {
    Object.defineProperty(window.URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:report'),
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ReportsPage />);

    fireEvent.click(screen.getByRole('button', { name: /^CSV$/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Export CSV prepare.');
  });
});
