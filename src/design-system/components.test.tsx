import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { Button } from './Button';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Katz B</Badge>);
    expect(screen.getByText('Katz B')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Badge variant="blue">Test</Badge>);
    expect(container.firstChild).toHaveClass('bg-mc-blue-50');
  });

  it('renders dot when prop is set', () => {
    const { container } = render(<Badge variant="green" dot>Active</Badge>);
    const dot = container.querySelector('.rounded-full.bg-mc-green-500');
    expect(dot).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="mt-2">Custom</Badge>);
    expect(container.firstChild).toHaveClass('mt-2');
  });
});

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-mc-red-500');
  });

  it('applies size styles', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass('h-12');
  });

  it('shows loader when loading', () => {
    const { container } = render(<Button loading>Saving</Button>);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders gradient variant', () => {
    const { container } = render(<Button variant="gradient">CTA</Button>);
    expect(container.firstChild).toHaveClass('bg-[image:var(--gradient-brand)]');
  });
});
