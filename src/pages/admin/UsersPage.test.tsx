import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UsersPage } from './UsersPage';

describe('UsersPage', () => {
  it('creates a new user from the modal flow', () => {
    render(<UsersPage />);

    fireEvent.click(screen.getByRole('button', { name: /^Creer$/i }));

    fireEvent.change(screen.getByLabelText(/Nom complet/i), {
      target: { value: 'Alice Martin' },
    });
    fireEvent.change(screen.getByLabelText(/Adresse email/i), {
      target: { value: 'alice@metacares.be' },
    });
    fireEvent.change(screen.getByLabelText(/^Role$/i), {
      target: { value: 'admin' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Creer l utilisateur/i }));

    expect(screen.getByText('Alice Martin')).toBeInTheDocument();
    expect(screen.getByText('alice@metacares.be')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Utilisateur cree: alice@metacares.be');
  }, 15000);
});
