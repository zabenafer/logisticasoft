import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedImports } from '../../../material.module';
import { ClienteEnvio, EstadoEnvio } from '../../../services/cliente-envio.service';

@Component({
  selector: 'app-cliente-envio-detalle-dialog',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './cliente-envio-detalle-dialog.html',
  styleUrl: './cliente-envio-detalle-dialog.scss'
})
export class ClienteEnvioDetalleDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ClienteEnvioDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly envio: ClienteEnvio
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  estadoClass(estado: EstadoEnvio): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-pending';
      case 'En camino':
        return 'status-progress';
      case 'Entregado':
        return 'status-delivered';
      case 'Cancelado':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  trackByEventoId(_: number, evento: { id: number }): number {
    return evento.id;
  }
}