export interface EnvioEventoDTO {
  id?: number;
  fechaHora?: string;          // ISO (LocalDateTime del backend)
  estado?: string;             // texto del evento
  descripcion?: string;
  ubicacion?: string;          // opcional
}

export interface EnvioDTO {
  id?: number;
  nroSeguimiento?: string;     // read-only (lo genera backend)
  estadoId?: number;
  estadoActual?: string;
  fechaCreacion?: string;      // ISO
  fechaActualizacion?: string; // ISO
  horaEntregaDesde?: string;   // "HH:mm:ss"
  horaEntregaHasta?: string;   // "HH:mm:ss"

  cantidad?: number | null;
  precio?: number | null;

  clienteId: number;
  clienteNombre?: string;
  transportistaId: number;
  nombreEmpresa?: string;

  localidadOrigenId: number;
  direccionOrigen: string;
  localidadOrigen?: string;
  provinciaOrigen?: string;
  paisOrigen?: string;

  localidadDestinoId: number;
  direccionDestino: string;
  localidadDestino?: string;
  provinciaDestino?: string;
  paisDestino?: string;

  eventos?: EnvioEventoDTO[];
}

/** Payloads de crear/actualizar (idénticos salvo que crear no lleva id/nroSeguimiento) */
export type EnvioCreate = Omit<EnvioDTO, 'id' | 'nroSeguimiento' | 'fechaCreacion' | 'fechaActualizacion' | 'eventos'> & { eventos?: never };
export type EnvioUpdate = Partial<EnvioCreate>;
