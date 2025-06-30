# SPARC Framework - Architecture

## System Overview

The MultiWallet implementation follows a layered architecture with clear separation of concerns, enabling scalable wallet integration while maintaining code simplicity and testability.

## Component Structure

### File Organization
```
src/wallet/
├── types.ts                    # Core type definitions and interfaces
├── WalletConnector.ts          # Business logic layer (wallet operations)
├── WalletModal.tsx             # Presentation layer (React UI)
├── WalletModal.module.scss     # Styling (component-scoped CSS)
└── WalletConnector.test.ts     # Unit tests (business logic verification)

docs/SPARC/
├── 1-Specification.md          # Requirements and constraints
├── 2-Pseudocode.md            # Implementation logic
└── 3-Architecture.md          # This document
```

### Layer Responsibilities

**1. Type System (`types.ts`)**
- Defines all interfaces and type contracts
- Ensures type safety across component boundaries
- Serves as documentation for data structures
- No runtime dependencies

**2. Business Logic (`WalletConnector.ts`)**
- Pure TypeScript class with no UI dependencies
- Handles all wallet-specific connection logic
- Manages connection state and error handling
- Provides unified interface for different wallet types
- Testable in isolation

**3. Presentation Layer (`WalletModal.tsx`)**
- React functional component with hooks
- Delegates all business logic to WalletConnector
- Manages UI state (loading, errors, user interactions)
- Responsive design with accessibility considerations

**4. Styling (`WalletModal.module.scss`)**
- Component-scoped styles using CSS modules
- BEM-like naming conventions for maintainability
- Responsive design patterns
- Animation and transition definitions

## Architectural Patterns

### 1. Adapter Pattern

**Purpose**: Provide unified interface for different wallet types
**Implementation**:
```typescript
class WalletConnector {
  async connect(provider: WalletProvider): Promise<WalletConnectionResult> {
    switch (provider) {
      case 'kaia': return this.connectKaia();
      case 'okx': return this.connectOkx();
      // Future wallets follow same pattern
    }
  }
}
```

**Benefits**:
- Single interface for consumers
- Easy to add new wallet types
- Wallet-specific logic encapsulated
- Consistent error handling across providers

### 2. State Management Pattern

**Connection State Flow**:
```
DISCONNECTED → CONNECTING → CONNECTED
                    ↓
                  ERROR
```

**Implementation**:
- Centralized state in WalletConnector
- Immutable state transitions
- Error states with descriptive messages
- State synchronization between UI and business logic

### 3. Dependency Injection

**External Dependencies**:
- KAIA: `@kaiachain/ethers-ext/v6` - Blockchain interaction
- OKX: Standard Web3 provider interface
- React: UI framework with hooks
- SCSS: Styling with CSS modules

**Abstraction Strategy**:
- Window object extensions for wallet detection
- Provider interfaces for blockchain interaction
- Callback patterns for UI communication

## Type System Architecture

### Core Type Hierarchy

```typescript
// Base Types
type WalletProvider = 'kaia' | 'okx' | 'google' | 'line';

// Data Structures
interface WalletAccount {
  address: string;      // Blockchain address
  chainId: number;      // Network identifier
  provider: WalletProvider;  // Wallet type
}

interface WalletConnection {
  account: WalletAccount;
  isConnected: boolean;
  signer?: any;         // Ethers.js signer instance
}

// Operation Results
interface WalletConnectionResult {
  success: boolean;
  connection?: WalletConnection;
  error?: string;
}

// UI State
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Component Props
interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: WalletProvider) => Promise<WalletConnectionResult>;
}
```

### Type Safety Strategy

**Strict TypeScript Configuration**:
- No implicit any types
- Strict null checks enabled
- Exact property types required
- Compile-time error detection

**Runtime Type Validation**:
- Wallet availability checks
- Account array validation
- Network response validation
- Error message typing

## Integration Architecture

### Blockchain Integration

**KAIA Integration**:
```typescript
import { v6 as kaiaV6 } from '@kaiachain/ethers-ext';

// Provider creation
const provider = new kaiaV6.providers.Web3Provider(window.klaytn);
const network = await provider.getNetwork();
const signer = provider.getSigner();
```

**OKX Integration**:
```typescript
// Standard Web3 provider pattern
const provider = new kaiaV6.providers.Web3Provider(window.okxwallet);
const accounts = await window.okxwallet.request({
  method: 'eth_requestAccounts'
});
```

### Error Handling Architecture

**Error Classification**:
1. **Wallet Not Available**: Extension not installed
2. **No Accounts**: Wallet locked or no accounts created
3. **Network Errors**: RPC communication failures
4. **User Rejection**: User cancelled connection request

**Error Propagation**:
```
WalletConnector (throws typed errors)
        ↓
WalletModal (catches and displays)
        ↓
User (sees actionable error messages)
```

## Testing Architecture

### Unit Testing Strategy

**WalletConnector Tests**:
```typescript
describe('WalletConnector', () => {
  // State management tests
  test('should initialize with disconnected state');
  test('should handle unsupported provider');
  
  // Wallet-specific tests
  test('should handle missing KAIA wallet');
  test('should handle missing OKX wallet');
  
  // Connection lifecycle tests
  test('should disconnect successfully');
});
```

**Mock Strategy**:
- Mock window object for browser APIs
- Mock wallet extension interfaces
- Mock network responses and errors
- Isolated testing of business logic

### Integration Testing Approach

**Browser Testing**:
- Real wallet extension integration
- User interaction flows
- Network switching scenarios
- Error recovery testing

## Performance Architecture

### Optimization Strategies

**1. Lazy Loading**:
- Wallet-specific code loaded on demand
- Dynamic imports for large dependencies
- Progressive enhancement approach

**2. Efficient Rendering**:
- React.memo for component optimization
- useCallback for event handlers
- Minimal re-renders on state changes

**3. Bundle Optimization**:
- Tree-shaking for unused code
- Code splitting by wallet type
- Minimal core bundle size

### Performance Metrics

**Target Metrics**:
- Modal open time: <500ms
- Connection feedback: <100ms
- Bundle size increase: <100KB
- Memory usage: <10MB additional

## Security Architecture

### Security Principles

**1. No Private Key Handling**:
- Application never sees private keys
- All signing done by wallet extensions
- Minimal privilege principle

**2. Input Validation**:
- Wallet address format validation
- Network ID verification
- Error message sanitization

**3. Secure Communication**:
- HTTPS only in production
- CSP headers for XSS protection
- Wallet extension sandboxing

### Trust Boundaries

```
User's Wallet Extension ←→ MultiWallet App ←→ KAIA Blockchain
     (Trusted)              (Untrusted)        (Trusted)
```

**Security Controls**:
- Wallet extension handles all cryptographic operations
- Application only receives public information
- Network requests use wallet's RPC providers

## Extension Architecture

### Adding New Wallets

**1. Type System Extension**:
```typescript
// Update provider type
type WalletProvider = 'kaia' | 'okx' | 'bitget' | 'google' | 'line';

// Add global window interface
declare global {
  interface Window {
    bitkeep?: any;  // Add new wallet interface
  }
}
```

**2. Business Logic Extension**:
```typescript
// Add new connection method
private async connectBitget(): Promise<WalletConnectionResult> {
  // Follow established pattern
  // Return same interface
}

// Update main connect method
switch (provider) {
  case 'bitget': return this.connectBitget();
  // ... existing cases
}
```

**3. UI Extension**:
```typescript
// Add new button to modal
<button onClick={() => handleConnect('bitget')}>
  <div className="wallet-icon bitget-icon">🔷</div>
  <span>Connect with Bitget Wallet</span>
</button>
```

**4. Testing Extension**:
```typescript
// Add wallet-specific tests
test('should handle missing Bitget wallet', async () => {
  // Test implementation
});
```

### Extensibility Principles

**1. Open/Closed Principle**:
- Open for extension (new wallets)
- Closed for modification (existing code)

**2. Interface Segregation**:
- Small, focused interfaces
- Minimal dependencies between components

**3. Dependency Inversion**:
- Depend on abstractions, not concretions
- Wallet-specific code isolated

## Configuration Architecture

### Environment Configuration

**Network Settings**:
```typescript
const KAIA_MAINNET = {
  chainId: '0x2019',        // 8217 in hex
  chainName: 'KAIA Mainnet',
  rpcUrls: ['https://public-en-cypress.klaytn.net'],
  blockExplorerUrls: ['https://scope.klaytn.com/']
};

const KAIA_TESTNET = {
  chainId: '0x3e9',         // 1001 in hex
  chainName: 'KAIA Testnet',
  rpcUrls: ['https://public-en-baobab.klaytn.net'],
  blockExplorerUrls: ['https://baobab.scope.klaytn.com/']
};
```

**Build Configuration**:
- TypeScript strict mode enabled
- Jest for unit testing
- ESLint for code quality
- SCSS modules for styling

### Deployment Considerations

**Production Requirements**:
- Node.js 20+ for optimal performance
- HTTPS mandatory for wallet security
- CSP headers for XSS protection
- Error logging and monitoring

**Development Setup**:
- Hot reload for rapid development
- Source maps for debugging
- Mock wallet interfaces for testing
- Comprehensive error logging

---

**Document Version**: 1.0  
**Created**: 2025-06-29  
**Implementation Status**: Core architecture implemented and validated  
**Next Phase**: Bitget wallet integration following established patterns