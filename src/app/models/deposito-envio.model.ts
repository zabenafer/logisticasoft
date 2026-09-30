export type EstadoDepositoEnvio =
  | 'Pendiente de recepción en depósito'
  | 'Recibido en depósito'
  | 'Pendiente de retiro'
  | 'Retirado por transportista'
  | 'En tránsito'
  | 'Recibido en depósito destino'
  | 'Listo para retirar'
  | 'Entregado'
  | 'Cancelado';

export type EstadoDepositoFiltro = 'Todos' | EstadoDepositoEnvio;

export interface DepositoEnvioEvento {
  id: number;
  estado: EstadoDepositoEnvio;
  fechaHora: string;
  descripcion: string;
  operador: string;
}

export interface DepositoEnvio {
  id: number;
  numeroSeguimiento: string;
  cliente: string;
  estado: EstadoDepositoEnvio;
  transportista: string;
  depositoActual: string;
  origen: string;
  direccionOrigen: string;
  destino: string;
  direccionDestino: string;
  fechaRecepcion: string;
  ultimaActualizacion: string;
  recibidoHoy: boolean;
  eventos: DepositoEnvioEvento[];
}
