# Wallet Management System

A secure wallet management system built with NestJS and ethers.js.

## Features

- Secure wallet creation and management
- Private key encryption
- Transaction signing
- Balance checking
- User management

## Prerequisites

- Node.js (v14 or later)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wallet-management
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your own:
     - Generate secure encryption keys
     - Add your Infura project ID or other RPC URL

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Wallet Endpoints

- `POST /wallet/create` - Create a new wallet
- `POST /wallet/sign` - Sign a transaction
- `GET /wallet/balance/:address` - Get wallet balance

### User Endpoints

- `POST /user/create` - Create a new user
- `GET /user/:id` - Get user details
- `GET /user/:id/balance` - Get user's wallet balance

## Security Considerations

- Private keys are encrypted using AES-256-CBC
- Encryption keys are stored in environment variables
- In production, use a secure key management service
- Implement proper authentication and authorization
- Use HTTPS in production

## Development

- Run tests: `npm test`
- Lint code: `npm run lint`
- Build: `npm run build`

## License

MIT 