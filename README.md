# Badelha Backend

Backend API for the **Badelha Exchange Platform**, built with Node.js and Express.js. The application provides authentication, product exchange, purchasing, notifications, ratings, reporting, and administration features.

## Technologies

- Node.js 22
- Express.js
- Prisma ORM
- PostgreSQL or MySQL
- JWT authentication
- Cloudinary media storage
- GitHub Actions

Additional packages include `bcrypt`, `jsonwebtoken`, `multer`, `nodemailer`, `helmet`, `cors`, `morgan`, and `express-validator`.

## Local Setup

### Requirements

- Node.js 22 or later
- npm
- A PostgreSQL or MySQL database

### Installation

```bash
git clone https://github.com/Badelha/backend.git
cd backend
npm ci
cp .env.example .env
```

Set the required values in `.env`, especially `DATABASE_URL` and `JWT_SECRET`, then generate the Prisma client:

```bash
npm run build
```

Start the API in development mode:

```bash
npm run dev
```

Start the API in production mode:

```bash
npm start
```

### Render deployment

Configure the Render Web Service to deploy the intended production branch with:

- Build command: `npm ci && npx prisma generate`
- Pre-deploy command: `npx prisma migrate deploy && npx prisma db seed`
- Start command: `npm start`

Set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, the SMTP settings, and:

```text
NODE_ENV=production
CLIENT_URL=https://frontend-git-feature-landin-page-badelha.vercel.app
CORS_ORIGINS=https://frontend-git-feature-landin-page-badelha.vercel.app,http://localhost:3001
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your-sending-address@gmail.com
EMAIL_PASS=your-16-character-google-app-password
EMAIL_FROM=your-sending-address@gmail.com
```

The preferred SMTP variable names are `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM`. `EMAIL_HOST`, `EMAIL_USER`, and `EMAIL_PASS` are required; `EMAIL_PORT` defaults to `587`, and `EMAIL_FROM` defaults to the configured sender account. For compatibility with older Render settings, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_PASSWORD`, `MAIL_HOST`, `MAIL_USER`, and `MAIL_PASSWORD` are accepted as aliases. Startup logs identify which alias is in use and report missing variable names, but never log secret values. Prefer migrating Render to the canonical `EMAIL_*` names.

For Gmail, enable 2-Step Verification and use a Google App Password, not the account password; enter the App Password without spaces. Port `465` uses implicit TLS; port `587` uses STARTTLS. `EMAIL_FROM` must be the Gmail account or an authorized sender. Add these values in the Render service's Environment settings and redeploy; never commit real credentials. At startup the service attempts to verify SMTP connectivity, and send/verification failures log safe diagnostic metadata (error code/command/status, not credentials).

`CLIENT_URL` is the canonical frontend origin used for verification and reset links. `CORS_ORIGINS` is a comma-separated exact-origin allowlist. Production refresh cookies are `HttpOnly; Secure; SameSite=None; Path=/api/auth/refresh-token`. Browser third-party-cookie blocking can still prevent refresh between Vercel and Render hostnames; use a same-site custom domain or frontend proxy if browsers block that cookie. Do not set `COOKIE_DOMAIN` for unrelated Vercel/Render domains.

Migrations use Prisma's migration history, and the city/role seed skips duplicates. No default product or category demo records are created.

## Available Scripts

| Command | Purpose |
|---|---|
| `npm start` | Starts the production server |
| `npm run dev` | Starts the server with Nodemon |
| `npm run build` | Generates the Prisma client and validates JavaScript syntax |
| `npm run syntax:check` | Checks all JavaScript files for syntax errors |
| `npm test` | Runs the Node.js test runner |

## CI/CD Pipeline

The workflow is defined in [`.github/workflows/cicd.yml`](.github/workflows/cicd.yml). It runs automatically on pushes and pull requests targeting `main` or `develop`.

The pipeline performs these steps:

1. Checks out the repository.
2. Sets up Node.js 22 with npm dependency caching.
3. Installs the exact locked dependencies using `npm ci`.
4. Generates the Prisma client and validates the JavaScript source.
5. Runs the automated test suite.
6. Marks the project as deployment-ready after successful validation.

The workflow intentionally does not connect to a real database or deploy automatically. Database migrations and deployment can be added later using protected GitHub environments and repository secrets.

## Environment Variables

Copy `.env.example` to `.env` and configure the following values:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- Cloudinary credentials
- Email credentials

Never commit `.env` or production secrets to the repository.

## CI/CD Benefits

- Automated validation on every change
- Consistent dependency installation through `npm ci`
- Early detection of syntax and test failures
- Prisma client generation verified before deployment
- A clear, repeatable path toward production deployment

## Project Structure

```text
src/
├── config/          # Environment, Prisma, and Cloudinary configuration
├── controllers/     # HTTP request handlers
├── middlewares/     # Authentication, validation, and error handling
├── routes/          # API route definitions
├── services/        # Business logic
├── validators/      # Request validation rules
└── utils/           # Shared utility functions
prisma/              # Prisma schema and migrations
tests/               # Automated tests
```

## License

ISC
