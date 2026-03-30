# Cutline

**Writer-First Screenwriting Tool** — A script-to-visual planning platform for filmmakers.

Cutline is a full-stack web application that helps filmmakers transform screenplays into shot lists and storyboards. It supports industry-standard Fountain format for script input and provides AI-assisted shot suggestions and storyboard generation.

## Features

- **Fountain Script Editor** — Write and edit scripts in Fountain format with syntax highlighting
- **Shot List Management** — Create, edit, and organize shots per scene
- **AI-Powered Suggestions** — Get intelligent shot recommendations based on script content
- **Storyboard Generation** — Generate visual storyboards from confirmed shot lists
- **Script Breakdown** — Automatic parsing of scenes, characters, dialogue, and action
- **Offline Support** — PWA with IndexedDB storage for working without connectivity
- **Dark Mode** — Writer-friendly dark theme optimized for long writing sessions

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** — Build tool and dev server
- **TanStack Query** — Server state management
- **Zustand** — Client state management
- **Dexie.js** — IndexedDB wrapper for offline storage
- **Vite PWA** — Service worker for offline support

### Backend
- **Bun** — JavaScript runtime
- **Elysia** — Type-safe web framework
- **SQLite** — Embedded database via bun:sqlite
- **JWT** — Authentication

## Project Structure

```
cutline/
├── app/
│   ├── client/           # React frontend
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Utilities and API client
│   │   │   └── styles/       # CSS and design tokens
│   │   └── package.json
│   │
│   └── server/           # Bun backend
│       ├── src/
│       │   ├── routes/       # API endpoints
│       │   ├── services/     # Business logic
│       │   └── db/           # Database migrations and queries
│       └── package.json
│
├── docs/                 # Architecture and pattern documentation
├── specs/                # Feature specifications and progress tracking
├── DESIGN.md             # Design system and UI specifications
└── prd.json              # Product requirements document
```

## Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **npm**, **yarn**, or **bun** package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cutline

# Install frontend dependencies
cd app/client
npm install

# Install backend dependencies
cd ../server
bun install
```

### Development

```bash
# Terminal 1: Start the backend server
cd app/server
bun run dev

# Terminal 2: Start the frontend dev server
cd app/client
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3000`.

### Scripts

**Frontend (`app/client`)**
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run test` | Run tests with Vitest |
| `npm run type-check` | TypeScript type checking |

**Backend (`app/server`)**
| Command | Description |
|---------|-------------|
| `bun run dev` | Start server with hot reload |
| `bun run start` | Start production server |
| `bun run db:migrate` | Run database migrations |

## Architecture

### Shot-List-First Paradigm

Cutline follows a **Shot-List-First** workflow:

1. **AI Suggests Shots** — Analyzes script content and proposes shot breakdowns
2. **Director Edits Shots** — Full control to modify, add, or remove shots
3. **Director Confirms Shot List** — Lock in the final shot decisions
4. **AI Generates Storyboards** — Create visuals only from confirmed shots

### Functional Programming Patterns

The backend uses functional programming patterns with `fp-ts` behind a facade, providing:
- Type-safe error handling with `Either` and `Option`
- Immutable data transformations
- Composable business logic

See `docs/fp-patterns.md` and `docs/fp-architecture.md` for details.

## Design System

Cutline uses a dark theme design system optimized for writers:

- **Primary Font**: Inter (UI) / Courier Prime (scripts)
- **Color Palette**: Dark backgrounds (#0f0f0f, #1a1a1a) with accent purple (#6366f1)
- **Fountain Colors**: Scene headings (amber), Character names (blue), Dialogue (white)

See `DESIGN.md` for complete design specifications.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/storyboards` | GET | List all storyboards |
| `/api/storyboards/:id` | GET | Get storyboard by ID |
| `/api/ai/*` | POST | AI service proxy endpoints |

## Contributing

1. Create a feature branch from `main`
2. Make changes following the existing patterns
3. Run tests and type checking before submitting
4. Submit a pull request for review

## License

MIT

---

**Version**: 0.1.0 (Phase 1 MVP - 95% complete)
