import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface Provincia {
  id: number;
  nombre: string;
}

export interface Localidad {
  id: number;
  nombre: string;
  provinciaId: number;
  provincia?: string;
  paisId?: number;
  pais?: string;
}

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}`;

  listarProvincias(): Observable<Provincia[]> {
    return this.http.get<Provincia[]>(`${this.base}/provincias`);
  }

  buscarLocalidades(q: string, provinciaId?: number, page = 0, size = 10): Observable<Localidad[]> {
    let params = new HttpParams().set('q', q).set('page', page).set('size', size);
    if (provinciaId) params = params.set('provinciaId', provinciaId);
    return this.http.get<Localidad[]>(`${this.base}/localidades`, { params });
  }

  localidadPorId(id: number): Observable<Localidad> {
    return this.http.get<Localidad>(`${this.base}/localidades/${id}`);
  }
}
