import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedImports } from '../../../material.module';
import { DepositoEnvio, EstadoDepositoEnvio } from '../../../services/deposito-envio.service';

@Component({
  selector: 'app-deposito-envio-detalle-dialog',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './deposito-envio-detalle-dialog.html',
  styleUrl: './deposito-envio-detalle-dialog.scss'
})
export class DepositoEnvioDetalleDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<DepositoEnvioDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly envio: DepositoEnvio
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  estadoClass(estado: EstadoDepositoEnvio): string {
    switch (estado) {
      case 'Pendiente de recepción en depósito':
        return 'status-awaiting-reception';
      case 'Recibido en depósito':
        return 'status-received';
      case 'Pendiente de retiro':
        return 'status-pending';
      case 'Retirado por transportista':
        return 'status-picked-up';
      case 'En tránsito':
        return 'status-transit';
      case 'Recibido en depósito destino':
        return 'status-destination';
      case 'Listo para retirar':
        return 'status-ready';
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
