# Shajara (Шаджара / Yetti Pusht)

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)

**A modern, collaborative digital genealogy and family tree platform engineered to preserve lineage traditions (such as the Uzbek 7-ancestor *"Yetti Pusht"* custom), featuring dynamic kinship computation, granular row-level access control, and high-resolution printable PDF exports.**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Kinship & Heritage](#-the-yetti-pusht-tradition) • [Docker Deployment](#-docker--production-deployment) • [Architecture](#-project-architecture) • [API Reference](#-api-endpoints)

</div>

---

## 🌟 Overview

**Shajara** (Arabic/Uzbek for *Tree* / *Lineage*) is a self-hostable, full-stack genealogy management system. Traditional family trees are either trapped on paper scrolls or stored in monolithic desktop programs that prevent distant relatives from collaborating. 

Shajara bridges this gap by providing:
- A responsive, fluid web canvas for viewing generations of ancestors and descendants.
- A dynamic kinship calculator that translates complex blood relations (*Tog'a, Amaki, Xola, Amma, Amakivachcha, Boja, Qaynota*) relative to whoever is being explored.
- Safe collaborative editing where relatives can contribute their branch without accidentally altering or deleting branches maintained by other family members.
- One-click vector-grade printable posters (A4 to A1 poster dimensions) suitable for framing at family reunions and cultural heritage preservation.

---

## ✨ Key Features

### 🌳 Interactive Tree Canvas & Visualizer
* **Pan & Smooth Zoom**: Intuitive navigation across wide, multi-generational trees with touch and mouse dragging.
* **Dual Lineage Branching**: Distinct color codes and filtering for Paternal (*Ota tomon*) and Maternal (*Ona tomon*) bloodlines.
* **Spouse & Direct Pairings**: Clean connector lines and family nodes representing marriages, direct descendants, and half-siblings.
* **Multi-View Interface**: Switch seamlessly between the visual **Tree Canvas** and a filterable, searchable **List View**.

### 🧬 Dynamic Kinship Engine ("Relative-to-Me")
* **Adaptive Kinship Calculation**: Set any person as the active focal point, and the system dynamically recalculates all titles (e.g., *Amaki* [paternal uncle], *Tog'a* [maternal uncle], *Xola* [maternal aunt], *Amma* [paternal aunt], *Jiyan* [nephew/niece], *Evara* [great-grandchild], *Chevara* [great-great-grandchild]).
* **Lineage Breadcrumb Tracing**: Trace the direct line from any person straight back to the founding ancestor with a single click.

### 📜 "Yetti Pusht" (7 Ancestors) Support
* Native indexing and labeling for the ancient Central Asian 7-generation hierarchy:
  1. **O'zi** (Self / Siblings / Peers)
  2. **Ota / Ona** (Parents & Uncles/Aunts)
  3. **Bobo / Buvi** (Grandparents)
  4. **Katta bobo / Katta buvi** (Great-grandparents)
  5. **Bo'g'in bobo** (5th generation ancestor)
  6. **Chilla bobo** (6th generation ancestor)
  7. **Tovur bobo** (7th generation founding ancestor)

### 🔒 Granular Row-Level Access Control (RLAC)
* **Owner-Only Edits**: Authenticated users can only edit or delete records they personally created.
* **Administrative Safeguards**: Designated administrators retain tree-wide curation, user management, and moderation privileges.
* **Secure Sessions**: Stateless authentication powered by signed HTTP-only JWTs (`jose`) with salted password hashing (`bcryptjs`).

### 🖨️ High-Resolution Print & PDF Poster Export
* **Multi-Format Output**: Instant export to **A4**, **A3**, **A2**, and **A1** standard dimensions.
* **Orientation & Detail Controls**: Choose between Landscape and Portrait, customize document titles/subtitles, and toggle biographical summaries.
* **Ready for Framing**: Exports with optimized margins and crisp vector lines designed for commercial wall poster printing.

### 🖼️ Personal Profiles & Media Archive
* Comprehensive biography, lifespan tracking (birth/death years, alive/deceased indicators), birth location, occupation, and contact details.
* Portrait photo upload and multi-photo family gallery archive per person.

---

## 🏛️ The "Yetti Pusht" Tradition

In Uzbek and broader Central Asian culture, knowing one's **Yetti Pusht** (Seven Ancestors) is considered an essential cultural obligation and a marker of heritage. Shajara is purposely structured to make understanding and fulfilling this tradition effortless:

```
[Level 7] Tovur bobo       (7-Ajdod — Founding forefather)
   │
[Level 6] Chilla bobo      (6-Ajdod)
   │
[Level 5] Bo'g'in bobo     (5-Ajdod)
   │
[Level 4] Katta bobo       (Great-great-grandfather)
   │
[Level 3] Bobo & Buvi      (Grandparents — Paternal & Maternal)
   │
[Level 2] Ota & Ona        (Parents, Uncles & Aunts)
   │
[Level 1] O'zi             (Self, Siblings & Cousins)
   │
[Level 0] Farzandlar       (Children & Nieces/Nephews)
   │
[Level -1] Nabiralar       (Grandchildren)
   │
[Level -2] Evaralar        (Great-grandchildren)
   │
[Level -3] Chevaralar      (Great-great-grandchildren)
```

---

## 💻 Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | High-performance React framework with server components |
| **UI Library** | [React 19](https://react.dev/) | Component architecture with modern hooks |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end static typing and interface enforcement |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, lightweight icon suite |
| **Database** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Embedded SQLite with WAL mode & foreign key integrity |
| **Auth & Crypto** | `jose` & `bcryptjs` | JWT cookie tokens with secure salt-and-hash encryption |
| **PDF Generation** | `jspdf` & `html2canvas` | Client-side visual canvas rasterization and PDF compilation |
| **Containerization** | Docker & Docker Compose | Multi-stage lightweight Alpine deployment |

---

## 🚀 Quick Start

### Prerequisites
* **Node.js**: `v20.x` or higher (`v22.x` recommended)
* **npm**: `v10.x` or higher
* **C/C++ Build Tools** (required for `better-sqlite3` native compilation):
  * Ubuntu/Debian: `sudo apt install -y build-essential python3`
  * macOS: `xcode-select --install`
  * Windows: Visual Studio Build Tools

### 1. Clone & Install

```bash
git clone https://github.com/elee02/shajara.git
cd shajara
npm install
```

### 2. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env
```

Review or modify `.env` if necessary:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=super-secret-jwt-key-replace-with-long-random-string-in-production
DATABASE_DIR=./data
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> On the first run, the SQLite database is automatically created in `./data/shajara.db` and populated with realistic seed data covering a full 7-generation family tree.

---

## 🔑 Pre-Seeded Demo Accounts

The initial migration seeds three test accounts for local verification:

| Username | Password | Role | Description |
|---|---|---|---|
| `admin` | `admin123` | **Admin** | Full system access; can edit and curate all records |
| `elyor` | `user123` | **Member** | Standard user; can only edit personal records |
| `rustam` | `user123` | **Member** | Standard user; can only edit personal records |

---

## 🐳 Docker & Production Deployment

### Option A: Docker Compose (Recommended)

Shajara includes an optimized multi-stage [Dockerfile](file:///home/rasulovelyor/Projects/shajara/Dockerfile) utilizing Next.js standalone output and persistent volumes for the SQLite database and uploaded assets.

1. **Start the service:**
   ```bash
   docker-compose up -d --build
   ```

2. **Verify status:**
   ```bash
   docker-compose ps
   docker-compose logs -f shajara
   ```

The application is immediately accessible at `http://YOUR_SERVER_IP:3000`. The `./data` directory on the host persists the SQLite database (`shajara.db`) and uploaded media across container restarts.

---

### Option B: Bare-Metal VPS with PM2

1. **Install Node.js & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs build-essential
   sudo npm install -g pm2
   ```

2. **Build and start:**
   ```bash
   git clone https://github.com/elee02/shajara.git
   cd shajara
   npm install
   npm run build
   pm2 start npm --name "shajara" -- start
   pm2 save
   pm2 startup
   ```

---

### Option C: Production Reverse Proxy (Nginx + SSL)

To expose Shajara via your custom domain (e.g. `shajara.uz`) with free HTTPS encryption:

```nginx
server {
    listen 80;
    server_name shajara.uz www.shajara.uz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable SSL via Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shajara.uz -d www.shajara.uz
```

---

## 📁 Project Architecture

```
shajara/
├── data/                       # Persistent database storage (SQLite)
│   ├── shajara.db              # SQLite database (auto-generated)
│   └── uploads/                # User uploaded portraits and photos
├── public/                     # Static public assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Login, registration, session, logout
│   │   │   ├── people/         # CRUD endpoints with row-level checks
│   │   │   ├── upload/         # Multipart image upload handler
│   │   │   └── uploads/        # Static file serving route for uploaded media
│   │   ├── globals.css         # Design system tokens, themes & layout styles
│   │   ├── layout.tsx          # Root layout with font and metadata configuration
│   │   └── page.tsx            # Main client app container & state orchestrator
│   ├── components/
│   │   ├── AuthModal.tsx       # Authentication modal (Sign In & Sign Up)
│   │   ├── ExportPdfModal.tsx  # Print & PDF exporter (A4/A3/A2/A1 poster options)
│   │   ├── ListView.tsx        # Filterable & searchable directory table view
│   │   ├── Navbar.tsx          # Main header, search trigger, theme switcher
│   │   ├── PersonFormModal.tsx # Add/Edit modal with relation selection
│   │   ├── PersonModal.tsx     # Comprehensive detail sheet with bloodline trail
│   │   └── TreeView.tsx        # Interactive canvas with zoom, pan & branch lines
│   └── lib/
│       ├── auth.ts             # JWT signing, cookie verification & middleware helpers
│       ├── db.ts               # SQLite instance, migrations & initial seed data
│       ├── kinship.ts          # Central Asian kinship rules & dynamic calculation
│       └── types.ts            # Core TypeScript interfaces, generation definitions
├── Dockerfile                  # Multi-stage production container definition
├── docker-compose.yml          # Container composition with persistent volume mapping
├── DEPLOY.md                   # Uzbek deployment reference guide
└── package.json                # Project dependencies and operational scripts
```

---

## 🔌 API Endpoints

All endpoints are built using Next.js Route Handlers.

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Create a new member account.
* `POST /api/auth/login` — Authenticate and receive an HTTP-only JWT cookie.
* `GET  /api/auth/me` — Inspect current active session user.
* `POST /api/auth/logout` — Terminate session and invalidate cookie.

### People & Records (`/api/people`)
* `GET    /api/people` — Retrieve all family tree members with edit permission flags (`can_edit`).
* `POST   /api/people` — Insert a new person record (Requires authentication).
* `GET    /api/people/[id]` — Retrieve detailed profile for an individual.
* `PUT    /api/people/[id]` — Update record (Protected by Row-Level Access Control: creator or admin only).
* `DELETE /api/people/[id]` — Remove record (Creator or admin only).

### Media (`/api/upload`)
* `POST /api/upload` — Upload avatar portraits or gallery photos (multipart form data).

---

## 🛡️ Security & Privacy

* **Self-Contained Data**: No external telemetry, advertising trackers, or proprietary cloud lock-in. Your family records remain on your own server.
* **Password Encryption**: All credentials are systematically hashed using `bcryptjs` with salt rounds before being stored.
* **HTTP-Only Cookies**: JWT authentication tokens are protected against XSS by strictly using `HttpOnly`, `SameSite=Lax`, and secure flags in production.
* **Row-Level Editing Guard**: Every mutation query evaluates the requester's user ID against the record's `created_by` foreign key, blocking unauthorized changes.

---

## 💾 Backups & Maintenance

To create a snapshot backup of your entire genealogy database and uploaded media:

```bash
# Backup SQLite DB and media folder
tar -czvf shajara-backup-$(date +%F).tar.gz data/
```

To restore from a backup:

```bash
tar -xzvf shajara-backup-YYYY-MM-DD.tar.gz
```

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/genealogy-feature`).
3. Commit your changes (`git commit -m 'Add new kinship calculation feature'`).
4. Push to your branch (`git push origin feature/genealogy-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
