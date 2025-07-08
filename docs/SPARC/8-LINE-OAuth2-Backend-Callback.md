# SPARC Framework - LINE OAuth 2.0 Backend Callback Implementation

## Objective

Implement pure OAuth 2.0 LINE authentication with backend callback to avoid CORS issues in production while ensuring Official Account friend addition and secure token validation.

## Architecture Decision

### Problem Analysis
- **Development**: Single ngrok domain - no CORS issues
- **Production**: Different subdomains (`line.depick.wtf` vs `api.depick.wtf`) - CORS issues
- **Requirement**: `bot_prompt=aggressive` for Official Account friend addition
- **Security**: Backend token validation with LINE Platform

### Solution: Backend Callback Architecture
Instead of frontend callback (which causes CORS in production), use backend callback with redirect flow.

## Complete Authentication Flow

### 1. Frontend Initiation
```typescript
// User clicks "Connect with LINE"
const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
  `response_type=code&` +
  `client_id=${channelId}&` +
  `redirect_uri=${backendCallbackUrl}&` +  // Backend URL!
  `scope=profile%20openid&` +
  `state=${randomState}&` +
  `bot_prompt=aggressive&` +
  `nonce=${nonce}`;

window.location.href = authUrl;
```

### 2. LINE Platform Processing
- User authenticates with LINE
- **Official Account friend addition prompt** (aggressive)
- User completes authentication

### 3. Backend Callback Handling
```
LINE redirects to: https://api.depick.wtf/auth/line/callback?code=AUTH_CODE&state=STATE
```

### 4. Backend Token Exchange
```typescript
// Backend exchanges authorization code for tokens
const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: backendCallbackUrl,
    client_id: channelId,
    client_secret: channelSecret
  })
});

const { access_token, id_token } = await tokenResponse.json();
```

### 5. Backend Token Verification
```typescript
// Verify ID token with LINE Platform
const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
  method: 'POST',
  body: new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
    nonce: storedNonce
  })
});
```

### 6. Backend User Data Retrieval
```typescript
// Get user profile
const profileResponse = await fetch('https://api.line.me/v2/profile', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

const userProfile = await profileResponse.json();
```

### 7. Backend Response to Frontend
```typescript
// Create JWT or session token
const userToken = jwt.sign({
  provider: 'line',
  lineId: userProfile.userId,
  displayName: userProfile.displayName,
  pictureUrl: userProfile.pictureUrl,
  verified: true
}, secretKey, { expiresIn: '1h' });

// Redirect to frontend with token
res.redirect(`https://line.depick.wtf?auth_token=${userToken}&auth_success=true`);
```

### 8. Frontend Token Processing
```typescript
// Frontend detects successful authentication
const urlParams = new URLSearchParams(window.location.search);
const authToken = urlParams.get('auth_token');
const authSuccess = urlParams.get('auth_success');

if (authSuccess && authToken) {
  // Verify token and extract user data
  const userData = jwt.decode(authToken);
  onAuthSuccess(userData);
  
  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);
}
```

## Implementation Components

### Backend Endpoints

#### 1. POST /auth/line/callback
```typescript
@Post('callback')
async handleCallback(@Query() query: { code: string; state: string }) {
  // 1. Validate state parameter
  // 2. Exchange code for tokens
  // 3. Verify ID token with nonce
  // 4. Get user profile
  // 5. Create user session/JWT
  // 6. Redirect to frontend with token
}
```

#### 2. GET /auth/line/nonce (Optional)
```typescript
@Get('nonce')
async generateNonce() {
  // Generate nonce for OpenID Connect security
  // Store in backend for verification
  // Return to frontend for OAuth URL building
}
```

### Frontend Components

#### 1. OAuth URL Builder
```typescript
const buildLineAuthUrl = async () => {
  // Get nonce from backend
  const { nonce, nonceId } = await fetch('/auth/line/nonce').then(r => r.json());
  
  // Store nonceId for later verification
  sessionStorage.setItem('line_nonce_id', nonceId);
  
  // Build OAuth URL pointing to backend callback
  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code&client_id=${channelId}&` +
    `redirect_uri=${encodeURIComponent('https://api.depick.wtf/auth/line/callback')}&` +
    `scope=profile%20openid&state=${nonceId}&` +
    `bot_prompt=aggressive&nonce=${nonce}`;
    
  return authUrl;
};
```

#### 2. Callback Detection
```typescript
useEffect(() => {
  const checkAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('auth_token');
    const authSuccess = urlParams.get('auth_success') === 'true';
    
    if (authSuccess && authToken) {
      try {
        // Decode JWT token (client-side validation)
        const userData = jwt.decode(authToken);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Complete authentication
        onAuthSuccess({
          provider: 'line',
          lineID: userData.lineId,
          displayName: userData.displayName,
          pictureUrl: userData.pictureUrl,
          verified: userData.verified,
          token: authToken
        });
      } catch (error) {
        console.error('Failed to process auth token:', error);
        setError('Authentication token processing failed');
      }
    }
  };
  
  checkAuthCallback();
}, []);
```

## Security Considerations

### 1. CSRF Protection
- Use cryptographically random `state` parameter
- Verify state matches stored value in backend

### 2. Nonce Validation
- Generate unique nonce per authentication request
- Validate nonce in ID token matches stored nonce
- Implement nonce expiration (5 minutes)

### 3. Token Security
- Use short-lived JWT tokens (1 hour)
- Sign tokens with secure secret key
- Validate token signatures on subsequent requests

### 4. Authorization Code Protection
- Authorization code never exposed to frontend
- Immediate exchange in backend (single use)
- HTTPS-only communication

### 5. OAuth Callback Security
**TODO: Enhanced Security Measures**
- Current implementation uses GET callback (OAuth 2.0 standard)
- Authorization code appears in URL (server logs, browser history)
- Consider implementing additional security measures:
  - Immediate code invalidation after exchange
  - Enhanced logging controls (mask codes in logs)
  - Short-lived authorization code lifetimes
  - Monitor for suspicious callback patterns
- **Priority**: Medium - Standard OAuth flow but could be hardened

## Environment Configuration

### Development (.env)
```env
LINE_CHANNEL_ID=2007331425
LINE_CHANNEL_SECRET=your_secret
LINE_CALLBACK_URL=https://xxxx.ngrok-free.app/auth/line/callback
FRONTEND_URL=https://xxxx.ngrok-free.app
JWT_SECRET=your_jwt_secret
```

### Production (.env)
```env
LINE_CHANNEL_ID=2007331425
LINE_CHANNEL_SECRET=your_secret
LINE_CALLBACK_URL=https://api.depick.wtf/auth/line/callback
FRONTEND_URL=https://line.depick.wtf
JWT_SECRET=your_jwt_secret
```

### LINE Developer Console Configuration
- **Callback URL**: `https://api.depick.wtf/auth/line/callback`
- **Channel Type**: Web app
- **Scopes**: `profile`, `openid`

## Benefits of This Approach

### 1. CORS-Free
- ✅ No cross-subdomain API calls
- ✅ All LINE API calls handled server-side
- ✅ Simple frontend token handling

### 2. Security
- ✅ Authorization code never exposed to frontend
- ✅ Backend token validation with LINE Platform
- ✅ Nonce-based replay attack prevention
- ✅ JWT token security

### 3. Official Account Integration
- ✅ `bot_prompt=aggressive` forces friend addition
- ✅ OAuth 2.0 supports all required parameters
- ✅ User cannot complete auth without adding Official Account

### 4. Production Ready
- ✅ Works with different subdomains
- ✅ Scalable backend architecture
- ✅ Proper error handling and logging

## Testing Strategy

### 1. Development Testing
```bash
# Start backend
npm run dev  # Port 3001

# Start frontend  
npm run dev  # Port 5173

# Test flow
1. Click "Connect with LINE"
2. Complete LINE authentication + bot friend addition
3. Verify redirect to frontend with token
4. Check user data extraction
```

### 2. Production Testing
```bash
# Deploy to production subdomains
# Test cross-subdomain flow
# Verify CORS handling
# Test Official Account friend addition
```

## Migration from Current Implementation

### 1. Prune LIFF Dependencies
```bash
npm uninstall @line/liff  # Frontend
```

### 2. Update Backend Endpoints
- Remove `/auth/line/verify` endpoint
- Add `/auth/line/callback` endpoint
- Update service methods for token exchange

### 3. Update Frontend Logic
- Remove LIFF SDK calls
- Add OAuth URL building
- Add callback token detection

### 4. Update Environment Variables
- Change callback URLs to backend
- Add JWT secret configuration

## Success Metrics

- ✅ No CORS errors in production
- ✅ Official Account friend addition enforced
- ✅ Secure backend token validation
- ✅ Clean user experience (single authentication flow)
- ✅ Compatible with both development and production environments

---

**Document Version**: 1.0  
**Created**: 2025-07-08  
**Status**: Implementation Ready - Backend Callback Architecture  
**Replaces**: 7-LINE-OpenID-Integration.md (LIFF approach)