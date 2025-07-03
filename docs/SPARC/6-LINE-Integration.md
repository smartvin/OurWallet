# SPARC Framework - LINE Integration

## LINE Login Implementation

### Overview
LINE login integration added to WalletModal.tsx using @line/liff SDK with Promise wrapper pattern to handle callback constraints.

### Technical Implementation

#### Key Challenge: liff.init() Callback Constraint
LINE's `liff.init()` function does not work with `await` and requires `.then()` callbacks. Solution: Promise wrapper pattern.

#### Implementation Details

```typescript
const handleLineWallet = async () => {
  const liffId = (import.meta as any).env.VITE_LINE_LIFF_ID;
  if (!liffId) {
    throw new Error('LINE LIFF ID not configured');
  }

  // Promise wrapper for liff.init() callback constraint
  return new Promise((resolve, reject) => {
    liff.init({ liffId }).then(() => {
      try {
        if (liff.isLoggedIn()) {
          const decodedToken = liff.getDecodedIDToken();
          if (decodedToken && decodedToken.sub) {
            resolve({
              provider: 'line',
              lineID: decodedToken.sub,
              displayName: decodedToken.name || '',
              pictureUrl: decodedToken.picture || '',
              email: decodedToken.email || ''
            });
          } else {
            reject(new Error('Unable to get LINE user data'));
          }
        } else {
          liff.login();
          reject(new Error('LINE login required'));
        }
      } catch (error) {
        reject(new Error('LINE authentication failed'));
      }
    }).catch((error) => {
      reject(new Error('LINE LIFF initialization failed'));
    });
  });
};
```

### Configuration

#### Environment Variables
```
VITE_LINE_LIFF_ID=2007331425-XoG4E8vm
```

#### Dependencies
```json
{
  "@line/liff": "^2.27.0"
}
```

### Integration Points

#### Switch Case Addition
```typescript
switch (provider) {
  case 'google':
    userData = await handleGoogleOAuth();
    break;
  case 'kaia':
    userData = await handleKaiaWallet();
    break;
  case 'okx':
    userData = await handleOkxWallet();
    break;
  case 'line':
    userData = await handleLineWallet();  // ✅ ADDED
    break;
  default:
    throw new Error('Unsupported provider');
}
```

#### Button Enablement
```tsx
<button 
  className="wallet-button line" 
  onClick={() => handleConnect('line')}  // ✅ ENABLED
  disabled={connectionState === 'connecting'}
>
  <div className="wallet-icon line-icon">💬</div>
  <span>Connect with LINE</span>
</button>
```

### Data Structure

#### LINE User Data Response
```typescript
{
  provider: 'line',
  lineID: string,          // decodedToken.sub
  displayName: string,     // decodedToken.name
  pictureUrl: string,      // decodedToken.picture
  email: string           // decodedToken.email
}
```

### Error Handling

#### Error Types
1. **Configuration Error**: Missing VITE_LINE_LIFF_ID
2. **Initialization Error**: LIFF initialization failed
3. **Authentication Error**: User not logged in, requires liff.login()
4. **Data Error**: Unable to extract user data from token

#### Error Flow
- Configuration errors thrown immediately
- Authentication errors trigger liff.login() redirect
- All errors propagated to modal error state with user-friendly messages

### Authentication Flow

1. **Button Click** → `handleConnect('line')`
2. **Switch Case** → `handleLineWallet()`
3. **Environment Check** → Validate VITE_LINE_LIFF_ID
4. **Promise Wrapper** → Wrap liff.init() callback
5. **LIFF Init** → Initialize LINE Front-end Framework
6. **Login Check** → Verify liff.isLoggedIn()
7. **Token Decode** → Extract user data from ID token
8. **Data Return** → Resolve with structured user data

### Reference Implementation

Based on dePick repository patterns:
- `/Users/behrens/dev/DePick/DePick.FE/src/utils/line/lineAuth.ts`
- `/Users/behrens/dev/DePick/DePick.FE/src/utils/line/lineDetection.ts`

### Status
✅ **IMPLEMENTED** - LINE login fully functional with Promise wrapper pattern

---

**Document Version**: 1.0  
**Created**: 2025-07-03  
**Status**: Complete