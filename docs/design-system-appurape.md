# AppuraPe Design System

Frontend base oficial para `C:\Users\NAYCOLL\IquitosDelivery\frontend\ops-app`.

## Base visual

- **Motor UI**: Tailwind CSS v4
- **Iconografía**: `lucide-angular`
- **Toasts**: `ngx-sonner`
- **Objetivo**: una sola identidad visual para cliente, comunidad, restaurante, driver y admin

## Paleta AppuraPe

- `primary-700`: `#e51b23`
- `primary-900`: `#06192b`
- `accent-500`: `#ff7a59`
- `surface-0`: `#fffdfb`
- `surface-soft`: `#fff7f5`
- `border`: `#eddad4`
- `text-muted`: `#667085`

Los tokens viven en `C:\Users\NAYCOLL\IquitosDelivery\frontend\ops-app\src\styles.css`.

## Componentes base

- `app-button`
  - Variantes: `primary`, `secondary`, `ghost`, `danger`
  - Tamaños: `sm`, `md`, `lg`
- `app-surface-card`
  - Variantes: `default`, `page`, `hero`, `soft`, `stat`
- `app-metric-card`
  - Para KPIs y resúmenes operativos
- `app-page-header`
  - Encabezado reusable con `eyebrow`, `title`, `subtitle`
- `app-notice`
  - Avisos `info`, `success`, `warning`, `danger`
- `app-status-badge`
  - Estados operativos y reputacionales

## Utilidades semánticas

La hoja `styles.css` expone utilidades de composición para no repetir cadenas largas:

- `page-shell`
- `page-card`
- `hero-card`
- `app-card`
- `stats-grid`
- `button-row`
- `auth-page`
- `auth-card`
- `preview-card`
- `message`

## Reglas

- Preferir componentes compartidos antes que nuevas clases sueltas.
- Preferir `app-button` sobre botones manuales en vistas nuevas.
- Preferir `app-surface-card` y `app-metric-card` para paneles y dashboards.
- No volver a introducir `styles:` ni `styleUrls` en componentes Angular.
- Si una pantalla necesita una nueva variante visual, agregarla al sistema primero.
