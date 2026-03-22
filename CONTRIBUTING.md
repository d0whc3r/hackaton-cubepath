# Contributing

Thanks for contributing to SLM Router.

## Workflow

1. Fork the repo.
2. Create a branch from `main`.
3. Make focused changes.
4. Run checks locally.
5. Open a Pull Request.

## Branch naming

Use clear names, for example:

- `feat/task-pages-navigation`
- `fix/sse-parser-edge-case`
- `docs/readme-update`

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Required checks before PR

```bash
pnpm build
pnpm test
```

Optional but recommended:

```bash
pnpm lint
pnpm format:check
```

## PR guidelines

- Keep PRs small and reviewable.
- Explain what changed and why.
- Link related issues (for example: `Closes #123`).
- Add/adjust tests when behavior changes.
- Update docs when API, UX, or setup changes.

## Commit style

No strict commit convention is required, but prefer concise, imperative messages:

- `add task-specific pages`
- `fix sse dispatch order in app`

## Reporting issues

Use GitHub issue templates:

- Bug report
- Feature request

Include reproduction steps and expected behavior.
