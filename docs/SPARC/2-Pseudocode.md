# SPARC Framework - Pseudocode

## Core Wallet Connector Logic

### Main WalletConnector Class

```
CLASS WalletConnector:
  PRIVATE currentConnection = null
  PRIVATE state = DISCONNECTED

  METHOD connect(provider: WalletProvider):
    SET state = CONNECTING
    CLEAR any previous errors
    
    TRY:
      SWITCH provider:
        CASE 'kaia':
          RETURN AWAIT connectKaia()
        CASE 'okx':
          RETURN AWAIT connectOkx()
        CASE 'google':
          THROW "Social login not implemented in wallet connector"
        CASE 'line':
          THROW "Social login not implemented in wallet connector"
        DEFAULT:
          THROW "Unsupported provider: " + provider
    CATCH error:
      SET state = ERROR
      RETURN { success: false, error: error.message }

  METHOD connectKaia():
    // Check wallet availability
    IF typeof window === 'undefined' OR window.klaytn is undefined:
      THROW "KAIA wallet not available. Please install Kaikas extension."
    
    // Request account access
    accounts = AWAIT window.klaytn.enable()
    IF accounts is empty OR accounts.length === 0:
      THROW "No KAIA accounts found. Please create a wallet or unlock existing one."
    
    // Create provider and signer
    provider = NEW kaiaV6.providers.Web3Provider(window.klaytn)
    network = AWAIT provider.getNetwork()
    signer = provider.getSigner()
    
    // Create account object
    account = {
      address: accounts[0],
      chainId: Number(network.chainId),
      provider: 'kaia'
    }
    
    // Create connection object
    connection = {
      account: account,
      isConnected: true,
      signer: signer
    }
    
    SET currentConnection = connection
    SET state = CONNECTED
    RETURN { success: true, connection: connection }

  METHOD connectOkx():
    // Check wallet availability
    IF typeof window === 'undefined' OR window.okxwallet is undefined:
      THROW "OKX wallet not available. Please install OKX Wallet extension."
    
    // Request account access
    accounts = AWAIT window.okxwallet.request({
      method: 'eth_requestAccounts'
    })
    
    IF accounts is empty OR accounts.length === 0:
      THROW "No OKX accounts found. Please create a wallet or unlock existing one."
    
    // Get chain ID
    chainId = AWAIT window.okxwallet.request({
      method: 'eth_chainId'
    })
    
    // Create provider and signer
    provider = NEW kaiaV6.providers.Web3Provider(window.okxwallet)
    signer = provider.getSigner()
    
    // Create account object
    account = {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      provider: 'okx'
    }
    
    // Create connection object
    connection = {
      account: account,
      isConnected: true,
      signer: signer
    }
    
    SET currentConnection = connection
    SET state = CONNECTED
    RETURN { success: true, connection: connection }

  METHOD disconnect():
    SET currentConnection = null
    SET state = DISCONNECTED
    EMIT connection state change event

  METHOD getConnection():
    RETURN currentConnection

  METHOD getState():
    RETURN state

  METHOD switchToKaia():
    IF currentConnection is null:
      RETURN false
    
    TRY:
      provider = currentConnection.signer.provider
      IF provider is null:
        RETURN false
      
      // Attempt to switch to KAIA mainnet
      AWAIT provider.send('wallet_switchEthereumChain', [
        { chainId: '0x2019' }  // KAIA mainnet = 8217 = 0x2019
      ])
      
      // Update connection chain ID
      currentConnection.account.chainId = 8217
      RETURN true
      
    CATCH error:
      // If network doesn't exist, add it first
      TRY:
        AWAIT addKaiaNetwork()
        // Retry switch after adding
        RETURN AWAIT switchToKaia()
      CATCH addError:
        RETURN false

  PRIVATE METHOD addKaiaNetwork():
    provider = currentConnection.signer.provider
    IF provider is null:
      THROW "No provider available"
    
    AWAIT provider.send('wallet_addEthereumChain', [{
      chainId: '0x2019',
      chainName: 'KAIA Mainnet',
      nativeCurrency: {
        name: 'KAIA',
        symbol: 'KAIA',
        decimals: 18
      },
      rpcUrls: ['https://public-en-cypress.klaytn.net'],
      blockExplorerUrls: ['https://scope.klaytn.com/']
    }])
```

## Modal UI Component Logic

### WalletModal React Component

```
COMPONENT WalletModal(props: WalletModalProps):
  // Props: isOpen, onClose, onConnect
  
  STATE connectionState = ConnectionState.DISCONNECTED
  STATE error = ""

  // Early return if modal not open
  IF NOT props.isOpen:
    RETURN null

  METHOD handleConnect(provider: WalletProvider):
    SET connectionState = ConnectionState.CONNECTING
    SET error = ""
    
    TRY:
      result = AWAIT props.onConnect(provider)
      
      IF result.success:
        SET connectionState = ConnectionState.CONNECTED
        // Auto-close modal on successful connection
        CALL props.onClose()
      ELSE:
        SET connectionState = ConnectionState.ERROR
        SET error = result.error OR 'Connection failed'
        
    CATCH exception:
      SET connectionState = ConnectionState.ERROR
      SET error = exception.message OR 'Unknown error occurred'

  COMPUTE isConnecting = connectionState === ConnectionState.CONNECTING

  RENDER:
    <div className="wallet-modal-overlay">
      <div className="wallet-modal">
        
        <!-- Header with close button -->
        <div className="wallet-modal-header">
          <button onClick={props.onClose}>✕</button>
        </div>

        <div className="wallet-modal-content">
          
          <!-- Logo and title section -->
          <div className="logo-section">
            <div className="logo-circle">
              <div className="logo-icon">💼</div>
            </div>
            <h2>Mini Dapp</h2>
            <p>Connect your wallet</p>
          </div>

          <!-- Wallet connection options -->
          <div className="wallet-options">
            
            <!-- Google button (placeholder) -->
            <button 
              className="wallet-button google"
              disabled={isConnecting}
              onClick={() => handleConnect('google')}
            >
              <div className="wallet-icon google-icon">G</div>
              <span>Connect with Google</span>
            </button>

            <!-- LINE button (placeholder) -->
            <button 
              className="wallet-button line"
              disabled={isConnecting}
              onClick={() => handleConnect('line')}
            >
              <div className="wallet-icon line-icon">💬</div>
              <span>Connect with LINE</span>
            </button>

            <!-- KAIA wallet button (active) -->
            <button 
              className="wallet-button kaia"
              disabled={isConnecting}
              onClick={() => handleConnect('kaia')}
            >
              <div className="wallet-icon kaia-icon">🔗</div>
              <span>Connect with KAIA Wallet</span>
            </button>

            <!-- OKX wallet button (active) -->
            <button 
              className="wallet-button okx"
              disabled={isConnecting}
              onClick={() => handleConnect('okx')}
            >
              <div className="wallet-icon okx-icon">⚡</div>
              <span>Connect with OKX Wallet</span>
            </button>
          </div>

          <!-- Loading state -->
          IF connectionState === ConnectionState.CONNECTING:
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Connecting...</p>
            </div>

          <!-- Error state -->
          IF error exists:
            <div className="error-section">
              <p className="error-message">{error}</p>
            </div>

        </div>
      </div>
    </div>
```

## Type System Logic

### Core Type Definitions

```
TYPE WalletProvider = 'kaia' | 'okx' | 'google' | 'line'

INTERFACE WalletAccount:
  address: string          // Wallet address (0x...)
  chainId: number         // Network chain ID
  provider: WalletProvider // Which wallet provider

INTERFACE WalletConnection:
  account: WalletAccount  // Account information
  isConnected: boolean    // Connection status
  signer?: any           // Ethers signer instance (optional)

INTERFACE WalletConnectionResult:
  success: boolean        // Whether connection succeeded
  connection?: WalletConnection  // Connection data (if successful)
  error?: string         // Error message (if failed)

ENUM ConnectionState:
  DISCONNECTED = 'disconnected'
  CONNECTING = 'connecting'
  CONNECTED = 'connected'
  ERROR = 'error'

INTERFACE WalletModalProps:
  isOpen: boolean        // Whether modal is visible
  onClose: () => void    // Close modal callback
  onConnect: (provider: WalletProvider) => Promise<WalletConnectionResult>
```

## Extension Pattern for Future Wallets

### Adding New Wallet (e.g., Bitget)

```
METHOD connectBitget():
  // Check wallet availability
  IF typeof window === 'undefined' OR window.bitkeep is undefined:
    THROW "Bitget wallet not available. Please install Bitget Wallet extension."
  
  // Request account access
  accounts = AWAIT window.bitkeep.request({
    method: 'eth_requestAccounts'
  })
  
  IF accounts is empty:
    THROW "No Bitget accounts found."
  
  // Follow same pattern as OKX...
  // Create provider, get chainId, create account object
  // Return same WalletConnectionResult interface
  
  RETURN { success: true, connection: connection }

// Add to main connect method:
CASE 'bitget':
  RETURN AWAIT connectBitget()

// Add to modal UI:
<button onClick={() => handleConnect('bitget')}>
  Connect with Bitget Wallet
</button>

// Update type definition:
TYPE WalletProvider = 'kaia' | 'okx' | 'bitget' | 'google' | 'line'
```

---

**Document Version**: 1.0  
**Created**: 2025-06-29  
**Implementation Status**: Core logic implemented and tested