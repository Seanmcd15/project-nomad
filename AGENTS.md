# AGENTS.md

## Cursor Cloud specific instructions

Project N.O.M.A.D. is an AdonisJS 6 "Command Center" (backend + Inertia/React/Vite frontend) that
orchestrates containerized offline tools via Docker. All application code lives in `admin/`; run every
command below from `admin/` (scripts are defined in `admin/package.json`).

### Services that must be running
The update script only refreshes Node dependencies. MySQL and Redis are installed in the image but are
**not auto-started** on VM boot — start them before running the app, migrations, seeds, or the queue worker:

```bash
sudo service mysql start
sudo service redis-server start
```

- MySQL: database `nomad`, user `root` / password `password` (reachable over TCP at `127.0.0.1:3306`;
  the CLI's socket auth differs, so connect with `mysql -uroot -ppassword -h 127.0.0.1`). Data persists in
  the snapshot, so migrations/seed normally survive reboots.
- Redis: `127.0.0.1:6379`, used by BullMQ for all background queues.

### Required `.env` (gitignored)
`admin/.env` is gitignored and must exist. Note `admin/.env.example` is **incomplete**: `start/env.ts`
also requires a `URL` variable that the example omits. A working dev `.env` uses `DB_HOST=127.0.0.1`,
`REDIS_HOST=127.0.0.1`, `URL=http://localhost:8080`, and a real `APP_KEY` (generate with
`node ace generate:key`). **Leave `NOMAD_STORAGE_PATH` unset** so it defaults to
`/opt/project-nomad/storage` (already created and writable) — the `custom_app_guard` unit tests assume
that default path and fail if it is overridden.

### Run / test / build (all from `admin/`)
- Dev server: `npm run dev` (`node ace serve --hmr`) — serves on `0.0.0.0:8080`, `/` redirects to `/home`.
- Migrations/seed: `node ace migration:run --force` then `node ace db:seed` (fresh reset: `node ace migration:fresh --seed`).
- Background jobs: dispatched jobs (benchmarks, downloads, model-downloads, embeddings) only run when a
  worker is up: `npm run work:all`. Without it, e.g. a benchmark "runs" from the UI but never completes.
- Tests: `npm run test` (`node ace test`). Unit specs use Node's built-in `node:test` runner; the Japa run
  prints "NO TESTS EXECUTED" which is expected — the pass/fail counts in the TAP output are authoritative.
- Build: `npm run build` (`node ace build`, Vite + tsc).
- Lint: `npm run lint`. It currently reports many pre-existing Prettier violations on `main`; CI only runs
  `npm run build` (see `.github/workflows/build-admin-on-pr.yml`), not lint, so lint is not kept clean.

### Docker is optional for development
The app talks to Docker via `dockerode` (`/var/run/docker.sock`) to install/run the offline tool
containers. Docker is **not** required to boot the Command Center or to lint/test/build — boot logs a
harmless `connect ENOENT /var/run/docker.sock` error when Docker is absent. Only the tool-install/run
features need a Docker daemon.
