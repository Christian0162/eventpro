# EventPro

EventPro is a web platform that connects event organizers with suppliers (catering, venues, equipment, etc.), covering the full flow from discovery and booking to contracts, payments, delivery logistics, and reviews.

## Repository Structure

```
EventPro/
├── EventPro-frontend/          # React + Vite single-page app
└── EventPro-backend/
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
cd EventPro-frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Node.js Backend (delivery service)

```bash
cd EventPro-backend/nodejs_backend
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
cd EventPro-backend/python_backend
pip install -r requirements.txt
```

Set the required environment variables (Xendit API key, Google Generative AI key, Firebase credentials, etc.), then run:

```bash
uvicorn main:app --reload
```

A `Dockerfile` is provided for containerized deployment.

## Testing

```bash
cd EventPro-frontend
npm run test
```

## License

No license specified.
