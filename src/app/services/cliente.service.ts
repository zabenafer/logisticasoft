import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Cliente, ClienteCreate, ClienteUpdate } from '../models/cliente.model';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private clienteUrl = `${environment.apiUrl}/clientes`;

  constructor() {  }

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[] | null>(this.clienteUrl, { observe: 'response' })
      .pipe(map((r: HttpResponse<Cliente[] | null>) => r.body ?? []));
  }

  buscarPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.clienteUrl}/${id}`);
  }

  /** 🔥 Ya no se usa. Si alguien la llama, delegamos en listar(). */
  buscarPorIdTransportista(_transportistaId: number): Observable<Cliente[]> {
    return this.listar();
  }

  buscarAutocomplete(term: string, size = 10) {
    const params = { q: term, size: size.toString() };
    return this.http.get<Cliente[]>(`${this.clienteUrl}/buscarClientesAutocomplete`, { params });
  }

  crear(payload: ClienteCreate): Observable<Cliente> {
    return this.http.post<Cliente>(this.clienteUrl, payload);
  }

  actualizar(id: number, payload: ClienteUpdate): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.clienteUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.clienteUrl}/${id}`);
  }

  // opcional: búsqueda simple
  buscar(term: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.clienteUrl, { params: { q: term } });
  }
}
