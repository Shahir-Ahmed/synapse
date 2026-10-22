# ClearFeedback

ClearFeedback helps educators turn topic-level assessment scores into clear, actionable feedback. Teachers record marks, generate evidence-based draft feedback, edit it, and publish it to the assigned student's portal. Students can view only their own published assessments and acknowledge the feedback.

## Requirements

- Node.js 22.12 or newer
- npm

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add a Gemini API key if you want AI-generated drafts. Without a key, ClearFeedback uses its deterministic rule-based feedback generator.

   macOS/Linux:

   ```bash
   cp .env.example .env
   ```

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start the application:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Demo accounts

In a non-production development environment, the sign-in page offers one-click demo access. The corresponding account credentials are also available for normal sign-in:

| Role | Email | Password |
|---|---|---|
| Teacher | `sarah.jenkins@clearfeedback.edu` | `teacher123` |
| Student | `alex.chen@student.clearfeedback.edu` | `student123` |
| Student | `maya.patel@student.clearfeedback.edu` | `student123` |

Demo accounts and sample academic data are for demonstration only. A production deployment disables one-click demo login by default. Setting `ENABLE_DEMO_LOGIN=true` explicitly enables it; only do so when the deployment contains non-sensitive demo data. In production, teacher self-registration requires `TEACHER_REGISTRATION_CODE` to be set by the deployment administrator and supplied during registration.

## Scripts

- `npm run dev` — start Express with the Vite development middleware
- `npm run build` — build the frontend assets
- `npm start` — start the Express server (set `NODE_ENV=production` after building to serve `dist`)
- `npm run lint` — run the configured TypeScript check
- `npm test` — run built-in Node tests for grade calculations, password storage, student identity rules, and assessment persistence

## Data and deployment notes

- Sample and application data are stored in `data/store.json`. Back up this file before replacing or redeploying a populated local instance.
- The JSON store is suitable for a single-process prototype/demo, not a multi-instance production deployment. Use a transactional database before storing real student records at scale.
- Passwords are stored as salted scrypt hashes. Existing plaintext password fields are upgraded to hashes on startup.
- Keep `.env` out of version control. Never place API keys or registration codes in frontend code.
- `APP_URL` is not currently required by the application and has been omitted from the template.
