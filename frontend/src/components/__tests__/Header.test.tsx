import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from '../Header';

// Mock Material UI theme
const theme = createTheme();

// Helper function to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock props
const mockProps = {
  onRegistrationClick: jest.fn(),
  onAdminClick: jest.fn(),
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with title and buttons', () => {
    renderWithTheme(<Header {...mockProps} />);

    expect(screen.getByText('EduConnect')).toBeInTheDocument();
    expect(screen.getByText('Registro al Curso')).toBeInTheDocument();
    expect(screen.getByText('Administrar Curso')).toBeInTheDocument();
  });

  it('calls onRegistrationClick when registration button is clicked', () => {
    renderWithTheme(<Header {...mockProps} />);

    const registrationButton = screen.getByText('Registro al Curso');
    fireEvent.click(registrationButton);

    expect(mockProps.onRegistrationClick).toHaveBeenCalledTimes(1);
  });

  it('calls onAdminClick when admin button is clicked', () => {
    renderWithTheme(<Header {...mockProps} />);

    const adminButton = screen.getByText('Administrar Curso');
    fireEvent.click(adminButton);

    expect(mockProps.onAdminClick).toHaveBeenCalledTimes(1);
  });

  it('displays icons in buttons', () => {
    renderWithTheme(<Header {...mockProps} />);

    // Check for PersonAdd icon in registration button
    expect(screen.getByTestId('PersonAddIcon')).toBeInTheDocument();
    
    // Check for Admin icon in admin button
    expect(screen.getByTestId('AdminPanelSettingsIcon')).toBeInTheDocument();
  });

  it('has proper button styling and accessibility', () => {
    renderWithTheme(<Header {...mockProps} />);

    const registrationButton = screen.getByText('Registro al Curso');
    const adminButton = screen.getByText('Administrar Curso');

    expect(registrationButton).toBeInTheDocument();
    expect(adminButton).toBeInTheDocument();
    
    // Both buttons should be clickable
    expect(registrationButton).not.toBeDisabled();
    expect(adminButton).not.toBeDisabled();
  });
});