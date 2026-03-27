
export interface EventoTracking {
  // El tipo LocalDateTime de Java llega como una cadena ISO 8601 (ej: "2025-10-03T18:30:00")
  fechaHora: Date; 
  estado: string;
  observacion: string; 
}