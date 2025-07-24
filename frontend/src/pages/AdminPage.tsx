import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import AdminStudentList from '../components/AdminStudentList';
import EditStudentModal from '../components/EditStudentModal';
import { Student, authApi, studentApi, ApiError } from '../services/api';

interface AdminPageProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout, onNavigateHome }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedStudent(null);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedStudent(null);
    // Trigger refresh of student list
    setRefreshTrigger(prev => prev + 1);

    // Show success message
    setSnackbar({
      open: true,
      message: 'Estudiante actualizado exitosamente',
      severity: 'success',
    });
  };

  const handleDeleteStudent = async (student: Student) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar al participante ${student.nombre} ${student.apellido}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await studentApi.deleteStudent(student.id!);

      // Trigger refresh of student list
      setRefreshTrigger(prev => prev + 1);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Participante eliminado exitosamente',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      const apiError = error as ApiError;

      // Show error message
      setSnackbar({
        open: true,
        message: apiError.message || 'Error al eliminar el participante',
        severity: 'error',
      });
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await authApi.logout();
      onLogout();
    } catch (error) {
      const apiError = error as ApiError;
      setSnackbar({
        open: true,
        message: apiError.message || 'Error al cerrar sesión',
        severity: 'error',
      });
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Admin Header */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <AdminIcon sx={{ mr: 2 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            EduConnect - Panel de Administración
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: isMobile ? 1 : 2,
              alignItems: 'center'
            }}
          >
            {!isMobile && (
              <Button
                color="inherit"
                onClick={onNavigateHome}
                startIcon={<HomeIcon />}
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Vista Pública
              </Button>
            )}
            
            {isMobile ? (
              <IconButton
                color="inherit"
                onClick={handleLogout}
                disabled={logoutLoading}
                size="small"
              >
                <LogoutIcon />
              </IconButton>
            ) : (
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                variant="outlined"
                disabled={logoutLoading}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {logoutLoading ? 'Cerrando...' : 'Cerrar Sesión'}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="xl">
          {/* Admin Student Management Section */}
          <Paper elevation={2} sx={{ p: isMobile ? 2 : 3 }}>
            <AdminStudentList
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              refreshTrigger={refreshTrigger}
            />
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          px: 2, 
          mt: 'auto',
          backgroundColor: theme.palette.grey[100],
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2025 EduConnect - Panel de Administración
        </Typography>
      </Box>

      {/* Edit Student Modal */}
      <EditStudentModal
        open={editModalOpen}
        student={selectedStudent}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPage;