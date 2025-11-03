/**
 * Mapa de colores para roles conocidos
 */
export const ROLE_COLOR_MAP: { [key: string]: string } = {
  'admin': 'bg-blue-500 text-white',
  'prop': 'bg-green-500 text-white',
  'emp': 'bg-amber-500 text-white',
  'gerenciadora': 'bg-purple-500 text-white'
};

/**
 * Paleta de colores para roles futuros (fallback)
 */
const FALLBACK_COLORS = [
  'bg-pink-500 text-white',
  'bg-cyan-500 text-white',
  'bg-red-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-orange-500 text-white',
  'bg-lime-500 text-white',
  'bg-violet-500 text-white'
];

/**
 * Obtiene las clases CSS del badge según el rol
 * @param rolNombre Nombre del rol (ej: 'admin', 'prop')
 * @param rolId ID del rol (usado como fallback si no existe en el mapa)
 * @returns String con las clases CSS (ej: 'bg-blue-500 text-white')
 */
export function getRoleBadgeColor(rolNombre: string, rolId: number = 0): string {
  if (!rolNombre) {
    return 'bg-gray-500 text-white';
  }

  // Primero buscar en el mapa de colores conocidos
  const normalizedName = rolNombre.toLowerCase().trim();
  if (ROLE_COLOR_MAP[normalizedName]) {
    return ROLE_COLOR_MAP[normalizedName];
  }

  // Si no existe, usar color de la paleta de fallback basado en el ID
  if (rolId > 0) {
    const index = (rolId - 1) % FALLBACK_COLORS.length;
    return FALLBACK_COLORS[index];
  }

  // Último fallback: gris
  return 'bg-gray-500 text-white';
}

/**
 * Formatea el nombre del rol para mostrar
 * @param rolNombre Nombre del rol
 * @returns Nombre formateado con primera letra mayúscula
 */
export function formatRoleName(rolNombre: string): string {
  if (!rolNombre) return 'Sin rol';

  // Capitalizar primera letra
  return rolNombre.charAt(0).toUpperCase() + rolNombre.slice(1).toLowerCase();
}
