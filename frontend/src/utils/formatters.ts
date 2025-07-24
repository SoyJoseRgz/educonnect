/**
 * Utility functions for formatting data
 */

/**
 * Formats a name to proper case (first letter of each word capitalized)
 * Example: "jose eduardo rodriguez" -> "Jose Eduardo Rodriguez"
 */
export const formatName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
};

/**
 * Formats full name (first name + last name)
 * Example: formatFullName("jose eduardo", "rodriguez ruiz") -> "Jose Eduardo Rodriguez Ruiz"
 */
export const formatFullName = (firstName: string, lastName: string): string => {
  const formattedFirst = formatName(firstName);
  const formattedLast = formatName(lastName);
  
  if (!formattedFirst && !formattedLast) {
    return '';
  }
  
  if (!formattedFirst) {
    return formattedLast;
  }
  
  if (!formattedLast) {
    return formattedFirst;
  }
  
  return `${formattedFirst} ${formattedLast}`;
};

/**
 * Formats currency to Colombian Pesos
 * Example: 50000 -> "$50.000"
 */
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats date to Colombian format
 * Example: "2024-01-15" -> "15 ene 2024"
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) {
    return '';
  }

  try {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Formats phone number for display
 * Example: "3001234567" -> "300 123 4567"
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Format as XXX XXX XXXX if it's 10 digits
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  
  // Return original if not 10 digits
  return phone;
};

/**
 * Capitalizes first letter of a string
 * Example: "pendiente" -> "Pendiente"
 */
export const capitalize = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
