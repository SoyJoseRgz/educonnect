import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage Component', () => {
  it('renders basic error message', () => {
    const message = 'Something went wrong';
    render(<ErrorMessage message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const message = 'Error occurred';
    const title = 'Validation Error';
    render(<ErrorMessage message={message} title={title} />);
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders with different severity levels', () => {
    const message = 'Test message';
    
    const { rerender } = render(<ErrorMessage message={message} severity="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<ErrorMessage message={message} severity="warning" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<ErrorMessage message={message} severity="info" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const message = 'Network error';
    const onRetry = jest.fn();
    
    render(<ErrorMessage message={message} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Reintentar');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows custom retry text', () => {
    const message = 'Error';
    const onRetry = jest.fn();
    const retryText = 'Try Again';
    
    render(<ErrorMessage message={message} onRetry={onRetry} retryText={retryText} />);
    
    expect(screen.getByText(retryText)).toBeInTheDocument();
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
  });

  it('shows error details when provided', async () => {
    const message = 'Validation failed';
    const errors = ['Name is required', 'Email is invalid'];
    
    render(<ErrorMessage message={message} errors={errors} />);
    
    // Click to show details
    const detailsButton = screen.getByText('Ver detalles');
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('• Name is required')).toBeInTheDocument();
    expect(screen.getByText('• Email is invalid')).toBeInTheDocument();
    expect(screen.getByText('Ocultar detalles')).toBeInTheDocument();
  });

  it('shows details by default when showDetails is true', () => {
    const message = 'Error';
    const errors = ['Detail 1', 'Detail 2'];
    
    render(<ErrorMessage message={message} errors={errors} showDetails={true} />);
    
    expect(screen.getByText('• Detail 1')).toBeInTheDocument();
    expect(screen.getByText('• Detail 2')).toBeInTheDocument();
    expect(screen.getByText('Ocultar detalles')).toBeInTheDocument();
  });

  it('toggles details visibility', () => {
    const message = 'Error';
    const errors = ['Error detail'];
    
    render(<ErrorMessage message={message} errors={errors} />);
    
    const detailsButton = screen.getByText('Ver detalles');
    
    // Show details
    fireEvent.click(detailsButton);
    expect(screen.getByText('• Error detail')).toBeInTheDocument();
    expect(screen.getByText('Ocultar detalles')).toBeInTheDocument();
    
    // Hide details - check button text changes
    fireEvent.click(screen.getByText('Ocultar detalles'));
    expect(screen.getByText('Ver detalles')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const message = 'Error';
    const onClose = jest.fn();
    
    render(<ErrorMessage message={message} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show details button when no errors provided', () => {
    const message = 'Simple error';
    
    render(<ErrorMessage message={message} />);
    
    expect(screen.queryByText('Ver detalles')).not.toBeInTheDocument();
    expect(screen.queryByText('Ocultar detalles')).not.toBeInTheDocument();
  });

  it('handles empty errors array', () => {
    const message = 'Error';
    const errors: string[] = [];
    
    render(<ErrorMessage message={message} errors={errors} />);
    
    expect(screen.queryByText('Ver detalles')).not.toBeInTheDocument();
  });
});