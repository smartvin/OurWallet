# SPARC Framework - KAIA Wallet Cryptographic Authentication Protocol

## Objective

Implement secure Web3 wallet authentication using cryptographic challenge-response protocol to prove private key ownership without revealing sensitive key material, then issue JWT tokens for session management.

## Architecture Decision

### Problem Analysis
- **Trust Model**: Web3 wallets have no centralized authority to validate ownership
- **Security Requirement**: Must prove control of private key without exposing it
- **Replay Prevention**: Signatures must be single-use and time-bound
- **Cross-Application Security**: Signatures must be domain-bound to prevent reuse
- **Session Management**: Need JWT tokens consistent with other auth providers

### Solution: Cryptographic Challenge-Response Protocol
The implementation uses mathematical proof of private key ownership:
1. Server generates cryptographically secure challenge
2. Client signs challenge with private key (never transmitted)
3. Server verifies signature and recovers public key
4. Server derives wallet address and validates ownership
5. Server issues JWT token for verified wallet address

## Cryptographic Protocol Specification

### 1. Challenge Generation Protocol

**Server-Side Challenge Creation:**
```typescript
interface WalletChallenge {
  nonce: string;           // 32-byte cryptographically secure random
  timestamp: number;       // Unix epoch timestamp
  domain: string;          // Application domain identifier
  purpose: string;         // Human-readable authentication intent
  expiresAt: number;       // Challenge expiration timestamp
}

// Challenge message format (deterministic)
const challengeMessage = 
  `Sign in to MultiWallet\n` +
  `Domain: ${domain}\n` +
  `Nonce: ${nonce}\n` +
  `Timestamp: ${timestamp}`;
```

**Security Properties:**
- **Nonce Uniqueness**: 256-bit entropy prevents collision attacks
- **Temporal Binding**: Timestamp prevents delayed replay attacks  
- **Domain Binding**: Prevents cross-application signature reuse
- **Human Readability**: Clear intent prevents social engineering

### 2. Client-Side Signature Generation

**ECDSA Signature Process:**
```typescript
// Message preparation
const messageHash = keccak256(challengeMessage);

// ECDSA signature creation (secp256k1 curve)
const signature = wallet.signMessage(challengeMessage);
// Returns: { r, s, v } where:
// r, s: ECDSA signature components (32 bytes each)
// v: Recovery identifier (1 byte)
```

**Cryptographic Properties:**
- **Private Key Isolation**: Key never leaves secure environment
- **Deterministic Hashing**: Keccak-256 provides message integrity
- **Signature Uniqueness**: Each signature mathematically unique
- **Non-Repudiation**: Signature cryptographically binds user to message

### 3. Server-Side Verification Protocol

**Multi-Step Cryptographic Verification:**

**Step 3a: Challenge Validation**
```typescript
// Verify challenge exists and is valid
const challenge = challengeStore.get(nonceId);
if (!challenge || Date.now() > challenge.expiresAt) {
  throw new Error('Invalid or expired challenge');
}

// Prevent nonce reuse
challengeStore.delete(nonceId);
```

**Step 3b: Message Reconstruction**
```typescript
// Reconstruct expected message
const expectedMessage = 
  `Sign in to MultiWallet\n` +
  `Domain: ${challenge.domain}\n` +
  `Nonce: ${challenge.nonce}\n` +
  `Timestamp: ${challenge.timestamp}`;

// Verify message integrity
if (receivedMessage !== expectedMessage) {
  throw new Error('Message format mismatch');
}
```

**Step 3c: Cryptographic Signature Verification**
```typescript
// ECDSA public key recovery
const messageHash = keccak256(expectedMessage);
const recoveredPublicKey = ecrecover(messageHash, signature.v, signature.r, signature.s);

// Ethereum address derivation
const publicKeyHash = keccak256(recoveredPublicKey);
const derivedAddress = '0x' + publicKeyHash.slice(-40);

// Address verification
if (derivedAddress.toLowerCase() !== claimedAddress.toLowerCase()) {
  throw new Error('Signature verification failed');
}
```

**Mathematical Security Foundation:**
- **ECDSA Security**: Based on Elliptic Curve Discrete Logarithm Problem
- **Public Key Recovery**: Mathematically derives public key from signature
- **Address Derivation**: Deterministic mapping from public key to address
- **Verification Completeness**: Proves private key ownership without exposure

### 4. JWT Token Issuance

**Verified Wallet Session Token:**
```typescript
const walletUserData = {
  provider: 'kaia',
  address: verifiedAddress,
  chainId: 8217,
  verified: true,
  authenticatedAt: new Date().toISOString(),
  signatureMethod: 'ECDSA-secp256k1'
};

const jwtToken = jwt.sign(walletUserData, process.env.JWT_SECRET, { 
  expiresIn: '1h',
  issuer: 'multiwallet-auth',
  subject: verifiedAddress
});
```

## Implementation Architecture

### Backend Components

#### 1. Challenge Generation Service
```typescript
@Injectable()
export class KaiaAuthService {
  private challengeStore = new Map<string, WalletChallenge>();
  
  async generateChallenge(): Promise<ChallengeResponse> {
    const nonce = randomBytes(32).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);
    const challengeId = randomBytes(16).toString('hex');
    
    const challenge: WalletChallenge = {
      nonce,
      timestamp,
      domain: process.env.APP_DOMAIN || 'localhost',
      purpose: 'Sign in to MultiWallet',
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
    
    this.challengeStore.set(challengeId, challenge);
    
    const message = this.constructMessage(challenge);
    
    return {
      challengeId,
      message,
      expiresAt: challenge.expiresAt
    };
  }
}
```

#### 2. Signature Verification Service
```typescript
async verifySignature(
  challengeId: string,
  address: string, 
  signature: string,
  message: string
): Promise<{ jwtToken: string; userData: any }> {
  
  // Step 1: Validate challenge
  const challenge = this.validateChallenge(challengeId);
  
  // Step 2: Verify message format
  this.verifyMessageFormat(message, challenge);
  
  // Step 3: Cryptographic verification
  const verified = this.cryptographicVerification(address, signature, message);
  
  if (!verified) {
    throw new Error('Cryptographic verification failed');
  }
  
  // Step 4: Issue JWT
  const userData = this.createUserData(address);
  const jwtToken = this.createJWT(userData);
  
  return { jwtToken, userData };
}
```

#### 3. Controller Endpoints
```typescript
@Controller('auth/kaia')
export class KaiaAuthController {
  
  @Get('challenge')
  async generateChallenge(): Promise<ChallengeResponse> {
    return this.kaiaAuthService.generateChallenge();
  }
  
  @Post('verify')
  async verifySignature(@Body() verifyDto: SignatureVerifyDto) {
    const { jwtToken, userData } = await this.kaiaAuthService.verifySignature(
      verifyDto.challengeId,
      verifyDto.address,
      verifyDto.signature,
      verifyDto.message
    );
    
    return {
      success: true,
      auth_token: jwtToken,
      user_data: userData
    };
  }
}
```

### Frontend Integration

#### 1. Challenge Request Flow
```typescript
const handleKaiaWallet = async () => {
  // Step 1: Request challenge from server
  const challengeResponse = await fetch(`${backendUrl}/auth/kaia/challenge`);
  const { challengeId, message, expiresAt } = await challengeResponse.json();
  
  // Step 2: Connect to KAIA wallet
  const accounts = await window.klaytn.enable();
  const address = accounts[0];
  
  // Step 3: Sign challenge message
  const signature = await window.klaytn.sign(message, address);
  
  // Step 4: Submit proof to server
  const verifyResponse = await fetch(`${backendUrl}/auth/kaia/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId,
      address,
      signature,
      message
    })
  });
  
  const result = await verifyResponse.json();
  
  // Step 5: Process JWT token
  const userData = {
    provider: 'kaia',
    address: result.user_data.address,
    chainId: result.user_data.chainId,
    verified: result.user_data.verified,
    token: result.auth_token
  };
  
  onAuthSuccess(userData);
};
```

## Security Analysis

### Attack Vector Mitigation

#### 1. Replay Attack Prevention
**Attack**: Reuse valid signature from previous session
**Mitigation**: 
- Single-use nonces with cryptographic uniqueness
- Time-bound challenges (5-minute expiration)
- Nonce consumption after verification

#### 2. Cross-Application Signature Reuse
**Attack**: Use wallet signature from different application
**Mitigation**:
- Domain binding in challenge message
- Application-specific message format
- Domain verification in message reconstruction

#### 3. Man-in-the-Middle Attacks
**Attack**: Intercept and modify authentication data
**Mitigation**:
- Cryptographic signature covers entire message
- Message integrity verification
- HTTPS-only communication

#### 4. Private Key Extraction
**Attack**: Derive private key from signature
**Mitigation**:
- ECDSA mathematical security (discrete logarithm problem)
- Private key never transmitted
- Signature provides zero knowledge proof

#### 5. Address Spoofing
**Attack**: Claim ownership of another wallet address
**Mitigation**:
- Cryptographic proof of private key ownership
- Mathematical address derivation from public key
- Signature verification ensures authentic ownership

### Cryptographic Security Properties

#### 1. **Authenticity**
- Digital signature proves message origin from private key holder
- Public key recovery provides mathematical verification
- Non-forgeable under cryptographic assumptions

#### 2. **Integrity** 
- Hash function ensures message tampering detection
- Signature invalidation upon any message modification
- Deterministic message format prevents malleability

#### 3. **Non-Repudiation**
- Signature mathematically binds user to authentication request
- Cryptographic proof prevents denial of authentication
- Audit trail with verified wallet addresses

#### 4. **Confidentiality**
- Private key never exposed or transmitted
- Zero-knowledge proof of key ownership
- Session isolation through unique challenges

### Protocol Security Assumptions

#### 1. **Cryptographic Primitives**
- ECDSA security based on discrete logarithm problem
- Keccak-256 hash function collision resistance
- secp256k1 curve parameter security

#### 2. **Implementation Security**
- Secure random number generation for nonces
- Constant-time signature verification operations
- Secure key storage in user wallet environment

#### 3. **Transport Security**
- HTTPS/TLS for all communication channels
- Certificate pinning in production environment
- Secure WebSocket connections for wallet interaction

## Environment Configuration

### Backend Environment (.env)
```env
# KAIA Authentication Configuration
APP_DOMAIN=line.depick.wtf
KAIA_CHAIN_ID=8217
JWT_SECRET=your-secure-jwt-secret-key
CHALLENGE_EXPIRY_MINUTES=5
```

### Frontend Environment (.env.local)
```env
VITE_BACKEND_URL=https://a3a29ecca117.ngrok-free.app
VITE_KAIA_CHAIN_ID=8217
```

## API Specification

### GET /auth/kaia/challenge

**Purpose**: Generate cryptographic challenge for wallet authentication

**Response:**
```json
{
  "challengeId": "a1b2c3d4e5f6...",
  "message": "Sign in to MultiWallet\nDomain: line.depick.wtf\nNonce: 0x1234...\nTimestamp: 1673123456",
  "expiresAt": 1673123756000
}
```

### POST /auth/kaia/verify

**Purpose**: Verify cryptographic signature and issue JWT

**Request:**
```json
{
  "challengeId": "a1b2c3d4e5f6...",
  "address": "0x742C...4BaB",
  "signature": "0x1234567890abcdef...",
  "message": "Sign in to MultiWallet\n..."
}
```

**Success Response:**
```json
{
  "success": true,
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_data": {
    "provider": "kaia",
    "address": "0x742C...4BaB",
    "chainId": 8217,
    "verified": true,
    "signatureMethod": "ECDSA-secp256k1"
  }
}
```

## Development & Testing

### 1. Local Development Setup
- Kaikas wallet extension installation
- KAIA testnet configuration (Baobab)
- Test wallet with KAIA tokens for gas fees

### 2. Testing Strategy
- Unit tests for cryptographic functions
- Integration tests for complete auth flow
- Security tests for attack vector verification
- Load tests for challenge generation scalability

### 3. Security Auditing
- Cryptographic library security review
- Signature verification correctness testing
- Timing attack prevention verification
- Random number generation quality assessment

## Production Considerations

### 1. Scalability
- In-memory challenge store replacement with Redis
- Horizontal scaling of verification services
- Challenge cleanup automation
- Performance monitoring for cryptographic operations

### 2. Security Hardening
- Hardware security modules for JWT signing
- Rate limiting on challenge generation
- Comprehensive security logging and monitoring
- Regular security dependency updates

### 3. Monitoring & Alerting
- Authentication success/failure metrics
- Challenge expiration tracking
- Signature verification performance monitoring
- Security incident detection and response

## Advantages Over Traditional Auth

### 1. **Decentralized Trust**
- No reliance on centralized identity providers
- User maintains complete control over credentials
- Cryptographic proof eliminates trust assumptions

### 2. **Privacy Preservation**
- No personal information required
- Pseudonymous authentication via wallet address
- Zero-knowledge proof of ownership

### 3. **Cross-Platform Compatibility**
- Works with any ECDSA-compatible wallet
- Standard cryptographic primitives
- Universal Web3 wallet integration

### 4. **Future-Proof Architecture**
- Compatible with Web3 ecosystem evolution
- Extensible to other blockchain networks
- Standards-based implementation

---

**Document Version**: 1.0  
**Created**: 2025-07-13  
**Status**: Design Complete - Ready for Implementation  
**Security Model**: Cryptographic Challenge-Response with Zero-Knowledge Proof  
**Cryptographic Foundation**: ECDSA secp256k1 + Keccak-256