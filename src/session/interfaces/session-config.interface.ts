export interface SessionConfig {
  secret: string;
  resave: boolean;
  saveUninitialized: boolean;
  cookie: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite: 'lax' | 'strict' | 'none';
  };
  name: string;
  store?: any; // For custom session stores (e.g., Redis)
} 