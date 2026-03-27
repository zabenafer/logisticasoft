import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environment';
import { EnvioCreate, EnvioDTO, EnvioUpdate } from '../models/envio.model';

export interface EstadoEnvio {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class EnviosService {
  private http = inject(HttpClient);
  private envioUrl = `${environment.apiUrl}/envios`;
  private estadoUrl = `${environment.apiUrl}/estados`;

  listarPorTransportista(): Observable<EnvioDTO[]> {
    return this.http.get<EnvioDTO[] | null>(this.envioUrl, { observe: 'response' })
      .pipe(map((r: HttpResponse<EnvioDTO[] | null>) => r.body ?? []));
  }

  buscarPorId(id: number): Observable<EnvioDTO> {
    return this.http.get<EnvioDTO>(`${this.envioUrl}/${id}`);
  }

  crear(payload: EnvioCreate): Observable<EnvioDTO> {
    return this.http.post<EnvioDTO>(this.envioUrl, payload);
  }

  actualizar(id: number, payload: EnvioUpdate): Observable<EnvioDTO> {
    return this.http.put<EnvioDTO>(`${this.envioUrl}/${id}`, payload);
  }

  eliminar(id: number, payload: EnvioUpdate): Observable<EnvioDTO> {
    return this.http.put<EnvioDTO>(`${this.envioUrl}/${id}`, payload);
  }

  // tracking público (si lo tenés)
  buscarPorNroSeguimiento(nro: string) {
    return this.http.get<EnvioDTO>(`${this.envioUrl}/seguimiento/${encodeURIComponent(nro)}`);
  }

  listarEstados(): Observable<EstadoEnvio[]> {
    return this.http.get<EstadoEnvio[]>(this.estadoUrl);
  }

  cambiarEstado(id: number, estadoId: number) {
    return this.http.patch<void>(`${this.envioUrl}/${id}/estado`, { estadoId });
  }
}
