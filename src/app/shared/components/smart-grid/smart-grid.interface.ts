export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'badge' | 'avatar' | 'date' | 'actions';
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  action: (item: any) => void;
}
