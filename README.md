# MultiWallet - Component Testing Repository

A component testing repository for wallet connection functionality used in LINE mini dApps on the KAIA blockchain.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20+ (recommended) or 18+ (minimum)
- **npm**: Version 10+ 
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MultiWallet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm test
   npm run lint
   ```

## 🧪 Testing the UI

### Development Server

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001/wallet.html` (or next available port).

### Browser Testing

#### Prerequisites for Wallet Testing
To test wallet connections, you'll need:

1. **KAIA Wallet** (Kaikas)
   - Install [Kaikas browser extension](https://chrome.google.com/webstore/detail/kaikas/jblndlipeogpafnldhgmapagcccfchpi)
   - Create or import a KAIA wallet
   - Connect to KAIA Mainnet (Chain ID: 8217)

2. **OKX Wallet**
   - Install [OKX Wallet browser extension](https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge)
   - Create or import an OKX wallet
   - Ensure it's configured for Ethereum/KAIA networks

#### Testing the Modal

1. Navigate to the wallet section in the application
2. Click "Connect Wallet" to open the modal
3. Test each wallet option:
   - **KAIA Wallet**: Should detect Kaikas extension
   - **OKX Wallet**: Should detect OKX extension
   - **Google/LINE**: Social login functionality (if implemented)

#### Expected Behaviors

- ✅ **Wallet Detected**: Modal shows connection options
- ✅ **Wallet Not Detected**: Error message appears
- ✅ **Connection Success**: Modal closes, wallet connected
- ✅ **Connection Failed**: Error message with details
- ✅ **Network Switching**: Automatically switch to KAIA network

## 🏗️ Architecture

### Core Components

```
src/wallet/
├── types.ts              # TypeScript interfaces
├── WalletConnector.ts    # Core wallet connection logic
├── WalletModal.tsx       # React UI component
├── WalletModal.module.scss  # Component styling
└── WalletConnector.test.ts  # Unit tests
```

### Supported Wallets

| Wallet | Status | Protocol |
|--------|--------|----------|
| KAIA Wallet (Kaikas) | ✅ Ready | KAIA ethers extension |
| OKX Wallet | ✅ Ready | Standard Web3 |
| Google OAuth | 🔄 Existing | Social login |
| LINE Login | 🔄 Existing | Social login |
| Bitget Wallet | ⏳ Planned | Phase 2 |

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm test WalletConnector   # Run specific test
```

### Linting
```bash
npm run lint               # Check code style
```

### Build
```bash
npm run build              # TypeScript compilation
```

## 🔧 Configuration

### Environment Variables

Create `.env` file (if needed):
```env
# Example configuration
NODE_ENV=development
```

### Network Configuration

The app is configured for:
- **KAIA Mainnet**: Chain ID 8217
- **KAIA Testnet**: Chain ID 1001 (for development)

## 🎯 Development Strategy

This repository follows a **depth-first implementation** approach:

1. ✅ **Phase 1**: KAIA + OKX wallet integration (complete)
2. ⏳ **Phase 2**: Add Bitget wallet support
3. ⏳ **Phase 3**: Enhanced error handling and UX

## 📝 Key Features

- **Silverlynx Normal Form (SNF)**: Minimal, complete implementation
- **Adapter Pattern**: Single interface for multiple wallets
- **Error Handling**: Comprehensive error states and messages
- **TypeScript**: Full type safety
- **Responsive Design**: Mobile-friendly UI
- **Test Coverage**: Unit tests for core functionality

## 🔍 Debugging

### Common Issues

1. **"Wallet not detected"**
   - Ensure browser extension is installed and enabled
   - Refresh the page and try again

2. **"Connection failed"**
   - Check wallet is unlocked
   - Verify network settings
   - Check browser console for detailed errors

3. **Node version warnings**
   - NestJS v11 requires Node 20+
   - Install latest Node.js for best compatibility

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

Check browser console for wallet connection logs.

## 🤝 Contributing

1. Follow existing code patterns
2. Run tests before committing: `npm test`
3. Ensure linting passes: `npm run lint`
4. Write tests for new wallet integrations

## 📚 Documentation

- [KAIA Developer Docs](https://docs.kaia.io/)
- [OKX Wallet SDK](https://www.okx.com/web3/build/docs/waas)
- [Depth-First Strategy](./DepthFirst.WalletConnect.OKX-KAIA.md)

---

**Status**: Phase 1 Complete - Ready for browser testing
**Last Updated**: 2025-06-29