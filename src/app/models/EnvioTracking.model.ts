import { EventoTracking } from "./EventoTracking.model";

export interface EnvioTracking {
  nroSeguimiento: string;
  estadoActual: string;
  nombreEmpresa: string;
  
  // Los tipos LocalTime de Java llegan como cadenas ISO 8601 (ej: "10:00:00")
  horaEntregaDesde: string; 
  horaEntregaHasta: string;
  
  direccionOrigen: string;
  localidadOrigen: string;
  provinciaOrigen: string;
  
  direccionDestino: string;
  localidadDestino: string;
  provinciaDestino: string;
  
  // La lista de eventos que detalla el historial
  eventos: EventoTracking[]; 
}