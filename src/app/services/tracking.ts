import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EnvioTracking } from '../models/EnvioTracking.model';

@Injectable({
  providedIn: 'root'
})
export class Tracking {

  envioUrl = 'http://localhost:8080/api/envios';
  array = [];

  constructor(private httpClient: HttpClient) {  }

  public buscarEnvioPorNroSeguimiento(nroSeguimiento: String): Observable<EnvioTracking> {
    const trackingString = String(nroSeguimiento);
    return this.httpClient.get<EnvioTracking>(this.envioUrl + `/tracking/${nroSeguimiento}`);
  }
  
}
