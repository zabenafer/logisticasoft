import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  DepositoEnvio,
  EstadoDepositoEnvio
} from '../models/deposito-envio.model';

export type {
  DepositoEnvio,
  DepositoEnvioEvento,
  EstadoDepositoEnvio,
  EstadoDepositoFiltro
} from '../models/deposito-envio.model';

@Injectable({
  providedIn: 'root'
})
export class DepositoEnvioService {
  private readonly envios: DepositoEnvio[] = [
    {
      id: 1,
      numeroSeguimiento: 'ENVX-DEP-00081',
      cliente: 'Sofía Pereyra',
      estado: 'Recibido en depósito',
      transportista: 'Andes Cargo',
      depositoActual: 'Depósito Palermo',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Av. Córdoba 4210',
      destino: 'Córdoba Capital, Córdoba',
      direccionDestino: 'Bv. San Juan 880',
      fechaRecepcion: '15/09/2026, 09:10',
      ultimaActualizacion: '15/09/2026, 09:34',
      recibidoHoy: true,
      eventos: [
        this.evento(101, 'Recibido en depósito', '15/09/2026, 09:10', 'Paquete recibido y etiquetado en mostrador.'),
        this.evento(102, 'Recibido en depósito', '15/09/2026, 09:34', 'Ubicado temporalmente en sector A-03.')
      ]
    },
    {
      id: 2,
      numeroSeguimiento: 'ENVX-DEP-00082',
      cliente: 'Marcos Núñez',
      estado: 'Pendiente de recepción en depósito',
      transportista: 'Rápido Sur',
      depositoActual: 'Pendiente de ingreso en Depósito Palermo',
      origen: 'Belgrano, CABA',
      direccionOrigen: 'Moldes 1840',
      destino: 'La Plata, Buenos Aires',
      direccionDestino: 'Calle 50 720',
      fechaRecepcion: '-',
      ultimaActualizacion: '15/09/2026, 10:25',
      recibidoHoy: false,
      eventos: [
        this.evento(201, 'Pendiente de recepción en depósito', '15/09/2026, 10:25', 'Envío creado y pendiente de recepción física en depósito.')
      ]
    },
    {
      id: 3,
      numeroSeguimiento: 'ENVX-DEP-00083',
      cliente: 'Lucía Ferreyra',
      estado: 'Retirado por transportista',
      transportista: 'Norte Express',
      depositoActual: 'Depósito Palermo',
      origen: 'Villa Crespo, CABA',
      direccionOrigen: 'Gurruchaga 940',
      destino: 'Rosario, Santa Fe',
      direccionDestino: 'San Lorenzo 1325',
      fechaRecepcion: '14/09/2026, 17:05',
      ultimaActualizacion: '15/09/2026, 08:55',
      recibidoHoy: false,
      eventos: [
        this.evento(301, 'Recibido en depósito', '14/09/2026, 17:05', 'Recepción con embalaje verificado.'),
        this.evento(302, 'Pendiente de retiro', '14/09/2026, 17:18', 'Orden listo para retiro de transportista.'),
        this.evento(303, 'Retirado por transportista', '15/09/2026, 08:55', 'Retirado por unidad NE-214.')
      ]
    },
    {
      id: 4,
      numeroSeguimiento: 'ENVX-DEP-00084',
      cliente: 'Camila Duarte',
      estado: 'En tránsito',
      transportista: 'Andes Cargo',
      depositoActual: 'En ruta a Mendoza Centro',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Av. Santa Fe 3660',
      destino: 'Mendoza Capital, Mendoza',
      direccionDestino: 'San Martín 1144',
      fechaRecepcion: '13/09/2026, 12:40',
      ultimaActualizacion: '15/09/2026, 07:20',
      recibidoHoy: false,
      eventos: [
        this.evento(401, 'Recibido en depósito', '13/09/2026, 12:40', 'Paquete ingresado al depósito de origen.'),
        this.evento(402, 'Retirado por transportista', '14/09/2026, 09:15', 'Retiro confirmado por Andes Cargo.'),
        this.evento(403, 'En tránsito', '15/09/2026, 07:20', 'Unidad en tránsito hacia depósito destino.')
      ]
    },
    {
      id: 5,
      numeroSeguimiento: 'ENVX-DEP-00085',
      cliente: 'Federico Salas',
      estado: 'Recibido en depósito destino',
      transportista: 'Centro Logístico',
      depositoActual: 'Depósito Córdoba Centro',
      origen: 'Caballito, CABA',
      direccionOrigen: 'Av. Rivadavia 5120',
      destino: 'Córdoba Capital, Córdoba',
      direccionDestino: 'Duarte Quirós 320',
      fechaRecepcion: '12/09/2026, 16:30',
      ultimaActualizacion: '15/09/2026, 11:05',
      recibidoHoy: false,
      eventos: [
        this.evento(501, 'Recibido en depósito', '12/09/2026, 16:30', 'Ingreso en depósito de origen.'),
        this.evento(502, 'En tránsito', '14/09/2026, 08:10', 'Traslado interurbano iniciado.'),
        this.evento(503, 'Recibido en depósito destino', '15/09/2026, 11:05', 'Recibido en depósito Córdoba Centro.')
      ]
    },
    {
      id: 6,
      numeroSeguimiento: 'ENVX-DEP-00086',
      cliente: 'Natalia Ibarra',
      estado: 'Listo para retirar',
      transportista: 'Rápido Sur',
      depositoActual: 'Depósito La Plata',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Paraguay 4601',
      destino: 'La Plata, Buenos Aires',
      direccionDestino: 'Diagonal 74 900',
      fechaRecepcion: '11/09/2026, 13:15',
      ultimaActualizacion: '15/09/2026, 12:10',
      recibidoHoy: false,
      eventos: [
        this.evento(601, 'Recibido en depósito', '11/09/2026, 13:15', 'Paquete recibido en origen.'),
        this.evento(602, 'Recibido en depósito destino', '14/09/2026, 18:30', 'Paquete en depósito destino.'),
        this.evento(603, 'Listo para retirar', '15/09/2026, 12:10', 'Disponible para retiro por destinatario.')
      ]
    },
    {
      id: 7,
      numeroSeguimiento: 'ENVX-DEP-00087',
      cliente: 'Diego Aguirre',
      estado: 'Entregado',
      transportista: 'Norte Express',
      depositoActual: 'Depósito Rosario Norte',
      origen: 'Recoleta, CABA',
      direccionOrigen: 'Juncal 2200',
      destino: 'Rosario, Santa Fe',
      direccionDestino: 'Pellegrini 1550',
      fechaRecepcion: '10/09/2026, 15:50',
      ultimaActualizacion: '14/09/2026, 16:45',
      recibidoHoy: false,
      eventos: [
        this.evento(701, 'Recibido en depósito', '10/09/2026, 15:50', 'Ingreso validado por operador.'),
        this.evento(702, 'Listo para retirar', '14/09/2026, 10:20', 'Destinatario notificado para retiro.'),
        this.evento(703, 'Entregado', '14/09/2026, 16:45', 'Entregado con conformidad del destinatario.')
      ]
    },
    {
      id: 8,
      numeroSeguimiento: 'ENVX-DEP-00088',
      cliente: 'Valentina Moya',
      estado: 'Cancelado',
      transportista: 'Sin asignar',
      depositoActual: 'Depósito Palermo',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Thames 1885',
      destino: 'Neuquén Capital, Neuquén',
      direccionDestino: 'Av. Argentina 210',
      fechaRecepcion: '15/09/2026, 08:20',
      ultimaActualizacion: '15/09/2026, 08:48',
      recibidoHoy: true,
      eventos: [
        this.evento(801, 'Recibido en depósito', '15/09/2026, 08:20', 'Recepción iniciada en mostrador.'),
        this.evento(802, 'Cancelado', '15/09/2026, 08:48', 'Cancelado por solicitud del cliente antes de asignar transportista.')
      ]
    },
    {
      id: 9,
      numeroSeguimiento: 'ENVX-DEP-00089',
      cliente: 'Valentina Moya',
      estado: 'Cancelado',
      transportista: 'Correo Argentino',
      depositoActual: 'Depósito Palermo',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Thames 1885',
      destino: 'Neuquén Capital, Neuquén',
      direccionDestino: 'Av. Argentina 210',
      fechaRecepcion: '15/09/2026, 08:20',
      ultimaActualizacion: '15/09/2026, 08:48',
      recibidoHoy: true,
      eventos: [
        this.evento(801, 'Recibido en depósito', '15/09/2026, 08:20', 'Recepción iniciada en mostrador.'),
        this.evento(802, 'Cancelado', '15/09/2026, 08:48', 'Cancelado por solicitud del cliente antes de asignar transportista.')
      ]
    },
    {
      id: 10,
      numeroSeguimiento: 'ENVX-DEP-00090',
      cliente: 'Valentina Moya',
      estado: 'Cancelado',
      transportista: 'Mondez',
      depositoActual: 'Depósito Palermo',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Thames 1885',
      destino: 'Neuquén Capital, Neuquén',
      direccionDestino: 'Av. Argentina 210',
      fechaRecepcion: '15/09/2026, 08:20',
      ultimaActualizacion: '15/09/2026, 08:48',
      recibidoHoy: true,
      eventos: [
        this.evento(801, 'Recibido en depósito', '15/09/2026, 08:20', 'Recepción iniciada en mostrador.'),
        this.evento(802, 'Cancelado', '15/09/2026, 08:48', 'Cancelado por solicitud del cliente antes de asignar transportista.')
      ]
    },
    {
      id: 11,
      numeroSeguimiento: 'ENVX-DEP-00091',
      cliente: 'Valentina Moya',
      estado: 'Cancelado',
      transportista: 'Sin asignar',
      depositoActual: 'Depósito Palermo',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Thames 1885',
      destino: 'Neuquén Capital, Neuquén',
      direccionDestino: 'Av. Argentina 210',
      fechaRecepcion: '15/09/2026, 08:20',
      ultimaActualizacion: '15/09/2026, 08:48',
      recibidoHoy: true,
      eventos: [
        this.evento(801, 'Recibido en depósito', '15/09/2026, 08:20', 'Recepción iniciada en mostrador.'),
        this.evento(802, 'Cancelado', '15/09/2026, 08:48', 'Cancelado por solicitud del cliente antes de asignar transportista.')
      ]
    },
    {
      id: 12,
      numeroSeguimiento: 'ENVX-DEP-00092',
      cliente: 'Valentina Moya',
      estado: 'Cancelado',
      transportista: 'Sin asignar',
      depositoActual: 'Depósito Palermo',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Thames 1885',
      destino: 'Neuquén Capital, Neuquén',
      direccionDestino: 'Av. Argentina 210',
      fechaRecepcion: '15/09/2026, 08:20',
      ultimaActualizacion: '15/09/2026, 08:48',
      recibidoHoy: true,
      eventos: [
        this.evento(801, 'Recibido en depósito', '15/09/2026, 08:20', 'Recepción iniciada en mostrador.'),
        this.evento(802, 'Cancelado', '15/09/2026, 08:48', 'Cancelado por solicitud del cliente antes de asignar transportista.')
      ]
    },
    {
      id: 13,
      numeroSeguimiento: 'ENVX-DEP-00093',
      cliente: 'Valentina Moya',
      estado: 'Cancelado',
      transportista: 'Sin asignar',
      depositoActual: 'Depósito Palermo',
      origen: 'Palermo, CABA',
      direccionOrigen: 'Thames 1885',
      destino: 'Neuquén Capital, Neuquén',
      direccionDestino: 'Av. Argentina 210',
      fechaRecepcion: '15/09/2026, 08:20',
      ultimaActualizacion: '15/09/2026, 08:48',
      recibidoHoy: true,
      eventos: [
        this.evento(801, 'Recibido en depósito', '15/09/2026, 08:20', 'Recepción iniciada en mostrador.'),
        this.evento(802, 'Cancelado', '15/09/2026, 08:48', 'Cancelado por solicitud del cliente antes de asignar transportista.')
      ]
    }
  ];

  listarEnvios(): Observable<DepositoEnvio[]> {
    return of(this.envios.map(envio => this.clonarEnvio(envio)));
  }

  obtenerDetallePorId(id: number): Observable<DepositoEnvio> {
    const envio = this.envios.find(item => item.id === id);

    if (!envio) {
      return throwError(() => new Error('No se encontró el envío de depósito.'));
    }

    return of(this.clonarEnvio(envio));
  }

  buscarPorNumeroSeguimiento(numeroSeguimiento: string): Observable<DepositoEnvio | null> {
    const numeroNormalizado = this.normalizarNumeroSeguimiento(numeroSeguimiento);
    const envio = this.envios.find(
      item => this.normalizarNumeroSeguimiento(item.numeroSeguimiento) === numeroNormalizado
    );

    return of(envio ? this.clonarEnvio(envio) : null);
  }

  recepcionarEnvioExistente(
    numeroSeguimiento: string,
    depositoActual: string
  ): Observable<DepositoEnvio> {
    const numeroNormalizado = this.normalizarNumeroSeguimiento(numeroSeguimiento);
    const envio = this.envios.find(
      item => this.normalizarNumeroSeguimiento(item.numeroSeguimiento) === numeroNormalizado
    );

    if (!envio) {
      return throwError(() => new Error('No encontramos un envío con ese número de seguimiento.'));
    }

    if (!this.puedeRecepcionarseEnOrigen(envio)) {
      return throwError(() => new Error(this.mensajeRecepcionBloqueada(envio.estado)));
    }

    const fechaHora = this.formatearFechaHora(new Date());

    envio.estado = 'Recibido en depósito';
    envio.depositoActual = depositoActual;
    envio.fechaRecepcion = fechaHora;
    envio.ultimaActualizacion = fechaHora;
    envio.recibidoHoy = true;
    envio.eventos.push({
      id: this.siguienteEventoId(envio),
      estado: 'Recibido en depósito',
      fechaHora,
      descripcion: 'Paquete recibido físicamente en el depósito.',
      operador: 'Depósito'
    });

    return of(this.clonarEnvio(envio));
  }

  private evento(
    id: number,
    estado: EstadoDepositoEnvio,
    fechaHora: string,
    descripcion: string
  ) {
    return {
      id,
      estado,
      fechaHora,
      descripcion,
      operador: 'Operador depósito'
    };
  }

  private clonarEnvio(envio: DepositoEnvio): DepositoEnvio {
    return {
      ...envio,
      eventos: envio.eventos.map(evento => ({ ...evento }))
    };
  }

  private puedeRecepcionarseEnOrigen(envio: DepositoEnvio): boolean {
    return envio.estado === 'Pendiente de recepción en depósito';
  }

  private mensajeRecepcionBloqueada(estado: EstadoDepositoEnvio): string {
    switch (estado) {
      case 'Recibido en depósito':
        return 'Este envío ya fue recibido en depósito.';
      case 'Pendiente de retiro':
        return 'Este envío ya se encuentra en depósito y está pendiente de retiro.';
      case 'Retirado por transportista':
        return 'Este envío ya fue retirado por el transportista.';
      case 'En tránsito':
        return 'Este envío ya se encuentra en tránsito.';
      case 'Recibido en depósito destino':
        return 'Este envío ya fue recibido en el depósito destino.';
      case 'Listo para retirar':
        return 'Este envío ya está listo para retirar.';
      case 'Entregado':
        return 'Este envío ya fue entregado.';
      case 'Cancelado':
        return 'Este envío está cancelado.';
      default:
        return 'Este envío no puede recepcionarse en depósito.';
    }
  }

  private siguienteEventoId(envio: DepositoEnvio): number {
    return Math.max(...envio.eventos.map(evento => evento.id), 0) + 1;
  }

  private normalizarNumeroSeguimiento(numeroSeguimiento: string): string {
    return numeroSeguimiento.trim().toUpperCase();
  }

  private formatearFechaHora(fecha: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  }
}
