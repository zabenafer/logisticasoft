import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap, throwError } from 'rxjs';
import { ClerkAuthService } from '../auth/clerk-auth.service';
import { EnvioDTO, EnvioEventoDTO } from '../models/envio.model';
import {
  ClienteEnvio,
  ClienteEnvioEvento,
  EstadoEnvio
} from '../models/cliente-envio.model';
import { environment } from '../../environment';

export type {
  ClienteEnvio,
  ClienteEnvioEvento,
  EstadoEnvio,
  EstadoFiltro
} from '../models/cliente-envio.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteEnvioService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly clerkAuth: ClerkAuthService
  ) {}

  listarMisEnvios(): Observable<ClienteEnvio[]> {
    return this.getWithAuth<EnvioDTO[]>(
      `${this.apiUrl}/clientes/me/envios`
    ).pipe(
      map(envios => envios.map(envio => this.mapToClienteEnvio(envio)))
    );
  }

  obtenerDetallePorId(id: number): Observable<ClienteEnvio> {
    return this.getWithAuth<EnvioDTO>(
      `${this.apiUrl}/clientes/me/envios/${id}`
    ).pipe(
      map(envio => this.mapToClienteEnvio(envio))
    );
  }

  obtenerDetallePorNumero(numeroSeguimiento: string): Observable<ClienteEnvio> {
    const numero = encodeURIComponent(numeroSeguimiento.trim());

    return this.getWithAuth<EnvioDTO>(
      `${this.apiUrl}/clientes/me/envios/numero/${numero}`
    ).pipe(
      map(envio => this.mapToClienteEnvio(envio))
    );
  }

  private getWithAuth<T>(url: string): Observable<T> {
    return from(this.clerkAuth.getToken()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('No hay token de Clerk disponible'));
        }

        return this.http.get<T>(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      })
    );
  }

  private mapToClienteEnvio(envio: EnvioDTO): ClienteEnvio {
    return {
      id: envio.id ?? 0,
      numeroSeguimiento: envio.nroSeguimiento ?? '',
      estado: this.mapEstado(envio.estadoActual),
      origen: this.armarUbicacion(
        envio.localidadOrigen,
        envio.provinciaOrigen,
        envio.paisOrigen
      ),
      destino: this.armarUbicacion(
        envio.localidadDestino,
        envio.provinciaDestino,
        envio.paisDestino
      ),
      direccionOrigen: envio.direccionOrigen ?? '-',
      direccionDestino: envio.direccionDestino ?? '-',
      fechaCreacion: this.formatearFecha(envio.fechaCreacion),
      ultimaActualizacion: this.formatearFechaHora(
        envio.fechaActualizacion ?? envio.fechaCreacion
      ),
      horaEntregaDesde: this.formatearHora(envio.horaEntregaDesde),
      horaEntregaHasta: this.formatearHora(envio.horaEntregaHasta),
      cantidad: envio.cantidad ?? null,
      precio: envio.precio ?? null,
      transportista: envio.nombreEmpresa ?? '-',
      eventos: this.mapEventos(envio.eventos ?? [])
    };
  }

  private mapEventos(eventos: EnvioEventoDTO[]): ClienteEnvioEvento[] {
    return eventos.map(evento => ({
      id: evento.id ?? 0,
      estado: this.mapEstado(evento.estado),
      fechaHora: this.formatearFechaHora(evento.fechaHora),
      observacion: evento.observacion ?? evento.descripcion ?? '-'
    }));
  }

  private armarUbicacion(
    localidad?: string,
    provincia?: string,
    pais?: string
  ): string {
    return [localidad, provincia, pais]
      .filter(Boolean)
      .join(', ') || '-';
  }

  private mapEstado(estado?: string): EstadoEnvio {
    const estadoNormalizado = this.normalizar(estado ?? '');

    if (estadoNormalizado.includes('camino')) {
      return 'En camino';
    }

    if (estadoNormalizado.includes('entregado')) {
      return 'Entregado';
    }

    if (estadoNormalizado.includes('cancelado')) {
      return 'Cancelado';
    }

    return 'Pendiente';
  }

  private formatearFecha(valor?: string): string {
    if (!valor) {
      return '-';
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return valor;
    }

    return new Intl.DateTimeFormat('es-AR').format(fecha);
  }

  private formatearFechaHora(valor?: string): string {
    if (!valor) {
      return '-';
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return valor;
    }

    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(fecha);
  }

  private formatearHora(valor?: string): string {
    if (!valor) {
      return '-';
    }

    const partes = valor.split(':');

    if (partes.length >= 2) {
      return `${partes[0]}:${partes[1]}`;
    }

    return valor;
  }

  private normalizar(valor: string): string {
    return valor
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}