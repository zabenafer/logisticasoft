export type EstadoEnvio = 'Pendiente' | 'En camino' | 'Entregado' | 'Cancelado';
export type EstadoFiltro = 'Todos' | EstadoEnvio;

export interface ClienteEnvioEvento {
  id: number;
  estado: EstadoEnvio;
  fechaHora: string;
  observacion: string;
}

export interface ClienteEnvio {
  id: number;
  numeroSeguimiento: string;
  estado: EstadoEnvio;
  origen: string;
  destino: string;
  direccionOrigen: string;
  direccionDestino: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  horaEntregaDesde: string;
  horaEntregaHasta: string;
  cantidad: number | null;
  precio: number | null;
  transportista: string;
  eventos: ClienteEnvioEvento[];
}