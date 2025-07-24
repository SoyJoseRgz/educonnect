import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../App';

// Mock the API
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockGetCurrentAdmin = jest.fn();

jest.mock('../services/api', () => ({
    authApi: {
        login: mockLogin,
        logout: mockLogout,
        getCurrentAdmin: mockGetCurrentAdmin,
    },
    studentsApi: {
        getPublicStudents: jest.fn().mockResolvedValue([]),
        getAdminStudents: jest.fn().mockResolvedValue([]),
        createStudent: jest.fn(),
        updateStudent: jest.fn(),
    },
}));

const theme = createTheme();

const renderApp = (initialEntries = ['/']) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </MemoryRouter>
    );
};

describe('Navigation Flow Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default to not authenticated
        mockGetCurrentAdmin.mockRejectedValue(new Error('Not authenticated'));
    });

    it('navigates from public page to login when "Administrar Curso" is clicked', async () => {
        renderApp();

        // Wait for public page to load
        await waitFor(() => {
            expect(screen.getByText('Bienvenido a EduConnect')).toBeInTheDocument();
        });

        // Click "Administrar Curso" button
        const adminButton = screen.getByText('Administrar Curso');
        fireEvent.click(adminButton);

        // Should navigate to login page
        await waitFor(() => {
            expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
            expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
        });
    });

    it('navigates back to public page from login when back button is clicked', async () => {
        renderApp(['/login']);

        // Wait for login page to load
        await waitFor(() => {
            expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
        });

        // Click back button
        const backButton = screen.getByRole('button', { name: /volver/i });
        fireEvent.click(backButton);

        // Should navigate back to public page
        await waitFor(() => {
            expect(screen.getByText('Bienvenido a EduConnect')).toBeInTheDocument();
        });
    });

    it('redirects to login when accessing admin route without authentication', async () => {
        renderApp(['/admin']);

        // Should redirect to login page
        await waitFor(() => {
            expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
            expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
        });
    });

    it('shows admin page when user is authenticated', async () => {
        // Mock authenticated user
        mockGetCurrentAdmin.mockResolvedValue({ id: 1, email: 'admin@test.com' });

        renderApp(['/admin']);

        // Should show admin page
        await waitFor(() => {
            expect(screen.getByText('EduConnect - Panel de Administración')).toBeInTheDocument();
            expect(screen.getByText('Gestiona la información completa de los estudiantes')).toBeInTheDocument();
        });
    });

    it('redirects unknown routes to public page', async () => {
        renderApp(['/unknown-route']);

        // Should redirect to public page
        await waitFor(() => {
            expect(screen.getByText('Bienvenido a EduConnect')).toBeInTheDocument();
        });
    });
});