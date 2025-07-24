import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface SearchComponentProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  isSearching: boolean;
  resultsCount: number;
  totalCount: number;
  placeholder?: string;
  title?: string;
  showResultsInfo?: boolean;
}

const SearchComponent = React.memo<SearchComponentProps>(({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onClearSearch,
  isSearching,
  resultsCount,
  totalCount,
  placeholder = "Buscar por nombre o número celular...",
  title = "Buscar Estudiantes",
  showResultsInfo = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 2.5 : 3,
        mb: 3,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e5e5',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '1rem' : '1.125rem' }}>
        {title}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: isMobile ? 1.5 : 2,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-start'
      }}>
        <TextField
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
          variant="outlined"
          size={isMobile ? "small" : "medium"}
          fullWidth
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#fafafa',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&.Mui-focused': {
                backgroundColor: '#ffffff',
                boxShadow: '0 0 0 2px rgba(66, 133, 244, 0.2)',
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666666', fontSize: isMobile ? '1.125rem' : '1.25rem' }} />
                </InputAdornment>
              ),
            }
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={onSearch}
            size={isMobile ? "small" : "medium"}
            startIcon={<SearchIcon />}
            sx={{
              backgroundColor: '#4285f4',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: isMobile ? 2.5 : 3,
              py: isMobile ? 1 : 1.25,
              fontSize: isMobile ? '0.875rem' : '1rem',
              boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
              '&:hover': {
                backgroundColor: '#3367d6',
                boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
              },
            }}
          >
            Buscar
          </Button>
          
          {(isSearching || searchTerm) && (
            <Button
              variant="outlined"
              onClick={onClearSearch}
              size={isMobile ? "small" : "medium"}
              startIcon={<ClearIcon />}
              sx={{
                borderRadius: '12px',
                borderColor: '#e0e0e0',
                color: '#666666',
                textTransform: 'none',
                fontWeight: 500,
                px: isMobile ? 2 : 2.5,
                py: isMobile ? 1 : 1.25,
                fontSize: isMobile ? '0.875rem' : '1rem',
                '&:hover': {
                  borderColor: '#d0d0d0',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Limpiar
            </Button>
          )}
        </Box>
      </Box>
      
      {isSearching && showResultsInfo && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f7ff', borderRadius: '8px', border: '1px solid #e3f2fd' }}>
          <Typography variant="body2" sx={{ color: '#1565c0', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            📊 Mostrando {resultsCount} resultado{resultsCount !== 1 ? 's' : ''} 
            de {totalCount} estudiante{totalCount !== 1 ? 's' : ''} total{totalCount !== 1 ? 'es' : ''}
            {searchTerm && ` para "${searchTerm}"`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
});

SearchComponent.displayName = 'SearchComponent';

export default SearchComponent;
