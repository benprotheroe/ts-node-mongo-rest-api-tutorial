# 30different (Unified Next.js App)

Single-repo Next.js app for the 30different challenge: track 30+ different fruits and vegetables each week.

## Stack

- Next.js App Router (frontend + backend route handlers)
- TypeScript
- Google Cloud Firestore
- Cookie-based signed JWT sessions (`jose`)
- Input validation with `zod`

## Required Environment Variables

Create `.env.local` with:

```bash
SESSION_SECRET=your_long_random_secret
FIRESTORE_PROJECT_ID=your-gcp-project-id
GCP_CLIENT_EMAIL=service-account-name@your-gcp-project-id.iam.gserviceaccount.com
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Alternative: set `FIRESTORE_SERVICE_ACCOUNT_KEY` to the full service account JSON string instead of the three variables above.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/catalog`
- `GET /api/items`
- `POST /api/items`

## Legacy Code

Previous Express API implementation is preserved under `legacy/` for reference.
