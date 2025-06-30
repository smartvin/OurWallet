# SPARC Framework - Google Authentication

## Authentication Strategy: Client-Side Google Sign-In

### Overview
MultiWallet implements client-side Google authentication using the Google Sign-In JavaScript library, matching the dePick repository approach for seamless integration compatibility.

### Design Decision: Client-Side vs Server-Side

#### Rejected Approach: Server-Side OAuth 2.0
**Previous Implementation** (removed):
- Used `passport-google-oauth20` strategy
- Required `GOOGLE_CLIENT_SECRET` and callback URLs
- Complex redirect flows with session management
- `/auth/google` and `/auth/google/callback` endpoints

**Why Rejected**:
- ❌ Unnecessary complexity for wallet authentication
- ❌ Additional secrets management (`GOOGLE_CLIENT_SECRET`)
- ❌ Incompatible with dePick's client-side approach
- ❌ Complex redirect flows for simple modal authentication

#### Chosen Approach: Client-Side Google Sign-In
**Implementation**:
- Uses Google Sign-In JavaScript library (`gapi.load('auth2')`)
- Only requires `GOOGLE_CLIENT_ID` (no secrets)
- Authentication happens entirely in browser
- Returns Google ID token for user verification

**Why Chosen**:
- ✅ Simple implementation matching dePick patterns
- ✅ Perfect compatibility for component grafting
- ✅ No server-side complexity or secrets
- ✅ Secure and sufficient for wallet authentication

### Technical Implementation

#### Client-Side Flow
1. **Load Google API**: Import Google Sign-In JavaScript library
2. **Initialize**: Configure with `GOOGLE_CLIENT_ID`
3. **Authenticate**: Call `gapi.auth2.getAuthInstance().signIn()`
4. **Extract Token**: Get ID token from auth response
5. **User Data**: Decode token for user email, name, picture

#### Code Structure
```typescript
// React Component
const handleGoogleOAuth = async () => {
  const auth2 = gapi.auth2.getAuthInstance();
  const googleUser = await auth2.signIn();
  const profile = googleUser.getBasicProfile();
  const idToken = googleUser.getAuthResponse().id_token;
  
  return {
    provider: 'google',
    email: profile.getEmail(),
    name: profile.getName(),
    picture: profile.getImageUrl(),
    token: idToken
  };
};
```

### Environment Configuration

#### Required Environment Variables
- **`VITE_GOOGLE_CLIENT_ID`**: Google OAuth 2.0 Client ID
  - Format: `{numbers}.apps.googleusercontent.com`
  - Obtained from Google Cloud Console
  - Must be prefixed with `VITE_` for Vite access

#### Google Cloud Console Configuration
**Authorized JavaScript Origins**:
- Development: `http://localhost:5173` (matches existing configuration)
- Production: Your deployed domain

**Note**: Vite dev server must run on port 5173 to match Google Cloud configuration

**No Callback URLs Required** (client-side flow doesn't use them)

### Security Considerations

#### Token Validation
- **Client Validation**: Google Sign-In library validates tokens automatically
- **Optional Server Validation**: Can verify ID token server-side if needed
- **Scope Limitation**: Only requests email and profile information

#### Data Handling
- **No Sensitive Storage**: No refresh tokens or long-lived credentials
- **Session Management**: React state only, no server sessions
- **Logout**: Clear local auth state only

### Integration with dePick

#### Component Compatibility
```typescript
// MultiWallet implementation
const { user, login } = useAuth(); // Will match dePick's useAuth hook
await login('google', googleUserData);

// dePick integration (future)
import { WalletModal } from '@multiwallet/components';
// Works identically with existing dePick authentication
```

#### Shared Patterns
- **Authentication Hook**: Compatible with dePick's `useAuth` pattern
- **User Data Format**: Matches dePick's user object structure
- **Error Handling**: Consistent error messaging and states

### Migration from Server-Side OAuth

#### Removal Steps
1. **Remove Files**:
   - `/src/auth/google.strategy.ts`
   - `/src/auth/auth.controller.ts` (Google endpoints)
   - `/src/auth/auth.module.ts` (passport imports)

2. **Remove Dependencies**:
   - `passport-google-oauth20`
   - `@nestjs/passport` (if only used for Google)

3. **Environment Cleanup**:
   - Remove `GOOGLE_CLIENT_SECRET`
   - Remove `GOOGLE_CALLBACK_URL`
   - Keep only `VITE_GOOGLE_CLIENT_ID`

#### Benefits of Migration
- **Reduced Complexity**: ~200 lines of server code removed
- **Simplified Deployment**: No OAuth secrets in production
- **Better UX**: No page redirects, modal stays open
- **dePick Compatibility**: Perfect alignment with target architecture

### Testing Strategy

#### Development Testing
1. **Local Development**: Test with `http://localhost:5173`
2. **Modal Flow**: Verify authentication doesn't redirect page
3. **Error Handling**: Test with blocked popups, network errors
4. **User Data**: Verify correct profile information extraction

#### Integration Testing
1. **Component Isolation**: Test WalletModal independently
2. **Authentication State**: Verify proper state management
3. **dePick Compatibility**: Test components work in dePick environment

### Success Metrics

#### Technical Success
- ✅ Authentication completes within modal (no page redirect)
- ✅ User data properly extracted and formatted
- ✅ Error states handled gracefully
- ✅ Compatible with existing dePick authentication patterns

#### User Experience Success
- ✅ Single-click Google authentication
- ✅ Modal remains open during auth flow
- ✅ Clear error messages for auth failures
- ✅ Consistent UI across wallet providers

---

**Document Version**: 1.0  
**Created**: 2025-06-30  
**Status**: Design Approved, Implementation Pending  
**Dependencies**: Remove server-side OAuth, Add client-side Google library