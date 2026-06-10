import { Injectable } from '@angular/core';

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
  transportista: string;
  eventos: ClienteEnvioEvento[];
}

@Injectable({
  providedIn: 'root'
})
export class ClienteEnvioService {
  private readonly envios: ClienteEnvio[] = [
    {
      id: 1,
      numeroSeguimiento: 'MNZ00000021',
      estado: 'En camino',
      origen: 'Villa María, Córdoba',
      destino: 'Córdoba Capital, Córdoba',
      direccionOrigen: 'Av. Alem 123',
      direccionDestino: 'Bv. San Juan 850',
      fechaCreacion: '09/06/2026',
      ultimaActualizacion: '09/06/2026 14:30',
      horaEntregaDesde: '10:00',
      horaEntregaHasta: '14:00',
      transportista: 'Mondez Transporte',
      eventos: [
        {
          id: 1,
          estado: 'Pendiente',
          fechaHora: '09/06/2026 09:00',
          observacion: 'El envío fue registrado.'
        },
        {
          id: 2,
          estado: 'En camino',
          fechaHora: '09/06/2026 14:30',
          observacion: 'El envío salió a reparto.'
        }
      ]
    },
    {
      id: 2,
      numeroSeguimiento: 'MNZ00000018',
      estado: 'Entregado',
      origen: 'Villa Nueva, Córdoba',
      destino: 'Rosario, Santa Fe',
      direccionOrigen: 'San Martín 455',
      direccionDestino: 'Mitre 1200',
      fechaCreacion: '08/06/2026',
      ultimaActualizacion: '08/06/2026 18:20',
      horaEntregaDesde: '15:00',
      horaEntregaHasta: '19:00',
      transportista: 'Mondez Transporte',
      eventos: [
        {
          id: 1,
          estado: 'Pendiente',
          fechaHora: '08/06/2026 10:15',
          observacion: 'El envío fue registrado.'
        },
        {
          id: 2,
          estado: 'En camino',
          fechaHora: '08/06/2026 15:40',
          observacion: 'El envío salió a reparto.'
        },
        {
          id: 3,
          estado: 'Entregado',
          fechaHora: '08/06/2026 18:20',
          observacion: 'El envío fue entregado correctamente.'
        }
      ]
    },
    {
      id: 3,
      numeroSeguimiento: 'MNZ00000016',
      estado: 'Pendiente',
      origen: 'Villa María, Córdoba',
      destino: 'Río Cuarto, Córdoba',
      direccionOrigen: 'Entre Ríos 320',
      direccionDestino: 'Belgrano 750',
      fechaCreacion: '07/06/2026',
      ultimaActualizacion: '07/06/2026 11:10',
      horaEntregaDesde: '09:00',
      horaEntregaHasta: '13:00',
      transportista: 'Mondez Transporte',
      eventos: [
        {
          id: 1,
          estado: 'Pendiente',
          fechaHora: '07/06/2026 11:10',
          observacion: 'El envío fue registrado y está pendiente de despacho.'
        }
      ]
    }
  ];

  listarMisEnvios(): ClienteEnvio[] {
    return [...this.envios];
  }

  buscarPorId(id: number): ClienteEnvio | undefined {
    return this.envios.find(envio => envio.id === id);
  }

  buscarPorNumeroSeguimiento(numeroSeguimiento: string): ClienteEnvio | undefined {
    const numeroNormalizado = this.normalizar(numeroSeguimiento);

    return this.envios.find(envio =>
      this.normalizar(envio.numeroSeguimiento) === numeroNormalizado
    );
  }

  private normalizar(valor: string): string {
    return valor
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}