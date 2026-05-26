import { Component } from '@angular/core';
import { Tracking } from '../../services/tracking';
import { SharedImports } from '../../material.module';
import { EnvioTracking } from '../../models/EnvioTracking.model';
import { EnvioStateService } from '../../services/envio-state.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type PortalType = 'cliente' | 'transportista' | 'deposito';

interface PortalCard {
  tipo: PortalType;
  titulo: string;
  descripcion: string;
  icono: string;
  clase: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SharedImports, CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent { 
  trackingNumber: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  portales: PortalCard[] = [
    {
      tipo: 'cliente',
      titulo: 'Portal de Clientes',
      descripcion: 'Consultá tus envíos y su estado en tiempo real.',
      icono: 'inventory_2',
      clase: 'card-cliente'
    },
    {
      tipo: 'transportista',
      titulo: 'Panel de Transportistas',
      descripcion: 'Gestioná envíos, rutas y estados.',
      icono: 'alt_route',
      clase: 'card-transportista'
    },
    {
      tipo: 'deposito',
      titulo: 'Gestión de Depósito',
      descripcion: 'Controlá paquetes, ingresos, egresos y movimientos internos del depósito.',
      icono: 'warehouse',
      clase: 'card-deposito'
    }
  ];

  constructor(
    private trackingService: Tracking,
    private envioState: EnvioStateService,
    private router: Router
  ) { }

  ingresarPortal(tipo: PortalType): void {
    this.router.navigate(['/login'], {
      queryParams: { portal: tipo }
    });
  }

  /**
   * Ejecuta la búsqueda del envío al hacer click en el botón.
   */
  buscarEnvio(): void {

    this.errorMessage = '';
    
    if (!this.trackingNumber.trim()) {
      this.errorMessage = 'Por favor, ingrese un número de seguimiento válido.';
      return;
    }

    // 2. Iniciar carga y llamar al servicio
    this.loading = true;
    
    this.trackingService.buscarEnvioPorNroSeguimiento(this.trackingNumber.trim())
      .subscribe({
        next: (response: EnvioTracking) => {
          this.loading = false;
          // 3. Manejar éxito
          this.envioState.setEnvio(response); // guardamos temporalmente el envío
          this.router.navigate(['/seguimiento', response.nroSeguimiento]);
        },
        error: (err) => {
          // 4. Manejar error
          this.loading = false;
          console.error('Error al buscar el envío:', err);

          // Lógica para mostrar un mensaje amigable al usuario
          if (err.status === 404) {
             this.errorMessage = `No se encontró el envío con número ${this.trackingNumber}. Verifique el número.`;
          } else {
             this.errorMessage = 'Ocurrió un error al conectar con el servidor. Intente más tarde.';
          }
        }
      });
  }
}
