# AR Lookup

Draft UI for image AR analysis and AI chat.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Folders

- `frontend` — React app (Vite)
- `backend` — reserved for APIs later

## Setup backend

Prisma expects **PostgreSQL on `localhost:5432`**. Either start Postgres yourself or use Docker from the repo root:

```bash
docker compose up -d
```

Wait until the container is healthy, then:

```bash
cd backend
cp .env.example .env   # if you do not have .env yet; then edit values
npm install
npx prisma db push
npx prisma generate
npm run dev
```

## Env variables

Create `backend/.env` (see `backend/.env.example`). `DATABASE_URL` must match your running database, for example:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arlab?schema=public"
GEMINI_API_KEY="your-gemini-api-key"
JWT_KEY="your-jwt-secret"
```

