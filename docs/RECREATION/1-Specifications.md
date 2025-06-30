# MultiWallet Recreation Specifications

## Project Overview
Create a clean, React-based wallet authentication modal that supports Google OAuth, KAIA wallet (Kaikas), and OKX wallet connections, designed for seamless integration into the dePick repository.

## Functional Requirements

### 1. Authentication Methods
- **Google OAuth**: Client-side authentication using @react-oauth/google library
- **KAIA Wallet**: Browser extension detection and connection via Kaikas
- **OKX Wallet**: Browser extension detection and connection via OKX Wallet
- **LINE Login**: Placeholder (disabled) for future implementation

### 2. User Interface Requirements
- **Modal Design**: Exact replication of LINE.MultiWallet.png design
- **Logo Section**: Green circular logo with briefcase icon, "Mini Dapp" title
- **Provider Buttons**: Four authentication provider buttons with distinct styling
- **Loading States**: Spinner animation during connection attempts
- **Error Handling**: Clear error messages with styled error sections
- **Responsive Design**: Mobile and desktop compatibility

### 3. Technical Requirements
- **Framework**: React 19+ with TypeScript
- **Build Tool**: Vite 6+ for development and building
- **Port Configuration**: Development server on port 5173 (matches Google Cloud config)
- **Environment Variables**: VITE_GOOGLE_CLIENT_ID for Google authentication
- **Browser Compatibility**: Modern browsers with wallet extension support

### 4. Integration Requirements
- **dePick Compatibility**: Components must be portable to dePick repository
- **State Management**: Clean state handling compatible with dePick's useAuth patterns
- **API Format**: User data format matching dePick's authentication flows
- **No Server Dependencies**: Pure client-side authentication flows

## Success Criteria

### 1. Authentication Flow Success
- ✅ Google OAuth opens popup, authenticates, returns user data (email, name, picture)
- ✅ KAIA wallet detects Kaikas extension, connects, returns wallet address
- ✅ OKX wallet detects OKX extension, connects, returns wallet address
- ✅ Error states display clear messages for missing extensions or failed connections

### 2. User Experience Success
- ✅ Modal opens smoothly with proper overlay
- ✅ Authentication completes without page redirects
- ✅ Loading states provide immediate feedback
- ✅ Modal closes automatically on successful authentication

### 3. Technical Success
- ✅ No CSP (Content Security Policy) violations
- ✅ TypeScript compilation with strict mode
- ✅ Clean component architecture for easy porting
- ✅ Development server runs on port 5173 without configuration issues

## Environment Configuration

### Required Environment Variables
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Google Cloud Console Setup
- **Authorized JavaScript Origins**: `http://localhost:5173`
- **Application Type**: Web application
- **No callback URLs required** (client-side flow)

### Browser Extension Requirements
- **Kaikas**: Chrome/Edge extension for KAIA wallet functionality
- **OKX Wallet**: Chrome/Edge extension for OKX wallet functionality

## Design Specifications

### Modal Dimensions
- **Width**: 380px (max-width: 90vw for mobile)
- **Border Radius**: 16px
- **Background**: White with subtle shadow
- **Animation**: Slide-in effect from top

### Logo Section
- **Logo Circle**: 64px diameter, green gradient background
- **Logo Icon**: Briefcase emoji (💼), 24px, white color
- **Title**: "Mini Dapp", 24px, weight 600
- **Subtitle**: "Connect your wallet", 16px, gray color

### Provider Buttons
- **Layout**: Stacked vertically with 12px gap
- **Padding**: 16px horizontal, 20px vertical
- **Border**: 1px solid #e0e0e0, hover state with green accent
- **Icons**: 24px square with rounded corners, provider-specific colors
- **Typography**: 16px, weight 500

### State Indicators
- **Loading**: 32px spinner with green accent, centered
- **Error**: Red background box with white text, rounded corners
- **Success**: Automatic modal close with parent component update

## Browser Support
- **Chrome/Chromium**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Security Considerations
- **Client-Side Only**: No server-side secrets or tokens
- **Token Handling**: Temporary access tokens only, no persistent storage
- **Extension Communication**: Standard Web3 provider APIs only
- **CORS**: No cross-origin restrictions with current architecture