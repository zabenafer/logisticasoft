// Lo que devuelve el backend (READ)
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;

  // IDs que enviamos/recibimos
  localidadId?: number | null;
  transportistaId?: number | null;

  // Campos "derivados"/de solo lectura
  localidad?: string | null;
  provincia?: string | null;
  pais?: string | null;
}

// Payload para crear (POST) — hacé requeridos los que tu backend exige
export type ClienteCreate = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  localidadId?: number | null;
};

// Payload para actualizar (PUT/PATCH)
export type ClienteUpdate = Partial<ClienteCreate>;
