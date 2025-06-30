# MultiWallet Recreation Architecture

## System Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Browser Environment                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Kaikas    │  │ OKX Wallet  │  │Google OAuth │     │
│  │ Extension   │  │ Extension   │  │   Service   │     │
│  │(window.     │  │(window.     │  │(@react-     │     │
│  │ klaytn)     │  │ okxwallet)  │  │ oauth)      │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                Vite Development Server                   │
│                    (Port 5173)                          │
├─────────────────────────────────────────────────────────┤
│                 React Application                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │            GoogleOAuthProvider                  │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │              App Component              │   │   │
│  │  │  ┌─────────────────────────────────┐   │   │   │
│  │  │  │        WalletModal              │   │   │   │
│  │  │  │  ┌─────────────────────────┐   │   │   │   │
│  │  │  │  │   Authentication Logic  │   │   │   │   │
│  │  │  │  └─────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┐   │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

### Directory Architecture
```
MultiWallet/
├── frontend/                      # React application root
│   ├── src/
│   │   ├── components/
│   │   │   └── WalletModal.tsx   # Main modal component
│   │   ├── types/
│   │   │   └── global.d.ts       # TypeScript declarations
│   │   ├── App.tsx               # Main app component
│   │   ├── App.css               # App-specific styles
│   │   ├── main.tsx              # React entry point
│   │   ├── index.css             # Global styles
│   │   └── vite-env.d.ts         # Vite type declarations
│   ├── index.html                # HTML entry point
│   └── .env.local                # Environment variables
├── public/
│   ├── wallet-modal.css          # Modal styling (reused)
│   └── dist/                     # Vite build output
├── docs/
│   ├── SPARC/                    # Original SPARC documentation
│   └── RECREATION/               # Recreation documentation
├── vite.config.ts                # Vite configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## Component Architecture

### 1. Provider Hierarchy
```typescript
GoogleOAuthProvider (from @react-oauth/google)
└── App
    ├── Header (with wallet status)
    ├── Main Content
    └── WalletModal (conditionally rendered)
        ├── Modal Overlay
        ├── Modal Header (close button)
        ├── Logo Section
        ├── Provider Buttons
        ├── Loading Section (conditional)
        └── Error Section (conditional)
```

### 2. State Management Architecture
```
┌─────────────────────────────────────────────────────────┐
│                  Application State                      │
├─────────────────────────────────────────────────────────┤
│  App Component State:                                   │
│  ├── showWalletModal: boolean                          │
│  ├── user: UserData | null                             │
│  └── Authentication callbacks                          │
├─────────────────────────────────────────────────────────┤
│  WalletModal Component State:                          │
│  ├── connectionState: 'idle'|'connecting'|'connected'  │
│  ├── error: string                                     │
│  └── Google OAuth hook state (managed by library)     │
└─────────────────────────────────────────────────────────┘
```

### 3. Data Flow Architecture
```
User Interaction → Component State → Provider API → Response Processing → Parent Callback
      ↓                ↓                 ↓                ↓                    ↓
  Click Button   Update Loading    Call Extension   Format UserData    Update App State
      ↓                ↓                 ↓                ↓                    ↓
  Provider Type   Show Spinner      Wait Response    Error Handling      Close Modal
```

## Authentication Provider Architecture

### 1. Google OAuth Flow
```
┌─────────────────────────────────────────────────────────┐
│                Google OAuth Architecture                │
├─────────────────────────────────────────────────────────┤
│  React Component                                        │
│  ├── useGoogleLogin hook                               │
│  ├── onSuccess callback                                │
│  └── onError callback                                  │
├─────────────────────────────────────────────────────────┤
│  @react-oauth/google Library                           │
│  ├── GoogleOAuthProvider context                       │
│  ├── Google Identity Services integration              │
│  └── Token management                                  │
├─────────────────────────────────────────────────────────┤
│  Google Services                                       │
│  ├── OAuth 2.0 popup authentication                   │
│  ├── Access token generation                          │
│  └── User info API (googleapis.com/oauth2/v3/userinfo)│
└─────────────────────────────────────────────────────────┘
```

### 2. Wallet Extension Architecture
```
┌─────────────────────────────────────────────────────────┐
│              Browser Extension Architecture             │
├─────────────────────────────────────────────────────────┤
│  React Component                                        │
│  ├── Extension detection (window object check)         │
│  ├── Connection request                                │
│  └── Account extraction                                │
├─────────────────────────────────────────────────────────┤
│  Browser Extension                                     │
│  ├── Kaikas: window.klaytn.enable()                   │
│  ├── OKX: window.okxwallet.request()                  │
│  └── Standard Web3 provider interface                 │
├─────────────────────────────────────────────────────────┤
│  Blockchain Network                                    │
│  ├── KAIA network (Chain ID: 8217)                    │
│  ├── Account management                               │
│  └── Transaction signing capabilities                 │
└─────────────────────────────────────────────────────────┘
```

## Build and Development Architecture

### 1. Development Environment
```
┌─────────────────────────────────────────────────────────┐
│                Development Architecture                 │
├─────────────────────────────────────────────────────────┤
│  Vite Development Server (Port 5173)                   │
│  ├── Hot Module Replacement (HMR)                      │
│  ├── TypeScript compilation                            │
│  ├── React Fast Refresh                               │
│  └── Static asset serving                             │
├─────────────────────────────────────────────────────────┤
│  Environment Configuration                             │
│  ├── .env.local (VITE_GOOGLE_CLIENT_ID)              │
│  ├── vite.config.ts (build and server config)        │
│  └── TypeScript configuration                         │
├─────────────────────────────────────────────────────────┤
│  External Integrations                                │
│  ├── Google Cloud Console (Client ID configuration)   │
│  ├── Browser Extensions (Kaikas, OKX)                │
│  └── NPM Package Registry (@react-oauth/google)       │
└─────────────────────────────────────────────────────────┘
```

### 2. Build Process Architecture
```
Source Files → TypeScript Compilation → React JSX Processing → Vite Bundling → Static Assets
     ↓                    ↓                        ↓                ↓              ↓
   .tsx/.ts         Type Checking             JSX to JS        Code Splitting   public/dist/
     ↓                    ↓                        ↓                ↓              ↓
 Import Resolution  Interface Validation    Component Trees   Asset Optimization   HTML/CSS/JS
```

## Security Architecture

### 1. Client-Side Security Model
```
┌─────────────────────────────────────────────────────────┐
│                  Security Architecture                  │
├─────────────────────────────────────────────────────────┤
│  Authentication Security                               │
│  ├── No server-side secrets stored                    │
│  ├── Temporary access tokens only                     │
│  ├── No persistent credential storage                 │
│  └── Browser-controlled authentication flows          │
├─────────────────────────────────────────────────────────┤
│  Extension Security                                    │
│  ├── Standard Web3 provider APIs                      │
│  ├── User approval required for connections           │
│  ├── No private key handling in application           │
│  └── Extension-managed account security               │
├─────────────────────────────────────────────────────────┤
│  Network Security                                     │
│  ├── HTTPS required for OAuth (localhost exception)   │
│  ├── No cross-origin requests to untrusted domains   │
│  ├── Content Security Policy compatible               │
│  └── No eval() or unsafe inline scripts              │
└─────────────────────────────────────────────────────────┘
```

### 2. Privacy Architecture
```
Data Collection → Processing → Storage → Transmission
       ↓              ↓          ↓           ↓
   User Consent   Client-Side   Temporary   HTTPS Only
       ↓              ↓          ↓           ↓
   Explicit OK    No Server    In Memory    Direct APIs
```

## Integration Architecture

### 1. dePick Repository Integration Points
```
┌─────────────────────────────────────────────────────────┐
│                dePick Integration Architecture          │
├─────────────────────────────────────────────────────────┤
│  Component Level                                       │
│  ├── WalletModal.tsx (drop-in replacement)            │
│  ├── Same prop interface                              │
│  ├── Compatible event callbacks                       │
│  └── Same styling approach                            │
├─────────────────────────────────────────────────────────┤
│  State Management Level                               │
│  ├── Compatible with dePick useAuth hook              │
│  ├── Same user data format                           │
│  ├── Same authentication provider types              │
│  └── Same error handling patterns                    │
├─────────────────────────────────────────────────────────┤
│  Dependency Level                                     │
│  ├── Same @react-oauth/google version                │
│  ├── Same React/TypeScript versions                  │
│  ├── Same wallet detection methods                   │
│  └── Same environment variable patterns              │
└─────────────────────────────────────────────────────────┘
```

### 2. Migration Architecture
```
Current State → Extraction → Adaptation → Integration → Testing
      ↓              ↓           ↓            ↓           ↓
  MultiWallet    Copy Files   Update Paths   Replace     Verify
      ↓              ↓           ↓            ↓           ↓
  Working Code   Clean Copy   dePick Paths   Old Auth    All Works
```

## Performance Architecture

### 1. Loading Performance
```
┌─────────────────────────────────────────────────────────┐
│                Performance Architecture                 │
├─────────────────────────────────────────────────────────┤
│  Initial Load                                          │
│  ├── Vite code splitting                              │
│  ├── React lazy loading                               │
│  ├── CSS-in-CSS (no CSS-in-JS overhead)              │
│  └── Minimal bundle size                              │
├─────────────────────────────────────────────────────────┤
│  Runtime Performance                                  │
│  ├── Single modal instance                            │
│  ├── Event delegation                                 │
│  ├── Minimal re-renders                              │
│  └── Fast state updates                              │
├─────────────────────────────────────────────────────────┤
│  Authentication Performance                           │
│  ├── Immediate provider detection                     │
│  ├── Parallel authentication flows                   │
│  ├── No unnecessary API calls                        │
│  └── Cached authentication states                    │
└─────────────────────────────────────────────────────────┘
```

### 2. Memory Architecture
```
Component Lifecycle → Mount → Update → Unmount
         ↓              ↓       ↓        ↓
    Allocate State   Event Bind  Re-render  Cleanup
         ↓              ↓       ↓        ↓
    Minimal Memory   Listeners   Diff    Remove Refs
```

## Scalability Architecture

### 1. Provider Extensibility
```
interface WalletProvider {
  id: string;
  icon: string;
  detection: () => boolean;
  connection: () => Promise<UserData>;
}

// Easy to add new providers:
const WALLET_PROVIDERS = [
  { id: 'google', ... },
  { id: 'kaia', ... },
  { id: 'okx', ... },
  // { id: 'metamask', ... },  // Future
  // { id: 'walletconnect', ... },  // Future
];
```

### 2. Feature Extensibility
```
┌─────────────────────────────────────────────────────────┐
│                Extensibility Architecture               │
├─────────────────────────────────────────────────────────┤
│  Component Extensions                                  │
│  ├── Custom provider buttons                          │
│  ├── Additional authentication methods                │
│  ├── Custom styling themes                            │
│  └── Enhanced error handling                          │
├─────────────────────────────────────────────────────────┤
│  Integration Extensions                               │
│  ├── Multiple modal instances                         │
│  ├── Server-side authentication sync                  │
│  ├── Advanced wallet features                         │
│  └── Multi-chain support                             │
└─────────────────────────────────────────────────────────┘
```

## Critical Design Decisions

### 1. Architecture Decision Records (ADRs)

#### ADR-001: Client-Side Authentication Only
**Decision**: Use client-side authentication flows exclusively
**Rationale**: Matches dePick architecture, simpler integration, no server secrets
**Consequences**: Limited to browser-based authentication methods

#### ADR-002: @react-oauth/google Library Choice
**Decision**: Use @react-oauth/google instead of deprecated gapi library
**Rationale**: Current Google standard, no CSP issues, proven in dePick
**Consequences**: Modern approach, better security, future-proof

#### ADR-003: Vite Build Tool Selection
**Decision**: Use Vite instead of webpack or Create React App
**Rationale**: Fast development, modern toolchain, smaller bundles
**Consequences**: Requires Node 18+, different configuration approach

#### ADR-004: Component Co-location Strategy
**Decision**: Single WalletModal component with embedded logic
**Rationale**: Easy to port to dePick, minimal file dependencies
**Consequences**: Larger component file, all logic in one place

### 2. Technical Constraints
```
┌─────────────────────────────────────────────────────────┐
│                Technical Constraints                   │
├─────────────────────────────────────────────────────────┤
│  Browser Requirements                                  │
│  ├── Modern browser with extension support            │
│  ├── JavaScript enabled                               │
│  ├── Local storage access                             │
│  └── Network connectivity                             │
├─────────────────────────────────────────────────────────┤
│  Development Requirements                             │
│  ├── Node.js 18+ (recommended 20+)                   │
│  ├── NPM 10+                                         │
│  ├── Modern code editor with TypeScript support      │
│  └── Git for version control                         │
├─────────────────────────────────────────────────────────┤
│  Deployment Requirements                              │
│  ├── Static file hosting capability                   │
│  ├── HTTPS for production (OAuth requirement)         │
│  ├── Google Cloud Console project                    │
│  └── Wallet extension distribution channels          │
└─────────────────────────────────────────────────────────┘
```