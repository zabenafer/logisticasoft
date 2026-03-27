import { Injectable } from '@angular/core';
import { EnvioTracking } from '../models/EnvioTracking.model';

@Injectable({
  providedIn: 'root'
})
export class EnvioStateService {
  private envioSeleccionado: EnvioTracking | null = null;

  setEnvio(envio: EnvioTracking) {
    this.envioSeleccionado = envio;
  }

  getEnvio(): EnvioTracking | null {
    return this.envioSeleccionado;
  }

  clear() {
    this.envioSeleccionado = null;
  }
}