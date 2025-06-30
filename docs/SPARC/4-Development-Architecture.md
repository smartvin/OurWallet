# SPARC Framework - Development Architecture

## Development Server Strategy

### Overview
This document outlines the dual-server development architecture chosen for MultiWallet to ensure seamless integration with the dePick repository while maintaining development efficiency.

### Architecture Decision: Two-Server Development

#### Server Configuration

**Server 1: NestJS Backend (Port 3001)**
- Handles authentication endpoints (`/auth/google`, `/auth/line`)
- Serves wallet API endpoints (`/wallet/*`)
- Manages Google OAuth passport configuration
- Serves static assets from `/public/`
- Contains existing wallet connection logic

**Server 2: Vite Development Server (Port 3002)**
- Serves React frontend from `/frontend/` directory
- Provides hot module replacement (HMR) for instant React updates
- Proxies API calls to NestJS backend (port 3001)
- Development-only server (production uses single server)

#### Proxy Configuration (vite.config.ts)
```typescript
server: {
  port: 3002,
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
    '/auth': { target: 'http://localhost:3001', changeOrigin: true }
  }
}
```

### Design Rationale

#### Why Two Servers Over Single Server?

**Primary Driver: dePick Integration Compatibility**
- dePick repository uses Vite + React architecture
- Ensures WalletModal.tsx components work identically in both environments
- Enables seamless "grafting" of authentication components

**Development Efficiency**
- Hot reload for React components (sub-second feedback)
- Fast Vite builds vs slower TypeScript compilation
- Standard React development patterns and tooling

**Separation of Concerns**
- Backend (NestJS): Authentication, wallet APIs, database
- Frontend (React): UI components, state management, user interaction
- Clear boundaries for future code extraction

### Implementation Strategy

#### Development Workflow
```bash
npm run dev:both  # Runs both servers concurrently
# OR manually:
npm run dev          # Terminal 1: NestJS backend
npm run dev:frontend # Terminal 2: Vite frontend
```

#### Production Deployment
- Build React: `npm run build:frontend` → `/public/dist/`
- NestJS serves built React files as static assets
- Single server deployment (port 3001 only)

#### Tool Dependencies
- `concurrently`: Runs multiple npm scripts simultaneously
- `vite`: Fast React development server with HMR
- `@vitejs/plugin-react`: Vite React plugin for JSX/TSX support

### Integration Points

#### API Communication
```typescript
// React frontend calls NestJS backend
const response = await fetch('/auth/google');  // Proxied to :3001
const walletData = await fetch('/wallet/connect');  // Proxied to :3001
```

#### Authentication Flow
1. User clicks "Connect with Google" in React modal
2. Frontend redirects to `/auth/google` (proxied to NestJS)
3. NestJS handles OAuth flow with passport
4. Success/failure redirected back to React frontend
5. React updates UI state accordingly

#### Wallet Connection Flow
1. User clicks wallet provider in React modal
2. React calls browser wallet APIs directly (`window.klaytn`, `window.okxwallet`)
3. On success, React optionally syncs with NestJS backend
4. UI state updated in React components

### Migration to dePick

#### Phase A: Current MultiWallet Development
- Two-server development for rapid iteration
- Clean React components following dePick patterns
- TypeScript interfaces compatible with dePick

#### Phase B: dePick Integration Preparation
1. **Prune dePick external auth**: Remove existing OAuth/wallet code
2. **Extract components**: Copy WalletModal.tsx and related files
3. **Update dePick dependencies**: Ensure compatible React/TypeScript versions

#### Phase C: Grafting Components
```typescript
// In dePick repository
import { WalletModal } from './components/auth/WalletModal';
import { useAuth } from './hooks/useAuth';  // Extended with our providers

// Replace existing dePick authentication UI
```

### Alternative Considered: Single Server

**Rejected Approach**: NestJS serves pre-built React
- **Pro**: Simpler architecture, fewer dependencies
- **Con**: No hot reload, slower development cycle
- **Con**: Less compatible with dePick's Vite workflow
- **Decision**: Rejected due to development efficiency and integration goals

### Success Metrics

#### Development Efficiency
- React component changes reflect in <2 seconds
- API changes require only NestJS restart (frontend unaffected)
- Zero CORS or proxy configuration issues

#### Integration Compatibility  
- WalletModal.tsx works identically in MultiWallet and dePick
- Authentication flows compatible with dePick's useAuth hook
- TypeScript interfaces portable between repositories

#### Production Simplicity
- Single server deployment (NestJS serves built React)
- No runtime dependency on Vite or development tools
- Static asset serving from `/public/dist/`

---

**Document Version**: 1.0  
**Created**: 2025-06-30  
**Status**: Design Approved, Implementation Pending