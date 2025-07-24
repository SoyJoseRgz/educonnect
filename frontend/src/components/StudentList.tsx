import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { studentApi, PublicStudent, ApiError } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import SearchComponent from './SearchComponent';
import { useNotification } from '../contexts/NotificationContext';
import { formatFullName } from '../utils/formatters';

interface StudentListProps {
  refreshTrigger?: number; // Used to trigger refresh after new registration
  onRegistrationClick: () => void;
}

// Enlace único para el taller
const TALLER_ZOOM_LINK = 'https://meet.jit.si/taller-evangelizacion-miss#jwt=%22eyJhbGciOiJSUzI1NiIsImtpZCI6IjZkZTQwZjA0ODgxYzZhMDE2MTFlYjI4NGE0Yzk1YTI1MWU5MTEyNTAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSm9zZSBFZHVhcmRvIFJvZHJpZ3VleiBSdWl6IiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pOdHBUQjFxZnlyaFluYi1lM2F6ZEFWN195Q3ktTGRaSUFzZlRCNjhUSmZHeUdYandpPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL21lZXQtaml0LXNpLTY2Y2JkIiwiYXVkIjoibWVldC1qaXQtc2ktNjZjYmQiLCJhdXRoX3RpbWUiOjE3MzE5NTY2ODgsInVzZXJfaWQiOiJvaGp5SEhjYTM2TXhybHhZeURYakpFS3ZlYjkyIiwic3ViIjoib2hqeUhIY2EzNk14cmx4WXlEWGpKRUt2ZWI5MiIsImlhdCI6MTc1MzM4MjQzNCwiZXhwIjoxNzUzMzg2MDM0LCJlbWFpbCI6Impvc2VyZ3pydWl6QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTAxNjE0MjczODQ1MzA4Njc4NDUwIl0sImVtYWlsIjpbImpvc2VyZ3pydWl6QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.K10b_nVAH301Nn-NGt-kOvgrMfOBMvryh4C_F_UwloWr7oG2biB-iAq2OlLwaXRpI5sId5EaesGe8WahFlhjr2sXa1cQ5hPJG4WMHTXI6Fl5QqVDGVCk9Qem-ZyhwjwwyZuByyHNteTTkFzNztSxkHwm207fXMREXmoMQYv4y9ax0rDkIn3xqvnp7WyTclga0ivKC93LAsn9rIlODFs29wptXApEmSoO0lX2rafn9mtRI-Ym2dSAViXpL-K4HWIXj8a5X43jbk3XpwlQ8dJj4GNWFsfLadYCQh02dSWLt38yPph1Nj47FRLpAX1TW0SYdnKSe_0A3q4orpPxq2V5Ww%22';

const StudentList: React.FC<StudentListProps> = ({ refreshTrigger = 0, onRegistrationClick }) => {
  const [students, setStudents] = useState<PublicStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<PublicStudent[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  const { showError, showSuccess } = useNotification();

  // Calculate pagination using filtered students
  const displayStudents = isSearching ? filteredStudents : students;
  const totalPages = Math.ceil(displayStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = displayStudents.slice(startIndex, endIndex);

  const handleTallerAccess = () => {
    window.open(TALLER_ZOOM_LINK, '_blank');
  };

  const fetchStudents = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);
      const data = await studentApi.getPublicStudents();
      setStudents(data);
      
      // Show success message only on retry
      if (retryCount > 0) {
        showSuccess('Lista de estudiantes actualizada correctamente');
        setRetryCount(0);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Error al cargar la lista de estudiantes';
      setError(errorMessage);
      
      // Show notification for network errors
      if (apiError.status === 0 || errorMessage.toLowerCase().includes('conexión')) {
        showError(
          errorMessage,
          'Error de Conexión',
          {
            label: 'Reintentar',
            onClick: handleRetry
          }
        );
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStudents();
    // Clear search when refreshing
    setSearchTerm('');
    setIsSearching(false);
    setFilteredStudents([]);
  }, [refreshTrigger]);

  // Reset to first page when students list changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [displayStudents.length, currentPage, totalPages]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchStudents();
  };

  // Search functions
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      // If search term is empty, show all students
      setIsSearching(false);
      setFilteredStudents([]);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = students.filter(student => {
      // Ensure properties exist and are strings
      const nombre = student?.nombre || '';
      const apellido = student?.apellido || '';
      const celular = student?.celular || '';
      const curso = student?.curso || '';

      return (
        nombre.toLowerCase().includes(term) ||
        apellido.toLowerCase().includes(term) ||
        `${nombre} ${apellido}`.toLowerCase().includes(term) ||
        celular.includes(term) ||
        curso.toLowerCase().includes(term)
      );
    });

    setFilteredStudents(filtered);
    setIsSearching(true);
    setCurrentPage(1); // Reset to first page when searching

    // Scroll to top after search
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [searchTerm, students]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
    setFilteredStudents([]);
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <LoadingSpinner 
        message="Cargando lista de estudiantes..." 
        size={50}
        timeout={8000}
        onTimeout={() => {
          showError(
            'La carga está tardando más de lo esperado. Verifica tu conexión a internet.',
            'Carga Lenta'
          );
        }}
      />
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        title="Error al cargar estudiantes"
        onRetry={handleRetry}
        retryText="Recargar lista"
        showRecoveryOptions={true}
        onGoHome={() => window.location.reload()}
        errorCode={retryCount > 0 ? `RETRY_${retryCount}` : undefined}
      />
    );
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  if (students.length === 0) {
    return (
      <Box>
        {/* Stats and Access Section */}
        <Box sx={{
          display: 'flex',
          gap: { xs: 2, md: 3 },
          mb: 4,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' } // Columna en móvil, fila en tablet+
        }}>
          {/* Total Students Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              minWidth: { xs: '140px', md: '160px' }
            }}
          >
            <Typography variant="body2" sx={{ mb: 1, color: '#666666', fontSize: '0.75rem' }}>
              Total de Participantes
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              0
            </Typography>
          </Paper>

          {/* Taller Access Button */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: '#4285f4',
              border: '1px solid #4285f4',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
              textAlign: 'center',
              minWidth: { xs: '140px', md: '160px' },
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#3367d6',
                boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
                transform: 'translateY(-1px)'
              }
            }}
            onClick={handleTallerAccess}
          >
            <VideoCallIcon sx={{ color: 'white', mb: 0.5, fontSize: '1.2rem' }} />
            <Typography variant="body2" sx={{ mb: 0.5, color: 'white', fontSize: '0.75rem', fontWeight: 500 }}>
              Da clic aqui para
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>
              Entrar al Taller
            </Typography>
          </Paper>
        </Box>

        {/* Registration Button */}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={onRegistrationClick}
          sx={{
            backgroundColor: '#4285f4',
            color: 'white',
            textTransform: 'none',
            borderRadius: '24px',
            fontSize: '0.875rem',
            fontWeight: 500,
            px: 4,
            py: 1.5,
            mb: 4,
            boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
            '&:hover': {
              backgroundColor: '#3367d6',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
            },
          }}
        >
          Registrarte como Estudiante
        </Button>

        {/* Empty State */}
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Typography variant="h6" sx={{ color: '#333333', mb: 1, fontWeight: 600 }}>
            No hay estudiantes registrados
          </Typography>
          <Typography variant="body2" sx={{ color: '#666666' }}>
            Sé el primero en registrarte a un taller
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats and Access Section */}
      <Box sx={{
        display: 'flex',
        gap: { xs: 2, md: 3 },
        mb: 4,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        flexDirection: { xs: 'column', sm: 'row' } // Columna en móvil, fila en tablet+
      }}>
        {/* Total Students Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            minWidth: { xs: '140px', md: '160px' }
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, color: '#666666', fontSize: '0.75rem' }}>
            Total de Participantes
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            {students.length}
          </Typography>
        </Paper>

        {/* Taller Access Button */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            backgroundColor: '#4285f4',
            border: '1px solid #4285f4',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
            textAlign: 'center',
            minWidth: { xs: '140px', md: '160px' },
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#3367d6',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
              transform: 'translateY(-1px)'
            }
          }}
          onClick={handleTallerAccess}
        >
          <VideoCallIcon sx={{ color: 'white', mb: 0.5, fontSize: '1.2rem' }} />
          <Typography variant="body2" sx={{ mb: 0.5, color: 'white', fontSize: '0.75rem', fontWeight: 500 }}>
            Acceso al Taller
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>
            Entrar al Taller
          </Typography>
        </Paper>
      </Box>

      {/* Search Component */}
      <SearchComponent
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        resultsCount={filteredStudents.length}
        totalCount={students.length}
        placeholder="Buscar por nombre, curso o número celular..."
        title="Buscar Participantes"
      />

      {/* Registration Button */}
      <Button
        variant="contained"
        startIcon={<PersonAddIcon />}
        onClick={onRegistrationClick}
        sx={{
          backgroundColor: '#4285f4',
          color: 'white',
          textTransform: 'none',
          borderRadius: '24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          px: 4,
          py: 1.5,
          mb: 4,
          boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
          '&:hover': {
            backgroundColor: '#3367d6',
            boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
          },
        }}
      >
        Registrarte como Estudiante
      </Button>

      {/* Students List Title */}
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1a1a1a', fontSize: '1.125rem' }}>
        Lista de Participantes:
      </Typography>

      {/* Students Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          mb: 4,
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          // Altura responsiva: más alta en desktop, automática en móvil
          maxHeight: {
            xs: 'none', // En móvil no limitar altura
            sm: 'none', // En tablet tampoco
            md: '500px' // Solo en desktop y arriba
          },
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #e5e5e5',
                  fontSize: '0.875rem',
                  py: { xs: 1.5, md: 2.5 } // Menos padding en móvil
                }}
              >
                Nombre
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #e5e5e5',
                  fontSize: '0.875rem',
                  py: { xs: 1.5, md: 2.5 } // Menos padding en móvil
                }}
              >
                Taller
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentStudents.map((student, index) => (
              <TableRow
                key={student.id}
                sx={{
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                    transition: 'background-color 0.2s ease'
                  },
                  borderBottom: index === currentStudents.length - 1 ? 'none' : '1px solid #f0f0f0'
                }}
              >
                <TableCell sx={{
                  py: { xs: 2, md: 3 }, // Menos padding en móvil
                  color: '#333333',
                  fontSize: { xs: '0.85rem', md: '0.9rem' }, // Texto más pequeño en móvil
                  fontWeight: 500
                }}>
                  {formatFullName(student.nombre, student.apellido)}
                </TableCell>
                <TableCell sx={{
                  py: { xs: 2, md: 3 }, // Menos padding en móvil
                  color: '#666666',
                  fontSize: { xs: '0.8rem', md: '0.85rem' }, // Texto más pequeño en móvil
                  fontWeight: 400
                }}>
                  {student.curso}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="medium"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#666666',
                borderRadius: '12px',
                fontWeight: 500,
                minWidth: '40px',
                height: '40px',
                margin: '0 2px',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: '1px solid #4285f4',
                  boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
                  '&:hover': {
                    backgroundColor: '#3367d6',
                    boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
                  },
                },
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e5e5e5',
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default StudentList;