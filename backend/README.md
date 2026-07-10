# BioFlux Backend

This backend service provides the BioFlux API and connects to a MySQL database.

## Requirements

- Node.js
- MySQL server
- `npm`

## Install dependencies

From the `backend` folder:

```powershell
npm install
```

## Environment configuration

Copy the environment example to a real `.env` file:

```powershell
copy .env.example .env
```

Edit `.env` to set your MySQL connection values:

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=leo=stark
DB_NAME=bioflux_db
DB_PORT=3306
PORT=5000
JWT_SECRET=bioflux_student_secret
```

The backend reads `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` from `.env`.
It also supports `DATABASE_URL` and `DB_SSL=true` for hosted MySQL services such as Aiven.

For Render, using `DATABASE_URL` is recommended to avoid credential mistakes.

## Render deployment

If you deploy this backend on Render:

- Build command: `npm run build`
- Start command: `npm start`
- Environment variables:
  - `DATABASE_URL` set to your Aiven MySQL URI
  - `PORT=10000`
  - `NODE_ENV=production`
  - `DB_SSL=true` if Aiven requires SSL

This is the preferred Render configuration because it avoids setting individual DB credentials separately.

For example:

```text
DATABASE_URL=mysql://username:password@hostname:3306/bioflux_db?sslmode=require
PORT=10000
NODE_ENV=production
```

Render will use `PORT` from the environment, and the backend listens on `0.0.0.0`.

## Database setup

Use the included SQL files to create the schema and load sample data.

1. Create the `bioflux_db` database:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS bioflux_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. Apply the schema:

**Option A: Using input redirection**
```powershell
mysql -u user -p bioflux_db < db/schema.sql
```

**Option B: Using SOURCE command**
```powershell
mysql -u user -p bioflux_db -e "SOURCE db/schema.sql;"
```

3. Load sample data:

**Option A: Using input redirection**
```powershell
mysql -u user -p bioflux_db < db/seed.sql
```

**Option B: Using SOURCE command**
```powershell
mysql -u user -p bioflux_db -e "SOURCE db/seed.sql;"
```

> Make sure `DB_NAME=bioflux_db` in `.env` unless you change the database name in the schema files as well.

## Running the backend

Start the development server:

```powershell
npm run dev
```

Or build and run in production mode:

```powershell
npm run build
npm start
```

## API endpoints

- `GET /api/health` — health check
- `GET /api/test` — basic API test
- `GET /api/researchers` — returns researcher records from the MySQL database

## Database connection notes

The backend reads `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` from `.env` and uses the `mysql2` package to connect.

If the connection fails, verify:

- MySQL server is running
- credentials are correct
- `DB_NAME` is set to `bioflux_db` or matches the database you created
- the `bioflux_db` database is accessible to the configured user

## Troubleshooting

- `ER_ACCESS_DENIED_ERROR`: check your username/password and grants
- `ER_BAD_DB_ERROR`: verify the database exists
- `ECONNREFUSED`: check MySQL is running and the host/port are correct

## Notes

This backend uses `mysql2/promise` for database access and exposes a simple pool-based query on `/api/researchers`.
