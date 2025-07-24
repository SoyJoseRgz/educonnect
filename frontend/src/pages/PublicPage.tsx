import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import Header from '../components/Header';
import StudentList from '../components/StudentList';
import RegistrationModal from '../components/RegistrationModal';

const PublicPage: React.FC = () => {
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const handleRegistrationClick = () => {
    setRegistrationModalOpen(true);
  };

  const handleAdminClick = () => {
    navigate('/login');
  };

  const handleRegistrationClose = () => {
    setRegistrationModalOpen(false);
  };

  const handleRegistrationSuccess = () => {
    setRegistrationModalOpen(false);
    // Trigger refresh of student list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Header 
        onRegistrationClick={handleRegistrationClick}
        onAdminClick={handleAdminClick}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 5,
          backgroundColor: '#f8f9fa',
          minHeight: 'calc(100vh - 64px)',
          backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)'
        }}
      >
        <Container maxWidth="md">
          {/* Page Title */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 2,
                fontSize: { xs: '1.875rem', md: '2.25rem' },
                letterSpacing: '-0.025em'
              }}
            >
              Registro a talleres de evangelización
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666666',
                fontSize: '1.125rem',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              Participantes inscritos a cursos online.
            </Typography>
          </Box>

          {/* Student List Section */}
          <StudentList
            refreshTrigger={refreshTrigger}
            onRegistrationClick={handleRegistrationClick}
          />
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: 'auto',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          borderTop: '1px solid #e5e5e5',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <Typography variant="body2" sx={{
          color: '#8e8e93',
          fontSize: '0.875rem',
          fontWeight: 400
        }}>
          © 2025 EduConnect. Todos los derechos reservados.
        </Typography>
      </Box>

      {/* Registration Modal */}
      <RegistrationModal
        open={registrationModalOpen}
        onClose={handleRegistrationClose}
        onSuccess={handleRegistrationSuccess}
      />
    </Box>
  );
};

export default PublicPage;