export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'badge' | 'avatar' | 'date' | 'actions' | 'html';
  truncate?: boolean; // NUEVO: para activar tooltip y truncate
  align?: 'left' | 'center' | 'right'; // NUEVO: alineación de texto
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  action: (item: any) => void;
  // Nuevas propiedades opcionales para botones dinámicos
  getLabel?: (item: any) => string;
  getIcon?: (item: any) => string;
  getClass?: (item: any) => string;
}
