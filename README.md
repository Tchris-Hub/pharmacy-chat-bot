# Pharmacy AI Chatbot Backend

A production-ready Node.js backend for a pharmacy AI chatbot with secure admin authentication, medicine/FAQ management, and read-only AI endpoints.

## Features

### Security
- 🔒 **JWT Authentication** - Access tokens (15 min) + refresh tokens (7 days)
- 🛡️ **Token Blacklisting** - Secure logout with refresh token revocation
- 🔐 **Password Hashing** - bcrypt with salt rounds
- 🚦 **Rate Limiting** - 100 requests per 15 minutes per IP
- 🌐 **CORS Protection** - Configurable allowed origins
- 🎯 **Helmet Security Headers** - XSS, clickjacking, and other protections
- ✅ **Input Validation** - Zod schemas for all endpoints
- 💉 **SQL Injection Protection** - Parameterized queries via Supabase

### Admin Endpoints (Protected)
- **Medicine Management**: Full CRUD operations with pagination
- **FAQ Management**: Full CRUD operations with pagination
- All endpoints require JWT authentication

### AI Endpoints (Public)
- **Get FAQs**: Retrieve all FAQs for AI knowledge base
- **Get Medicines**: Retrieve all medicines with stock info
- **Check Stock**: Check specific medicine stock status
- No authentication required (read-only)

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# JWT Configuration
# Generate secrets using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your-access-token-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration file: `migrations/001_create_tables.sql`

### 3. Create Admin User

Generate a bcrypt hash for your password:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(hash => console.log(hash));"
```

Edit `migrations/002_create_admin_user.sql` and replace `BCRYPT_HASH_HERE` with the generated hash, then run it in Supabase SQL Editor.

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Server

```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login with admin credentials.

**Request:**
```json
{
  "email": "admin@pharmacy.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "admin": {
      "id": "uuid",
      "email": "admin@pharmacy.com",
      "fullName": "Admin User"
    }
  }
}
```

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

#### POST `/api/auth/logout`
Logout and revoke refresh token (requires authentication).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Admin Endpoints (Require Authentication)

All admin endpoints require the `Authorization: Bearer <access-token>` header.

#### Medicine Management

**GET** `/api/admin/medicines?page=1&limit=50` - List medicines  
**POST** `/api/admin/medicines` - Create medicine  
**PUT** `/api/admin/medicines/:id` - Update medicine  
**DELETE** `/api/admin/medicines/:id` - Delete medicine

**Create/Update Medicine Schema:**
```json
{
  "name": "Aspirin",
  "description": "Pain reliever",
  "stock_quantity": 100,
  "price": 5.99,
  "category": "Pain Relief",
  "requires_prescription": false
}
```

#### FAQ Management

**GET** `/api/admin/faqs?page=1&limit=50` - List FAQs  
**POST** `/api/admin/faqs` - Create FAQ  
**PUT** `/api/admin/faqs/:id` - Update FAQ  
**DELETE** `/api/admin/faqs/:id` - Delete FAQ

**Create/Update FAQ Schema:**
```json
{
  "question": "What are your opening hours?",
  "answer": "We are open Monday-Friday 9am-6pm",
  "category": "General",
  "priority": 1
}
```

### AI Endpoints (Public, No Authentication)

**GET** `/api/ai/faqs` - Get all FAQs  
**GET** `/api/ai/medicines` - Get all medicines  
**GET** `/api/ai/medicines/:id/stock` - Check medicine stock status

**Stock Status Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Aspirin",
    "stock_quantity": 100,
    "status": "in_stock"  // or "low_stock" or "out_of_stock"
  }
}
```

## Project Structure

```
AI-BOTPHARMACY/
├── migrations/
│   ├── 001_create_tables.sql      # Database schema
│   └── 002_create_admin_user.sql  # Admin user creation
├── src/
│   ├── config/
│   │   └── supabase.js            # Supabase client
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   ├── validate.js            # Zod validation
│   │   └── errorHandler.js        # Global error handler
│   ├── routes/
│   │   ├── auth.js                # Auth endpoints
│   │   ├── admin.js               # Admin endpoints
│   │   └── ai.js                  # AI endpoints
│   ├── utils/
│   │   └── jwt.js                 # JWT utilities
│   └── server.js                  # Main Express app
├── .env.example                   # Environment template
├── package.json
└── README.md
```

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive secrets
2. **Use strong JWT secrets** - Generate with crypto.randomBytes(64)
3. **Rotate secrets regularly** - Update JWT secrets periodically
4. **Use HTTPS in production** - Never send tokens over HTTP
5. **Set appropriate CORS origins** - Only allow trusted domains
6. **Monitor rate limits** - Adjust based on your needs
7. **Regular security audits** - Keep dependencies updated

## Development

```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2
3. Set up HTTPS with a reverse proxy (nginx)
4. Configure proper CORS origins
5. Set up database backups
6. Monitor logs and errors

## License

ISC
