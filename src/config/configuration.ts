export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' as const,
    },
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  blockchain: {
    amoyRpcUrl: process.env.AMOY_RPC_URL,
    polygonRpcUrl: process.env.POLYGON_RPC_URL,
  },
  environment: process.env.NODE_ENV || 'development',
}); 