export type TipoPortal = 'ADMIN' | 'TRANSPORTISTA' | 'CLIENTE' | 'DEPOSITO' | 'SIN_ROL';

export type PortalType = 'cliente' | 'transportista' | 'deposito';

export interface MeDTO {
  userId: number;
  email: string;
  roles: string[];
  transportistaId: number | null;
  clienteId: number | null;
  depositoId: number | null;
  tipoPortal: TipoPortal;
}
