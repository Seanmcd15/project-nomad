# AGENTS.md

## Cursor Cloud specific instructions

Project N.O.M.A.D. is a single product: an AdonisJS 6 + React 19 (Inertia/Vite) app in
`admin/` called the "Command Center" that orchestrates Docker containers. All app commands
run from `admin/` (see `admin/package.json` scripts: `dev`, `build`, `start`, `test`,
`lint`, `typecheck`, `work:*`).

### Required backing services

The app needs **MySQL 8**, **Redis 7**, and a **Docker daemon** (its core job is managing
containers via `/var/run/docker.sock`). These are pre-installed in the VM snapshot but are
**not started automatically** (no systemd here, and the update script must not start
services). Start them at the beginning of a session if they are not already running:

```bash
# Redis
redis-server --daemonize yes --dir /tmp

# MySQL (socket dir must exist; connect over TCP, not the unix socket)
sudo mkdir -p /var/run/mysqld && sudo chown mysql:mysql /var/run/mysqld
sudo mysqld --daemonize --user=mysql

# Docker daemon (fuse-overlayfs + iptables-legacy are already configured in /etc/docker)
sudo dockerd >/tmp/dockerd.log 2>&1 &
sudo chmod 666 /var/run/docker.sock   # let the app user reach the socket
```

Verify: `redis-cli ping`, `mysqladmin ping`, `docker ps`.

MySQL `root` uses password `password` and there is a `nomad` database. If the `nomad`
database is missing (fresh MySQL data dir), recreate it and set the root password:

```bash
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password'; CREATE DATABASE IF NOT EXISTS nomad CHARACTER SET utf8mb4;"
```

### `admin/.env` (gitignored — recreate if missing)

`start/env.ts` validates env at boot and **requires `URL`, which is NOT in
`admin/.env.example`** — omitting it prevents startup. Use `DB_HOST=127.0.0.1` (TCP), not
`localhost` (which would try a unix socket the app user can't read). Leave
`NOMAD_STORAGE_PATH` unset so it defaults to `/opt/project-nomad/storage` (see next note).

```
TZ=UTC
PORT=8080
HOST=0.0.0.0
URL=http://localhost:8080
LOG_LEVEL=info
APP_KEY=CUF+j8immcY+QblBoAqPBRWSeYNuR0wo
NODE_ENV=development
SESSION_DRIVER=cookie
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_DATABASE=nomad
DB_PASSWORD=password
DB_SSL=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

The default storage dir must exist and be writable: `sudo mkdir -p /opt/project-nomad/storage && sudo chown -R "$(whoami)" /opt/project-nomad`.

### Running

The Docker entrypoint (`install/entrypoint.sh`) is production-only. In dev, run migrations
and seed manually the first time, then start the dev server:

```bash
cd admin
node ace migration:run --force
node ace db:seed
npm run dev          # HMR dev server on http://localhost:8080
```

Background queue workers (`npm run work:all`) are only needed to exercise downloads / model
downloads / benchmarks; they are not required for the UI to boot.

### Gotchas

- **`npm run lint` fails out of the box**: the committed source has many pre-existing
  `prettier/prettier` violations. CI (`.github/workflows/build-admin-on-pr.yml`) only runs
  `npm run build`, not lint — so treat lint failures as pre-existing, not caused by your
  change. `npm run typecheck` and `npm run test` are clean.
- Two `tests/unit/custom_app_guard.spec.ts` cases assume the default storage root
  (`/opt/project-nomad/storage`). Setting `NOMAD_STORAGE_PATH` to anything else makes them
  fail — keep it unset.
- Installing apps from the Supply Depot pulls real images from `ghcr.io`/Docker Hub, so the
  Docker daemon plus outbound internet must both be up.
