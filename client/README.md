# PERUNDHU (பேருந்து) — Frontend Client Application

The official web frontend for **PERUNDHU (பேருந்து)** — Tamil Nadu State Transport Corporation (TNSTC) Real-Time Bus Tracking System.

---

## 1. Project Architecture & Monorepo Structure

PERUNDHU is organized as an **npm workspaces** monorepo:

```
PERUNDHU/
├── server/                     # Backend service (Node.js, Express, TypeScript, Mongoose, Socket.IO)
├── client/                     # Frontend client (React 18, Vite 6, TypeScript, TanStack Query)
│   ├── public/                 # Static assets and favicon
│   ├── src/
│   │   ├── app/                # Root application composition, layout, error boundary, router
│   │   ├── assets/             # Frontend assets (branding folder for Step 2)
│   │   ├── components/         # Reusable design system UI components (Button, Card, Badge, Alert, Input)
│   │   ├── config/             # Typed environment validation and constants
│   │   ├── features/           # Feature-oriented domain modules (auth, districts, routes, map, location, tracking)
│   │   ├── hooks/              # Shared React hooks (useLanguage, useSocket, useHealth)
│   │   ├── i18n/               # Bilingual Tamil (தமிழ்) & English translation engine
│   │   ├── lib/                # Shared utilities (resilient error normalization, safe storage, IST time format, logger)
│   │   ├── services/
│   │   │   ├── api/            # Typed HTTP client & feature API services
│   │   │   └── socket/         # Socket.IO client manager & room pub/sub subscriptions
│   │   ├── state/              # QueryClient server state & user preferences
│   │   ├── styles/             # Approved design tokens (tokens.css), reset (reset.css), global utilities (index.css)
│   │   ├── types/              # Domain & API TypeScript interfaces matching backend schemas
│   │   └── utils/              # Pure pure functions (cn, formatters)
│   ├── tests/                  # Component and client unit test suite (Vitest + Testing Library)
│   ├── API_INTEGRATION_REFERENCE.md  # Verified backend API contract documentation
│   ├── vite.config.ts          # Vite configuration with path alias and dev proxy
│   ├── tsconfig.json           # Strict TypeScript configuration
│   └── package.json            # @perundhu/client package manifest
├── package.json                # Root workspace configuration
└── perundhu_api_collection.json # Backend API Postman collection
```

---

## 2. Technology Stack

- **Core Framework:** React 18.3.1
- **Build Tooling:** Vite 6.1.0 with `@vitejs/plugin-react`
- **Language:** TypeScript 5.7.3 (Strict mode enabled)
- **Routing:** React Router DOM 6.29.0
- **Server State & Caching:** TanStack React Query 5.66.0
- **Real-Time WebSockets:** Socket.IO Client 4.8.1 (matching backend Socket.IO version)
- **Design Tokens & Styling:** Modern Vanilla CSS Design Tokens (Strict adherence to approved palette: `#071F22`, `#1D7873`, `#67958C`, `#F5C096`, `#EF2E33`, `#F6F8F6`, `#FFFFFF`)
- **Iconography:** Lucide React 0.475.0
- **Bilingual i18n:** Custom zero-dependency translation context supporting Tamil script (`Noto Sans Tamil`) and English (`Inter`)
- **Testing:** Vitest 3.0.5 + React Testing Library + jsdom

---

## 3. Development Commands

Run from project root or inside `client/`:

```bash
# Start frontend Vite development server (http://localhost:5173)
npm run client:dev

# Run frontend type checking without emitting files
npm run client:typecheck

# Run frontend unit tests
npm run client:test

# Run frontend production build (TypeScript checking + Vite bundle)
npm run client:build

# Preview production build locally
npm --prefix client run preview
```

---

## 4. Environment Configuration

Copy the template to create your local `.env`:

```bash
cp client/.env.example client/.env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Public REST API gateway base URL | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Socket.IO WebSocket host URL | `http://localhost:5000` |
| `VITE_APP_ENV` | Environment mode (`development`, `test`, `production`) | `development` |

*Security Warning: Never store database URIs, JWT secrets, or private keys in `client/.env`.*

---

## 5. Adding Future Features Step-by-Step

1. **Verify Backend Contract:** Check `API_INTEGRATION_REFERENCE.md` or `server/src/` to confirm endpoints, parameters, and response shapes.
2. **Domain Types:** Define interfaces in `client/src/types/domain.ts` reflecting real backend responses.
3. **API Service:** Add service functions to `client/src/services/api/` using `httpClient`.
4. **Translations:** Add bilingual keys to both `client/src/i18n/translations/ta.ts` and `en.ts`.
5. **Design System:** Use pre-defined CSS tokens from `client/src/styles/tokens.css` (never invent rogue colors).
6. **Testing:** Write component/service unit tests in `client/tests/`.
