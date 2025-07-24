import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

interface HeaderProps {
  onRegistrationClick: () => void;
  onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRegistrationClick, onAdminClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        color: '#333333'
      }}
    >
      <Toolbar sx={{ minHeight: '64px', px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <SchoolIcon sx={{ color: '#1976d2', mr: 1, fontSize: '1.5rem' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#333333',
              fontSize: '1.25rem',
              letterSpacing: '0.5px'
            }}
          >
            EduConnect
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center'
          }}
        >
          <Button
            onClick={onAdminClick}
            startIcon={<AdminIcon />}
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              px: 2,
              py: 0.75,
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
              minWidth: isMobile ? 'auto' : '140px',
            }}
          >
            {isMobile ? 'Admin' : 'Administrar Cursos'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;