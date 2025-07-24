import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Mock window.location methods
const mockReload = jest.fn();
const mockAssign = jest.fn();

Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
    href: 'http://localhost:3000',
    assign: mockAssign,
  },
  writable: true,
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText(/Ha ocurrido un error inesperado/)).toBeInTheDocument();
  });

  it('displays error details with error ID', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Detalles del Error')).toBeInTheDocument();
    expect(screen.getByText(/ID del Error:/)).toBeInTheDocument();
    expect(screen.getByText(/Mensaje:/)).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('provides retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText('Reintentar');
    fireEvent.click(retryButton);

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show the component again
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('provides reload page functionality', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Recargar Página');
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('provides go home functionality', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('Ir al Inicio');
    fireEvent.click(homeButton);

    expect(mockAssign).toHaveBeenCalledWith('/');
  });

  it('provides error reporting functionality', () => {
    // Mock window.open
    const mockOpen = jest.fn();
    window.open = mockOpen;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reportButton = screen.getByText('Reportar Error');
    fireEvent.click(reportButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('mailto:support@educonnect.com')
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('¡Oops! Algo salió mal')).not.toBeInTheDocument();
  });

  it('shows development information in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Información de Desarrollo')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides development information in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Información de Desarrollo')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});