import { MatPaginatorIntl } from '@angular/material/paginator';

export function getMinimalPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = '';           // oculto
  intl.nextPageLabel = 'Siguiente';      // accesibilidad
  intl.previousPageLabel = 'Anterior';
  intl.firstPageLabel = '';
  intl.lastPageLabel = '';
  intl.getRangeLabel = () => '';         // 🔹 sin “1–25 de 120”
  return intl;
}
