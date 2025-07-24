import React from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'EduConnect',
  showHeader = true 
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {showHeader && (
          <AppBar position="static" elevation={2}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {title}
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        
        <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Container maxWidth="lg">
            {children}
          </Container>
        </Box>
        
        <Box 
          component="footer" 
          sx={{ 
            py: 2, 
            px: 2, 
            mt: 'auto',
            backgroundColor: (theme) => theme.palette.grey[100],
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2025 EduConnect - Sistema de Gestión de Estudiantes
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;