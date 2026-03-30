<div align="center">

# CampusKey

### Passwordless Biometric Authentication for Indian College Campuses

[![Live Demo](https://img.shields.io/badge/Live%20Demo-campuskey--five.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://campuskey-five.vercel.app)
[![Backend API](https://img.shields.io/badge/API-Render.com-46E3B7?style=for-the-badge&logo=render)](https://campuskey-api.onrender.com)
[![Built for](https://img.shields.io/badge/Built%20for-Srijan%202026-0f172a?style=for-the-badge)](https://campuskey-five.vercel.app)
[![Atos](https://img.shields.io/badge/Atos-Global%20IT%20Solutions%20%26%20Services-00A7E1?style=for-the-badge)](https://campuskey-five.vercel.app)

**No password. No OTP. Just your fingerprint.**

One biometric tap gives every student and faculty member secure access to their entire campus portal — grades, library, labs, notices, and more.

</div>

---

## The Problem We Solved

Every day, millions of students across Indian college campuses log into ERP and LMS portals using passwords that are easy to guess, OTP codes that never arrive on time, and shared computers where typing a password is simply not safe.

The three biggest pain points are:

**Passwords that anyone can guess.** Most students use their date of birth, roll number, or college name as their password. Anyone who knows them can walk into their account.

**OTP codes that never arrive.** Campus networks are congested. During exam season, OTP messages take minutes to arrive or do not come at all. Students miss deadlines because of this.

**Shared computers with no safe login.** Library PCs and lab computers have no safe way for students to authenticate. Typing a password on a shared machine puts the account at risk.

---

## What CampusKey Does

CampusKey replaces passwords entirely. You register once using your fingerprint or face, and from that point forward, one biometric tap logs you into everything — your student ERP, LMS portal, library system, lab booking, and campus Wi-Fi, all through a single verified session.

There is nothing to remember, nothing to type, and nothing that can be stolen from a server because your biometric data never leaves your device.

---

## Live Demo

| Link | Purpose |
|---|---|
| [campuskey-five.vercel.app](https://campuskey-five.vercel.app) | Main application (home, login, register, dashboard) |
| [campuskey-five.vercel.app/enroll](https://campuskey-five.vercel.app/enroll) | Register your passkey (student or faculty) |
| [campuskey-five.vercel.app/login](https://campuskey-five.vercel.app/login) | Sign in with biometric |
| [campuskey-five.vercel.app/admin](https://campuskey-five.vercel.app/admin) | Admin risk dashboard (requires admin key) |
| [campuskey-api.onrender.com](https://campuskey-api.onrender.com) | Backend REST API |

**Demo credentials to try the app:**

| Role | College Passkey |
|---|---|
| Student | `Ruas@123` |
| Faculty | `RuasF@123` |

Use any college email format like `yourname@msruas.ac.in` and the passkey above to register.

---

## How It Works

```
Step 1 — Register once
  Fill your college details → enter the college-issued passkey code
  → your device generates a unique key pair using the biometric sensor
  → the private key stays on your device forever, only the public key goes to the server

Step 2 — Log in with one touch
  Enter your email → touch fingerprint or look at camera
  → your device signs a challenge using the private key
  → server verifies the signature → you are in

Step 3 — Access everything
  One login session unlocks your ERP, LMS, Library, Labs and Wi-Fi simultaneously
  → Single Sign-On across all campus systems via one verified passkey session
```

No password travels anywhere. No biometric data leaves your phone or laptop. Ever.

---

## Features

### Authentication Core
- **FIDO2 and WebAuthn passkeys** — the same technology used by Apple, Google, and Microsoft for their passkey products, adapted for Indian campuses
- **Biometric registration and login** — fingerprint, Face ID, or Windows Hello supported on any device
- **QR cross-device enrollment** — if you are on a shared lab PC, scan a QR code with your phone to register your phone's biometric from the PC safely, with no passwords typed on the shared computer
- **Zero passwords stored anywhere** — the server stores only a cryptographic public key. There is no password column in the database

### Dashboard
- **Real-time ERP-style student dashboard** with live clock, today's timetable with active slot highlighting, CGPA, attendance rings, grades table, CIA marks, exam schedule, library books, lab availability booking, and college notices
- **Real-time faculty dashboard** with course attendance tracking, student at-risk monitoring, leave management with an apply form, and pending task list
- **Single Sign-On status strip** showing all campus systems — ERP, LMS, Library, Labs, and Wi-Fi — as authenticated under one session

### Security and Compliance
- **Contextual login verification screen** — after every successful biometric login, a confirmation card shows the device type, login time, campus network location, and authentication method before redirecting
- **Personal security audit log** — every login and registration is recorded in the Security tab with timestamp, IP address, and risk level so each user can see their own account activity
- **Continuous risk scoring** — every authentication event is automatically scored for risk based on time of day, failed attempt history, and unusual patterns, and stored in the compliance trail
- **Admin Risk Dashboard** at `/admin` — shows total users, logins today, failed attempts, high-risk events, a full user management table with revoke capability, and a colour-coded audit log

### Access Control
- **College invite system** — registration requires a college-issued passkey code, so no outsider can create a fake student or faculty account
- **Role-based portals** — students and faculty see completely different dashboards after logging in with the same authentication system
- **Passkey revocation** — admins can revoke any user's passkeys instantly from the admin dashboard

### Device and Platform Support
- Works on any Android phone, iPhone, Windows PC, or Mac without installing any app
- Built as a Progressive Web App so it can be added to the home screen like a native app
- Works on budget devices including phones that cost as low as Rs 5,000 because it uses the device's built-in biometric sensor, not external hardware

---

## What Makes CampusKey Unique

Most authentication systems are built for large enterprises with dedicated IT teams. CampusKey is built specifically for the way Indian colleges actually work.

**QR cross-device enrollment is unique to CampusKey.** No other WebAuthn implementation handles the specific scenario where a student is sitting at a shared library computer and needs to register their phone's fingerprint without typing anything on that shared machine.

**Campus invite codes replace open registration.** Instead of email verification or OTP, CampusKey gates registration behind a code that only the college distributes. Students get one code and faculty get a separate one.

**Risk scoring is context-aware for campus life.** A login at 2 AM scores higher risk than one at 9 AM. Multiple failed attempts within an hour flag the account. These are patterns that matter in a campus setting.

**The admin dashboard is built for non-technical college staff.** A registrar or IT coordinator can see all user activity, identify suspicious patterns, and revoke a student's access in one click, with no technical knowledge needed.

**Aligns with India's digital security direction.** India's digital ecosystem is moving toward biometric and passkey-based authentication. CampusKey is already fully compliant with the FIDO2 and WebAuthn standards that underpin this transition.

---

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 with Vite 8 | Fast, modern web app framework |
| Framer Motion | Smooth animations throughout the interface |
| Lucide React | Consistent icon library |
| Canvas Confetti | First-login celebration effect |
| QRCode React | QR code generation for cross-device enrollment |
| TailwindCSS | Utility-first styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js with Express | REST API server |
| SimpleWebAuthn v13 | FIDO2 and WebAuthn library for passkey operations |
| JSON Web Tokens | 24-hour session tokens after successful authentication |
| PostgreSQL via Neon.tech | Database for users, credentials, and audit logs |
| CORS and Helmet | Security middleware |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting with global edge deployment |
| Render.com | Backend API hosting |
| Neon.tech | Serverless PostgreSQL database |
| GitHub | Source control and CI |

### Security Standards
- **FIDO2 and WebAuthn** — W3C and FIDO Alliance standard for phishing-resistant authentication
- **Passkeys** — device-bound credentials tied to the hardware biometric sensor
- **Origin-bound credentials** — passkeys only work on the exact domain they were registered on, making phishing attacks impossible by design
- **JWT sessions** — short-lived signed tokens with no cookies or session state on the server

---

## Database Schema

```sql
-- Registered users
CREATE TABLE users (
  email       TEXT PRIMARY KEY,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'student',
  roll_number TEXT,
  department  TEXT,
  branch      TEXT
);

-- Passkey credentials (public key only, never biometric data)
CREATE TABLE credentials (
  id            SERIAL PRIMARY KEY,
  user_email    TEXT    NOT NULL,
  credential_id TEXT    NOT NULL UNIQUE,
  public_key    BYTEA   NOT NULL,
  counter       INTEGER NOT NULL DEFAULT 0,
  transports    TEXT    DEFAULT '[]'
);

-- Compliance audit trail
CREATE TABLE audit_logs (
  id         SERIAL PRIMARY KEY,
  email      TEXT,
  action     TEXT        NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  risk_score INTEGER     DEFAULT 0,
  risk_level TEXT        DEFAULT 'low',
  status     TEXT        DEFAULT 'success',
  meta       TEXT        DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register/start` | Generate WebAuthn registration options |
| POST | `/auth/register/finish` | Verify passkey and store public key |
| POST | `/auth/login/start` | Generate WebAuthn authentication challenge |
| POST | `/auth/login/finish` | Verify passkey assertion and issue JWT |
| GET | `/auth/me` | Validate JWT and return user profile |
| POST | `/auth/qr-session/create` | Create a QR session for cross-device enrollment |
| GET | `/auth/qr-session/status/:id` | Poll QR session completion status |
| GET | `/api/audit/me` | Return the authenticated user's own audit log |
| GET | `/api/admin/stats` | Return dashboard statistics (admin key required) |
| GET | `/api/admin/users` | Return all users with credential and risk data (admin key required) |
| GET | `/api/admin/audit` | Return full audit log (admin key required) |
| DELETE | `/api/admin/revoke/:email` | Revoke all passkeys for a user (admin key required) |

---

## Running Locally

### Prerequisites
- Node.js 18 or later
- A PostgreSQL database (free tier at neon.tech works perfectly)

### Backend setup

```bash
git clone https://github.com/yerramsettysuchita/CampusKey.git
cd CampusKey
npm install
```

Create a `.env` file in the root directory:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key_change_in_production
RP_ID=localhost
RP_NAME=CampusKey Local
ORIGIN=http://localhost:5173
STUDENT_PASSKEY=Ruas@123
FACULTY_PASSKEY=RuasF@123
ADMIN_CODE=ADMIN123
PORT=3001
```

Start the backend:

```bash
node server.js
```

### Frontend setup

```bash
cd client
npm install
```

Create `client/.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
CampusKey/
├── server.js                          # Express API server with all auth endpoints
├── package.json                       # Backend dependencies
└── client/
    ├── public/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx            # Home page with full project information
    │   │   ├── Login.jsx              # Biometric login with contextual verification
    │   │   ├── Enroll.jsx             # Passkey registration with QR cross-device flow
    │   │   ├── Dashboard.jsx          # Full ERP-style student and faculty dashboard
    │   │   └── Admin.jsx              # Admin risk dashboard and user management
    │   ├── components/
    │   │   ├── FloatingOrbs.jsx       # Background animation component
    │   │   └── QRAuthModal.jsx        # QR code modal for cross-device flow
    │   ├── context/
    │   │   └── AuthContext.jsx        # JWT session management and user state
    │   ├── lib/
    │   │   ├── api.js                 # API client with all endpoint methods
    │   │   └── webauthn.js            # WebAuthn browser-side helper functions
    │   └── App.jsx                    # Route definitions
    └── package.json                   # Frontend dependencies
```

---

## Security Design Decisions

**The private key never leaves the device.** When a user registers, the browser calls the device's platform authenticator (Secure Enclave on Apple, TPM on Windows, TEE on Android). The private key is generated inside that secure hardware and never exposed to the browser, the app, or any server.

**The server stores no passwords and no biometric data.** The database only contains a public key, a credential ID, and a counter. Even if the database is completely leaked, no user accounts can be compromised because there are no secrets in it.

**Phishing is impossible by design.** WebAuthn credentials are bound to the exact origin (domain) they were created on. If an attacker creates a fake lookalike site, the passkey will simply not work there because the origin does not match.

**All four WebAuthn endpoints derive the rpID dynamically** from the request origin rather than using a hardcoded environment variable. This ensures that the same server works correctly for desktop browsers, mobile browsers, and QR cross-device flows without any mismatch errors.

---

## About Srijan 2026

CampusKey was built for **Srijan 2026**, an online innovation challenge by **Atos Global IT Solutions and Services** where participants identify real-world enterprise problems and build working solutions that demonstrate practical impact.

The challenge has three stages. The first stage is designing the solution — identifying the problem, planning the architecture, and explaining the expected impact. The second stage is building a working MVP and demonstrating that it actually solves the problem. The third stage is presenting to a panel of judges who evaluate the design decisions, the real-world applicability, and the overall quality of the solution.

Prizes include cash awards for top teams, internship opportunities at Atos for strong performers, and pre-placement interview opportunities for eligible final-year students. Recognition is not limited to the top three — any team that performs well has a chance to be considered.

---

## What Was Built Versus the Proposal

The original proposal described several features. Here is an honest account of what is fully implemented versus what is planned for future work.

**Fully implemented and working:**
- Passwordless biometric login and registration using FIDO2 and WebAuthn
- QR cross-device enrollment for registering a phone from a shared desktop
- Role-based student and faculty dashboards with real-time data
- Single Sign-On status display across all campus systems
- Contextual login verification screen after each biometric authentication
- Compliance-ready audit trail with full activity log per user
- Continuous risk scoring on every authentication event
- Admin Risk Dashboard with user management and passkey revocation

**Planned for future development:**
- Real integrations with actual college ERP and LMS backends via LDAP or OAuth 2.0
- Push notification-based fallback authentication for devices without biometric sensors
- Offline authentication using time-bound cryptographic tokens for poor network conditions
- Integration with Keycloak or Azure Active Directory as a campus identity provider

---

## Contributors

**Yerramsetty Sai Venkata Suchita**
Final Year, B.E. Computer Science and Engineering — MSRUAS

**Mailey Manjunath**
Third Year, B.E. Computer Science and Engineering — MSRUAS

Built as a team submission for Srijan 2026 by Atos Global IT Solutions and Services.

---

<div align="center">

**CampusKey — The future of campus authentication is already here.**

[Try the Live App](https://campuskey-five.vercel.app) · [Register a Passkey](https://campuskey-five.vercel.app/enroll) · [Admin Dashboard](https://campuskey-five.vercel.app/admin)

*Built with FIDO2 and WebAuthn · No passwords stored · Biometric data never leaves your device*

</div>
