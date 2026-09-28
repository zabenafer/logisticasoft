LogisticaSoft / Enviux — Instrucciones para agentes

Este proyecto es el frontend de LogisticaSoft / Enviux, una aplicación de seguimiento y gestión de envíos.

Stack
Angular standalone.
Angular Material.
SCSS.
SSR.
TypeScript.
Usar SharedImports desde src/app/material.module.ts cuando corresponda.
Rutas principales
/home
/login
/auth/callback
/seguimiento/:trackingNumber
/cliente
/dashboard
/deposito

El archivo principal de rutas es:

src/app/app.routes.ts
Autenticación

El proyecto usa Clerk-only.

No usar login local.
No usar JWT propio para login.
Las requests privadas usan token Clerk con Authorization: Bearer <token>.
El logout debe usar ClerkAuthService.signOut().
Después del logout limpiar AuthSessionService.
También remover ls_portal_intent de sessionStorage.
Luego navegar a /home.
Layout

No usar navbar global para los portales.

Cada portal tiene su propio layout:

Portal Cliente: topbar propio, colores azulados.
Portal Transportista/Admin: sidebar, colores verdes.
Portal Depósito: topbar propio, colores lilas/violetas.

El footer solo debe aparecer en /home y /seguimiento/:trackingNumber.

No debe aparecer en:

/login
/cliente
/dashboard
/deposito
Environment

environment.apiUrl ya incluye /api.

Correcto:

`${this.apiUrl}/clientes/me/envios`

Incorrecto:

`${this.apiUrl}/api/clientes/me/envios`
Reglas de trabajo
No modificar archivos que no sean necesarios.
No tocar login, guards ni dashboard cliente salvo que sea estrictamente necesario.
Mantener código simple, claro y mantenible.
Respetar la estructura actual del proyecto.
Usar componentes standalone.
Usar SCSS por componente.
Cuidar responsive mobile.
Evitar sobreingeniería.
Si una funcionalidad todavía no tiene backend, usar datos mock y dejar preparado para conectar luego.