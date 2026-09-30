import { Component, Inject, computed, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedImports } from '../../../material.module';
import {
  DepositoEnvio,
  DepositoEnvioService,
  EstadoDepositoEnvio
} from '../../../services/deposito-envio.service';

interface DepositoRecepcionDialogData {
  nombreDeposito: string;
}

@Component({
  selector: 'app-deposito-recepcion-dialog',
  standalone: true,
  imports: [SharedImports],
  templateUrl: './deposito-recepcion-dialog.html',
  styleUrl: './deposito-recepcion-dialog.scss'
})
export class DepositoRecepcionDialogComponent {
  readonly numeroSeguimiento = signal('');
  readonly envio = signal<DepositoEnvio | null>(null);
  readonly busquedaRealizada = signal(false);
  readonly buscando = signal(false);
  readonly confirmando = signal(false);
  readonly mensajeError = signal('');

  readonly mensajeBloqueo = computed(() => {
    const envio = this.envio();

    if (!envio) {
      return '';
    }

    switch (envio.estado) {
      case 'Pendiente de recepción en depósito':
        return '';
      case 'Recibido en depósito':
        return 'Este envío ya fue recibido en depósito.';
      case 'Pendiente de retiro':
        return 'Este envío ya se encuentra en depósito y está pendiente de retiro.';
      case 'Retirado por transportista':
        return 'Este envío ya fue retirado por el transportista.';
      case 'En tránsito':
        return 'Este envío ya se encuentra en tránsito.';
      case 'Recibido en depósito destino':
        return 'Este envío ya fue recibido en el depósito destino.';
      case 'Listo para retirar':
        return 'Este envío ya está listo para retirar.';
      case 'Entregado':
        return 'Este envío ya fue entregado.';
      case 'Cancelado':
        return 'Este envío está cancelado.';
      default:
        return 'Este envío no puede recepcionarse en depósito.';
    }
  });

  readonly puedeConfirmar = computed(
    () => this.envio()?.estado === 'Pendiente de recepción en depósito'
  );

  constructor(
    private readonly dialogRef: MatDialogRef<
      DepositoRecepcionDialogComponent,
      DepositoEnvio | undefined
    >,
    private readonly depositoEnvioService: DepositoEnvioService,
    @Inject(MAT_DIALOG_DATA) readonly data: DepositoRecepcionDialogData
  ) {}

  onNumeroSeguimientoChange(value: string): void {
    this.numeroSeguimiento.set(value.toUpperCase());
    this.envio.set(null);
    this.busquedaRealizada.set(false);
    this.mensajeError.set('');
  }

  buscarEnvio(): void {
    const numeroSeguimiento = this.numeroSeguimiento().trim();

    this.envio.set(null);
    this.busquedaRealizada.set(true);
    this.mensajeError.set('');

    if (!numeroSeguimiento) {
      this.mensajeError.set('Ingresá un número de seguimiento.');
      return;
    }

    this.buscando.set(true);

    this.depositoEnvioService.buscarPorNumeroSeguimiento(numeroSeguimiento).subscribe({
      next: envio => {
        this.buscando.set(false);

        if (!envio) {
          this.mensajeError.set('No encontramos un envío con ese número de seguimiento.');
          return;
        }

        this.envio.set(envio);
      },
      error: error => {
        console.error('Error buscando envío para recepción', error);
        this.buscando.set(false);
        this.mensajeError.set('No pudimos buscar el envío. Volvé a intentarlo.');
      }
    });
  }

  confirmarRecepcion(): void {
    const envio = this.envio();

    if (!envio || !this.puedeConfirmar() || this.confirmando()) {
      return;
    }

    this.confirmando.set(true);
    this.mensajeError.set('');

    this.depositoEnvioService
      .recepcionarEnvioExistente(envio.numeroSeguimiento, this.data.nombreDeposito)
      .subscribe({
        next: envioActualizado => {
          this.confirmando.set(false);
          this.dialogRef.close(envioActualizado);
        },
        error: error => {
          console.error('Error confirmando recepción de envío', error);
          this.confirmando.set(false);
          this.mensajeError.set(
            error instanceof Error
              ? error.message
              : 'No pudimos confirmar la recepción del envío.'
          );
        }
      });
  }

  cancelar(): void {
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
}
