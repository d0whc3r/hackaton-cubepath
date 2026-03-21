# hackaton-cubepath

Proyecto inicializado con **Astro 6** en **modo servidor (SSR)**, preparado para deploy en **Cloudflare Workers** y ejecución en contenedor para **Dockploy**.

## Requisitos

- Node.js >= 22.12.0
- pnpm 10+

## Scripts

- `pnpm dev`: desarrollo local
- `pnpm build`: build SSR para Cloudflare
- `pnpm preview`: preview del build en `0.0.0.0:8787`
- `pnpm generate-types`: genera `worker-configuration.d.ts` desde `wrangler.jsonc`
- `pnpm deploy`: build + deploy a Cloudflare Workers

## Deploy en Cloudflare Workers

1. Autentícate:
   - `pnpm dlx wrangler login`
2. Si cambias `wrangler.jsonc`, regenera tipos:
   - `pnpm generate-types`
3. Despliega:
   - `pnpm deploy`

## Uso con Dockploy (Docker)

El proyecto incluye `Dockerfile` y `.dockerignore`.

- Build de imagen:
  - `docker build -t hackaton-cubepath .`
- Run local:
  - `docker run --rm -p 8787:8787 hackaton-cubepath`

Dockploy puede usar este `Dockerfile` directamente para construir y ejecutar el servicio.
