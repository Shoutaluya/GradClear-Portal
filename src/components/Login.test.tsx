import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';

// Mock firebase dependencies
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

describe('Login Component', () => {
  it('renders the login form correctly', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: /GradClear Portal/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login \/ Register/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quick Demo Login/i })).toBeInTheDocument();
  });
});