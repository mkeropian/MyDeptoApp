export interface rendDepGrid {
  departamento_id : number;
  departamento_nombre: string;
  calle: string;
  barrio: string;
  localidad: string;
  propietario: string;
  fecha: string;
  total_pagos: string;
  cantidad_pagos: string;
  total_gastos: number;
  cantidad_gastos: string;
  balance_fecha: number;
}

export interface rendPropGrid {
  propietario_nombre: number;
  propietario_id: string;
  propietario_email: string;
  propietario_telefono: string;
  fecha: string;
  total_pagos: number;
  cantidad_pagos: string;
  total_gastos: number;
  cantidad_gastos: string;
  balance_fecha: number;
  departamentos: string;
}
