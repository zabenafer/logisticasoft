import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EnvioTracking } from '../../models/EnvioTracking.model';
import { EnvioStateService } from '../../services/envio-state.service';
import { SharedImports } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [SharedImports, CommonModule, FormsModule, RouterLink],
  templateUrl: './seguimiento.html',
  styleUrls: ['./seguimiento.scss']
})
export class SeguimientoComponent implements OnInit {
  envio: EnvioTracking | null = null;
  estadoActualIndex: number = -1;

  constructor(
    private envioState: EnvioStateService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.envio = this.envioState.getEnvio();

    if (this.envio?.eventos?.length) {
      // 🔹 Buscar el índice del evento que coincide con el estado actual
      this.estadoActualIndex = this.envio.eventos.findIndex(
        e => e.estado === this.envio!.estadoActual
      );
    }

    // Si el usuario recarga y no hay datos guardados, redirigir
    if (!this.envio) {
      const nro = this.route.snapshot.paramMap.get('trackingNumber');
      if (nro) {
        console.warn('Datos perdidos, recargaría la info desde el backend');
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
