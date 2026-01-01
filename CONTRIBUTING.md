# Contributing

## General Rules
- No migrations. Schema changes are applied manually (CREATE TABLE / ALTER TABLE).
- Keep changes small and incremental.
- Prefer consistent naming and existing folder structure.

## Backend Patterns
- Sequelize models follow `super.init` pattern.
- Controllers use try/catch and return `{ ok: true|false }`.
- Pagination standard: `page`, `limit` (cap 200), `offset`.
- Inventory routes protected by `AuthMiddleware`.

### Inventory
- Public IPs table: `hosts_server_ips`
    - Status: `free | reserved | assigned`
    - `blocked` is NOT used here (infra only)
    - DC comes from server table `hosts_servers.dc`
- Infra IPs table: `infra_ips`
    - Status includes `blocked`

## Frontend Patterns
- Use services (`src/services/*`) for API calls (axios base).
- Use SelectSearch for any value that should not be typed manually.
- Favor Mode B interaction: select → confirm/save.

## UX
- Maintain Design B style: gradients, icons everywhere, rounded containers.
- Ensure dropdowns/modals work with overflow and stacking contexts.

## Continuation Key
When handing over sessions, reference:
> continuar vm-panel — inventory dc + public ips vm select
