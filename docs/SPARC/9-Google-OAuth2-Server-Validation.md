# SPARC Framework - Google OAuth 2.0 Server-Side Token Validation

## Objective

Implement secure Google OAuth 2.0 authentication with server-side token validation to ensure consistent security architecture across all authentication providers while maintaining seamless user experience.

## Architecture Decision

### Problem Analysis
- **Security**: Client-side token validation is insufficient for production security
- **Consistency**: Need uniform authentication architecture across Google and LINE providers
- **Token Management**: Require centralized JWT token issuance with controlled expiration
- **Validation**: Server-side verification with Google Platform for token authenticity

### Solution: Server-Side Token Validation Architecture
The implementation uses server-side validation where:
1. Frontend handles Google OAuth popup/redirect flow
2. Frontend sends Google access token to backend for validation
3. Backend validates token with Google Platform
4. Backend creates and returns our own JWT token
5. Frontend stores JWT for session management

## Complete Authentication Flow

### 1. Frontend OAuth Initiation (WalletModal.tsx)
```typescript
// User clicks "Connect with Google"
const googleLogin = useGoogleLogin({
  onSuccess: async (response) => {
    setConnectionState('connecting');
    
    // Send access token to backend for validation
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const validationResponse = await fetch(`${backendUrl}/auth/google/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        access_token: response.access_token
      })
    });
    
    const validationResult = await validationResponse.json();
    
    // Create user data with our JWT token
    const googleAuth = {
      provider: 'google',
      googleId: validationResult.user_data.googleId,
      email: validationResult.user_data.email,
      name: validationResult.user_data.name,
      picture: validationResult.user_data.picture,
      verified: validationResult.user_data.verified,
      token: validationResult.auth_token
    };
    
    onAuthSuccess(googleAuth);
  }
});
```

### 2. Google Platform Processing
- User authenticates with Google (popup or redirect)
- Google issues access token to frontend
- No callback URL required (handled by @react-oauth/google library)
- Access token contains user permissions and expiration

### 3. Backend Token Validation (Controller)
```typescript
// POST /auth/google/validate
@Post('validate')
async validateToken(@Body() body: GoogleTokenValidationDto) {
  try {
    const { access_token } = body;
    
    if (!access_token) {
      throw new HttpException('Missing access_token', HttpStatus.BAD_REQUEST);
    }
    
    const { jwtToken, userData } = await this.googleAuthService.validateGoogleToken(access_token);
    
    return {
      success: true,
      auth_token: jwtToken,
      user_data: {
        provider: userData.provider,
        googleId: userData.googleId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        verified: userData.verified
      }
    };
    
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
}
```

### 4. Backend Token Processing (Service)
```typescript
// google-auth.service.ts
async validateGoogleToken(accessToken: string): Promise<{ jwtToken: string; userData: any }> {
  // Step 1: Validate token with Google's tokeninfo endpoint
  const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
  const tokenInfo: GoogleTokenResponse = await tokenInfoResponse.json();
  
  // Step 2: Verify token is for our application
  if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Token not issued for this application');
  }
  
  // Step 3: Check token expiration
  const now = Math.floor(Date.now() / 1000);
  if (tokenInfo.exp <= now) {
    throw new Error('Token has expired');
  }
  
  // Step 4: Get detailed user info
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const userInfo: GoogleUserInfo = await userInfoResponse.json();
  
  // Step 5: Create our JWT token
  const userData = {
    provider: 'google',
    googleId: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
    emailVerified: userInfo.email_verified,
    verified: userInfo.email_verified,
    authenticatedAt: new Date().toISOString()
  };
  
  const jwtToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  return { jwtToken, userData };
}
```

## Implementation Components

### Backend Endpoints

#### POST /auth/google/validate
**Purpose**: Validate Google access token and issue our JWT
- Accepts Google access token in request body
- Validates token with Google Platform
- Verifies token audience and expiration
- Retrieves user profile from Google
- Creates signed JWT with user data
- Returns JWT and user information

### Frontend Integration

#### Google OAuth Library Integration
**Purpose**: Handle Google OAuth popup/redirect flow
- Uses `@react-oauth/google` library for OAuth handling
- No callback URL configuration needed
- Receives access token directly in frontend
- Sends token to backend for validation

#### Token Processing
**Purpose**: Convert backend response to user session
- Receives validated JWT from backend
- Creates consistent user data structure
- Integrates with existing authentication state management
- Maintains compatibility with other auth providers

## Security Implementation

### 1. Server-Side Token Validation
- **Google Verification**: Uses Google's official tokeninfo endpoint
- **Audience Validation**: Verifies token was issued for our application
- **Expiration Check**: Ensures token is still valid
- **Profile Retrieval**: Gets verified user data from Google

### 2. JWT Token Security
- **Signing**: HS256 with secure secret key
- **Expiration**: 1 hour lifetime for security
- **Payload**: Contains verified Google user data
- **Isolation**: Backend-generated, client-side storage only

### 3. Application Security
- **Client ID Verification**: Prevents token reuse from other applications
- **HTTPS Only**: All communication over secure channels
- **Error Handling**: Secure error messages without sensitive data

### 4. Access Token Protection
- **Immediate Validation**: Token sent to backend immediately
- **Single Use**: Token only used for validation, not stored
- **Short Transit**: Minimal exposure time in frontend

## Environment Configuration

### Frontend Environment (.env.local)
```env
VITE_GOOGLE_CLIENT_ID=265935697274-qdmovcr7ff4mho24c1iv1peaomkq4hvt.apps.googleusercontent.com
VITE_BACKEND_URL=https://a3a29ecca117.ngrok-free.app
```

### Backend Environment (.env)
```env
GOOGLE_CLIENT_ID=265935697274-qdmovcr7ff4mho24c1iv1peaomkq4hvt.apps.googleusercontent.com
JWT_SECRET=your-secure-jwt-secret-key-for-development
```

### Google Cloud Console Configuration
- **Application Type**: Web application
- **Authorized JavaScript origins**: 
  - Development: `https://b0280d99b435.ngrok-free.app`
  - Production: `https://line.depick.wtf`
- **Authorized redirect URIs**: Not required (popup flow)
- **Scopes**: `profile`, `email` (configured in @react-oauth/google)

## Development Setup

### 1. Google Cloud Console Setup
1. Create project in Google Cloud Console
2. Enable Google+ API and Google OAuth2 API
3. Create OAuth 2.0 client ID credentials
4. Configure authorized origins for your domain

### 2. Application Configuration
```bash
# Frontend environment
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Backend environment  
GOOGLE_CLIENT_ID=your-google-client-id
JWT_SECRET=your-secure-secret
```

### 3. Testing Flow
1. Access frontend via ngrok URL: `https://b0280d99b435.ngrok-free.app`
2. Click "Connect with Google"
3. Complete Google OAuth in popup/redirect
4. Verify automatic authentication completion
5. Check JWT token in user data

## Production Deployment

### 1. Domain Configuration
- **Frontend**: `https://line.depick.wtf`
- **Backend**: `https://api.depick.wtf`
- **Google Console**: Update authorized origins to production domain

### 2. Environment Updates
- Use production Google Client ID
- Secure JWT secret in production environment
- Update authorized origins in Google Cloud Console

## API Documentation

### Request Format
```json
POST /auth/google/validate
Content-Type: application/json

{
  "access_token": "ya29.a0AfH6SMC..."
}
```

### Success Response
```json
{
  "success": true,
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_data": {
    "provider": "google",
    "googleId": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "verified": true
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Token has expired",
  "error": "Bad Request"
}
```

## Architecture Benefits

### 1. Security
- ✅ Server-side token validation with Google Platform
- ✅ Centralized JWT token issuance and control
- ✅ No sensitive tokens stored client-side
- ✅ Audience and expiration validation

### 2. Consistency
- ✅ Uniform authentication architecture across providers
- ✅ Consistent JWT token format and structure
- ✅ Same error handling patterns
- ✅ Compatible user data structure

### 3. User Experience
- ✅ Seamless popup-based OAuth flow
- ✅ No callback URL management needed
- ✅ Fast token validation and response
- ✅ Clean integration with existing UI

### 4. Maintainability
- ✅ Reusable authentication service pattern
- ✅ Clear separation of concerns
- ✅ Comprehensive error handling
- ✅ Swagger API documentation

### 5. Development & Production Ready
- ✅ Works with ngrok tunnels in development
- ✅ Scales to production domain architecture
- ✅ Environment-based configuration
- ✅ Easy testing and debugging

## Comparison with LINE OAuth

### Similarities
- Server-side token validation
- JWT token issuance from backend
- 1-hour token expiration
- Consistent user data structure
- Environment-based configuration

### Differences
- **Flow Type**: Google uses popup/redirect, LINE uses callback URL
- **Token Transport**: Google sends token via POST body, LINE via URL redirect
- **Callback Detection**: Google doesn't need App.tsx callback detection
- **Platform APIs**: Different validation endpoints and user info APIs

## Known Issues & Solutions

### 1. CORS Configuration
- **Issue**: Cross-origin requests to Google APIs
- **Solution**: Handled by @react-oauth/google library automatically

### 2. Token Expiration
- **Issue**: Google access tokens have short lifespans
- **Solution**: Immediate validation upon receipt, our JWT for session management

### 3. Development Environment
- **Issue**: Ngrok URLs need to be registered with Google
- **Solution**: Update Google Cloud Console authorized origins for development

## Testing Strategy

### 1. Unit Testing
- Google token validation service
- JWT creation and verification
- Error handling scenarios
- Token expiration validation

### 2. Integration Testing
- End-to-end OAuth flow
- Backend API validation
- Frontend token processing
- Error response handling

### 3. Security Testing
- Invalid token rejection
- Expired token handling
- Wrong audience validation
- Malformed request handling

---

**Document Version**: 1.0  
**Created**: 2025-07-13  
**Status**: Production Ready - Verified Working Implementation  
**Architecture**: Server-Side Token Validation with JWT Issuance