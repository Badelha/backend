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
