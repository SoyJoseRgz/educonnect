import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Divider,
  Pagination,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { studentApi, Student, ApiError } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import SearchComponent from './SearchComponent';
import { useNotification } from '../contexts/NotificationContext';
import { formatFullName, formatCurrency, formatDate } from '../utils/formatters';

interface AdminStudentListProps {
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  refreshTrigger?: number;
}



const AdminStudentList: React.FC<AdminStudentListProps> = ({
  onEditStudent,
  onDeleteStudent,
  refreshTrigger = 0
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showError, showSuccess } = useNotification();

  // Calculate pagination using filtered students
  const displayStudents = isSearching ? filteredStudents : students;
  const totalPages = Math.ceil(displayStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = displayStudents.slice(startIndex, endIndex);

  const fetchStudents = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);
      const data = await studentApi.getAdminStudents();
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
      
      // Show notification for authentication errors
      if (apiError.status === 401) {
        showError(
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          'Sesión Expirada'
        );
      } else if (apiError.status === 0 || errorMessage.toLowerCase().includes('conexión')) {
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
  }, [students.length, currentPage, totalPages]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchStudents();
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);

    // Scroll to top smoothly when changing pages, especially important on mobile
    if (isMobile) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // On desktop, scroll to the table/content area
      const contentElement = document.querySelector('[data-admin-content]');
      if (contentElement) {
        contentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  const handleStudentsPerPageChange = (event: any) => {
    setStudentsPerPage(event.target.value);
    setCurrentPage(1); // Reset to first page when changing items per page

    // Scroll to top smoothly, especially important on mobile
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
      const nombre = student.nombre || '';
      const apellido = student.apellido || '';
      const celular = student.celular || '';

      return (
        nombre.toLowerCase().includes(term) ||
        apellido.toLowerCase().includes(term) ||
        `${nombre} ${apellido}`.toLowerCase().includes(term) ||
        celular.includes(term)
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



  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completo':
        return 'success';
      case 'parcial':
        return 'warning';
      case 'pendiente':
      default:
        return 'error';
    }
  };





  // Pagination component with elegant styling
  const PaginationControls = () => (
    <Box>
      {/* Items per page selector - Only show on desktop or when needed */}
      {!isMobile && students.length > 10 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            p: 2,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
            Mostrar:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={studentsPerPage}
              onChange={handleStudentsPerPageChange}
              sx={{
                borderRadius: '8px',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e5e5e5',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4285f4',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4285f4',
                },
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
            estudiantes por página
          </Typography>
          <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem', ml: 2 }}>
            ({startIndex + 1}-{Math.min(endIndex, displayStudents.length)} de {displayStudents.length}
            {isSearching && ` | Total: ${students.length}`})
          </Typography>
        </Box>
      )}

      {/* Main pagination - Same style as PublicPage */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#666666',
                borderRadius: '12px',
                fontWeight: 500,
                minWidth: isMobile ? '32px' : '40px',
                height: isMobile ? '32px' : '40px',
                margin: '0 2px',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
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

      {/* Mobile-friendly items per page selector */}
      {isMobile && students.length > 5 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1.5,
            mt: 2,
            p: 2,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.75rem' }}>
            Ver:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 60 }}>
            <Select
              value={studentsPerPage}
              onChange={handleStudentsPerPageChange}
              sx={{
                borderRadius: '8px',
                fontSize: '0.75rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e5e5e5',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4285f4',
                },
              }}
            >
              <MenuItem value={5} sx={{ fontSize: '0.75rem' }}>5</MenuItem>
              <MenuItem value={10} sx={{ fontSize: '0.75rem' }}>10</MenuItem>
              <MenuItem value={20} sx={{ fontSize: '0.75rem' }}>20</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.75rem' }}>
            por página ({startIndex + 1}-{Math.min(endIndex, displayStudents.length)} de {displayStudents.length}
            {isSearching && ` | Total: ${students.length}`})
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (loading) {
    return (
      <LoadingSpinner 
        message="Cargando estudiantes..." 
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
        onGoHome={() => window.location.href = '/'}
        errorCode={retryCount > 0 ? `ADMIN_RETRY_${retryCount}` : undefined}
      />
    );
  }

  if (students.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        <PersonIcon
          sx={{
            fontSize: 64,
            color: '#cccccc',
            mb: 2
          }}
        />
        <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 600 }} gutterBottom>
          No hay estudiantes registrados
        </Typography>
        <Typography variant="body2" sx={{ color: '#666666' }}>
          Los estudiantes aparecerán aquí cuando se registren
        </Typography>
      </Paper>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <Box data-admin-content>
        {/* Total Students Card */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, color: '#666666', fontSize: '0.875rem' }}>
            Total de Estudiantes
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            {students.length}
          </Typography>
        </Paper>

        {/* Search Component */}
        <SearchComponent
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
          resultsCount={filteredStudents.length}
          totalCount={students.length}
        />

        {/* Students List Title */}
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1a1a1a', fontSize: '1.125rem' }}>
          Lista de Estudiantes:
        </Typography>

        <Stack spacing={2}>
          {currentStudents.map((student) => (
            <Card
              key={student.id}
              elevation={0}
              sx={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {formatFullName(student.nombre, student.apellido)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => onEditStudent(student)}
                      size="small"
                      sx={{
                        backgroundColor: '#f0f7ff',
                        color: '#4285f4',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => onDeleteStudent(student)}
                      size="small"
                      sx={{
                        backgroundColor: '#ffebee',
                        color: '#f44336',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#ffcdd2',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Stack spacing={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        backgroundColor: '#f0f7ff',
                        borderRadius: '8px',
                        p: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: '1rem', color: '#4285f4' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                      {student.celular}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        backgroundColor: '#f0f7ff',
                        borderRadius: '8px',
                        p: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <LocationIcon sx={{ fontSize: '1rem', color: '#4285f4' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                      {student.ciudad}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        backgroundColor: '#f0f7ff',
                        borderRadius: '8px',
                        p: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <SchoolIcon sx={{ fontSize: '1rem', color: '#4285f4' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                      {student.curso}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1, borderColor: '#e5e5e5' }} />

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          backgroundColor: '#f0f7ff',
                          borderRadius: '8px',
                          p: 0.75,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <PaymentIcon sx={{ fontSize: '1rem', color: '#4285f4' }} />
                      </Box>
                      <Chip
                        label={student.estadoPago || 'pendiente'}
                        size="small"
                        color={getPaymentStatusColor(student.estadoPago || 'pendiente') as any}
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                      {formatCurrency(student.cantidadPago || 0)}
                    </Typography>
                  </Box>

                  {student.fechaRegistro && (
                    <Typography variant="caption" sx={{ color: '#666666', fontSize: '0.75rem' }}>
                      Registrado: {formatDate(student.fechaRegistro)}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Pagination Controls */}
        {students.length > 0 && <PaginationControls />}
      </Box>
    );
  }

  // Desktop table view
  return (
    <Box data-admin-content>
      {/* Total Students Card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" sx={{ mb: 1, color: '#666666', fontSize: '0.875rem' }}>
          Total de Estudiantes
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          {students.length}
        </Typography>
      </Paper>

      {/* Search Component */}
      <SearchComponent
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        resultsCount={filteredStudents.length}
        totalCount={students.length}
      />

      {/* Students List Title */}
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1a1a1a', fontSize: '1.125rem' }}>
        Lista de Estudiantes:
      </Typography>

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
          maxHeight: '500px',
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
        <Table sx={{ minWidth: 650 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Nombre
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Apellido
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Teléfono
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Ciudad
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Curso
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Estado Pago
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Cantidad
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Registro
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e5e5e5',
                fontSize: '0.875rem'
              }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentStudents.map((student, index) => (
              <TableRow
                key={student.id}
                sx={{
                  backgroundColor: (startIndex + index) % 2 === 0 ? '#ffffff' : '#fafbfc',
                  '&:hover': {
                    backgroundColor: '#f0f7ff',
                    transform: 'scale(1.001)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  borderBottom: '1px solid #e5e5e5',
                }}
              >
                <TableCell sx={{
                  color: '#1a1a1a',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  py: 2
                }}>
                  {formatFullName(student.nombre, '')}
                </TableCell>
                <TableCell sx={{
                  color: '#1a1a1a',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  py: 2
                }}>
                  {formatFullName('', student.apellido)}
                </TableCell>
                <TableCell sx={{
                  color: '#666666',
                  fontSize: '0.875rem',
                  py: 2
                }}>
                  {student.celular}
                </TableCell>
                <TableCell sx={{
                  color: '#666666',
                  fontSize: '0.875rem',
                  py: 2
                }}>
                  {student.ciudad}
                </TableCell>
                <TableCell sx={{
                  color: '#666666',
                  fontSize: '0.875rem',
                  py: 2
                }}>
                  {student.curso}
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Chip
                    label={student.estadoPago || 'pendiente'}
                    size="small"
                    color={getPaymentStatusColor(student.estadoPago || 'pendiente') as any}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                </TableCell>
                <TableCell sx={{
                  color: '#1a1a1a',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 2
                }}>
                  {formatCurrency(student.cantidadPago || 0)}
                </TableCell>
                <TableCell sx={{
                  color: '#666666',
                  fontSize: '0.75rem',
                  py: 2
                }}>
                  {student.fechaRegistro ? formatDate(student.fechaRegistro) : '-'}
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => onEditStudent(student)}
                      size="small"
                      sx={{
                        backgroundColor: '#f0f7ff',
                        color: '#4285f4',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => onDeleteStudent(student)}
                      size="small"
                      sx={{
                        backgroundColor: '#ffebee',
                        color: '#f44336',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#ffcdd2',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      {students.length > 0 && <PaginationControls />}
    </Box>
  );
};

export default AdminStudentList;