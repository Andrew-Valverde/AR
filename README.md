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

```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev 
```

## Env variables

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arlab?schema=public" # Or your provider eg. neon.tech
GEMINI_API_KEY="your-gemini-api-key" 
JWT_SECRET="your-jwt-secret"
```

