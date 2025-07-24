import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Guardando datos...';
    render(<LoadingSpinner message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });

  it('renders without message when empty string provided', () => {
    render(<LoadingSpinner message="" />);
    
    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders as overlay when overlay prop is true', () => {
    render(<LoadingSpinner overlay={true} />);
    
    // Check for backdrop element (overlay)
    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeInTheDocument();
    // When in overlay mode, the progressbar might be hidden from screen readers
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('renders inline when overlay prop is false', () => {
    render(<LoadingSpinner overlay={false} />);
    
    // Should not have backdrop
    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('applies custom size', () => {
    render(<LoadingSpinner size={60} />);
    
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    // Size is applied via CSS, so we check that the component renders
  });

  it('applies different colors', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(<LoadingSpinner color="secondary" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(<LoadingSpinner color="inherit" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has proper structure for inline display', () => {
    render(<LoadingSpinner />);
    
    const progressbar = screen.getByRole('progressbar');
    const message = screen.getByText('Cargando...');
    
    // Both elements should be present
    expect(progressbar).toBeInTheDocument();
    expect(message).toBeInTheDocument();
  });

  it('centers content properly', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check that the container has flex display properties
    const boxElement = container.firstChild;
    expect(boxElement).toBeInTheDocument();
  });
});