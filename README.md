<div align="center">

<img src="docs/assets/eventpro-logo.png" alt="EventPro logo" width="140" />

# EventPro

**Connect event organizers with suppliers — from discovery to delivery.**

[![CI](https://github.com/christian0162/eventpro/actions/workflows/ci.yml/badge.svg)](https://github.com/christian0162/eventpro/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)

</div>

## Components

| | Component | Package | Version | Stack | Path |
| --- | --- | --- | --- | --- | --- |
| <img src="docs/assets/eventpro-logo.png" width="32" /> | **Frontend** | `eventpro-frontend` | ![v](https://img.shields.io/badge/version-0.0.0-blue) | React 19 · Vite | [`frontend/`](frontend) |
| <img src="docs/assets/eventpro-logo.png" width="32" /> | **Delivery Backend** | `eventpro-nodejs-backend` | ![v](https://img.shields.io/badge/version-0.0.0-blue) | Node.js · Express | [`backend/nodejs_backend/`](backend/nodejs_backend) |
| <img src="docs/assets/eventpro-logo.png" width="32" /> | **Payments & AI Backend** | `eventpro-python-backend` | ![v](https://img.shields.io/badge/version-0.0.0-blue) | Python · FastAPI | [`backend/python_backend/`](backend/python_backend) |

EventPro is a web platform that connects event organizers with suppliers (catering, venues, equipment, etc.), covering the full flow from discovery and booking to contracts, payments, delivery logistics, and reviews.

## Repository Structure

```
EventPro/
├── frontend/          # React + Vite single-page app
└── backend/
    ├── nodejs_backend/         # Express service — Lalamove delivery integration & webhooks
    └── python_backend/         # FastAPI service — payments, payouts, refunds, AI recommendations
```

## Features

- **Event & supplier marketplace** — event creation/management, supplier shops, registration, and dashboards for both organizers and suppliers
- **Contracts & bookings** — booking modals, contract generation, availability picker, damage penalties
- **Payments & payouts** — checkout sessions and bank payouts via [Xendit](https://www.xendit.co/), with refund handling
- **AI-powered recommendations** — supplier recommendations via Google Gemini
- **Delivery logistics** — quotations, order creation, and live driver status tracking via [Lalamove](https://www.lalamove.com/), with webhook-driven notifications
- **Auto-cancellation** — scheduled job to auto-cancel unpaid contracts and delete expired events
- **Real-time chat & notifications** — in-app chat window and notification center backed by Firebase
- **Auth & verification** — login/register/password reset, email verification, admin review of suppliers
- **Reporting & analytics** — dashboards with charts, PDF report generation

## Tech Stack

**Frontend:** React 19, Vite, React Router, Tailwind CSS, Bootstrap, Firebase (client), Chart.js, FullCalendar, Leaflet, SweetAlert2

**Backend:**
- Node.js/Express — Firebase Admin SDK, Lalamove delivery API
- Python/FastAPI — Xendit payments, Google Generative AI (Gemini), Firebase Admin SDK

**Data & Auth:** Firebase / Firestore

## Getting Started

### Prerequisites

- Node.js (LTS) and npm
- Python 3.10+
- Firebase project with a service account key
- API credentials for Xendit, Lalamove, and Google Generative AI

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Node.js Backend (delivery service)

```bash
cd backend/nodejs_backend
npm install
```

Create a `.env` file with:

```
PORT=5001
GOOGLE_APPLICATION_CREDENTIALS_JSON=<firebase-service-account-json>
LALAMOVE_API_KEY=<key>
LALAMOVE_SECRET=<secret>
LALAMOVE_BASE_URL=<lalamove-api-base-url>
LALAMOVE_MARKET=PH
```

```bash
npm start
```

### Python Backend (payments, payouts, AI)

```bash
cd backend/python_backend
pip install -r requirements.txt
```

Set the required environment variables (Xendit API key, Google Generative AI key, Firebase credentials, etc.), then run:

```bash
uvicorn main:app --reload
```

A `Dockerfile` is provided for containerized deployment.

## Testing

```bash
cd frontend
npm run test
```

Lint and build checks:

```bash
npm run lint
npm run build
```

## Continuous Integration

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push to `main` and on every pull request:

| Job | Checks |
| --- | --- |
| `frontend` | `npm ci`, lint, test, production build |
| `nodejs-backend` | dependency install, syntax check of `server.js` |
| `python-backend` | `pip install -r requirements.txt`, byte-compile all modules |

Pull requests should pass all jobs before merging.

## Versioning & Releases

EventPro follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- **MAJOR** — breaking changes (API contract, data model)
- **MINOR** — backwards-compatible features
- **PATCH** — backwards-compatible bug fixes

Notable changes are recorded in [CHANGELOG.md](CHANGELOG.md) following [Keep a Changelog](https://keepachangelog.com/). Releases are tagged on `main` as `vX.Y.Z`:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Contributing

1. Branch from `main` using a descriptive name (`feat/…`, `fix/…`, `docs/…`).
2. Write commits using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, …).
3. Make sure lint, tests, and build pass locally.
4. Open a pull request against `main`; CI must pass before merge.

## Security

Never commit `.env` files, Firebase service account keys, or API credentials (Xendit, Lalamove, Gemini). Report vulnerabilities privately to the maintainers rather than opening a public issue.

## License

No license specified.
