# FairShare Setup Guide

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/fairshare"

# JWT Secret for Magic Links (use a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"

# Application URL (used for generating magic links)
APP_URL="http://localhost:3000"

# Optional: Deployment specific
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="another-secret-for-nextauth"
```

## Database Setup

### Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE fairshare;
   CREATE USER fairshare_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE fairshare TO fairshare_user;
   ```
3. Update your `DATABASE_URL` accordingly

### Using Supabase (Recommended for production)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string and use it as `DATABASE_URL`

### Using Railway

1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the connection string from the service variables

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Initialize database:**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Production Deployment

### Vercel + Supabase

1. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables in Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add all the variables from your `.env` file

3. **Run database migrations:**
   ```bash
   npm run db:deploy
   ```

### Docker Deployment

1. **Build Docker image:**
   ```bash
   docker build -t fairshare .
   ```

2. **Run with environment variables:**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="your_database_url" \
     -e JWT_SECRET="your_jwt_secret" \
     -e APP_URL="https://your-domain.com" \
     fairshare
   ```

## Security Notes

- **JWT_SECRET**: Must be at least 32 characters long and cryptographically secure
- **DATABASE_URL**: Never commit this to version control
- **APP_URL**: Must match your actual domain in production for magic links to work
- Use HTTPS in production for secure cookie transmission

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists and user has permissions

2. **Prisma errors:**
   - Run `npm run db:generate` after schema changes
   - Run `npm run db:migrate` to apply migrations

3. **Magic links not working:**
   - Verify APP_URL matches your actual domain
   - Check JWT_SECRET is set correctly
   - Ensure tokens haven't expired (30 days by default)

4. **Build errors:**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Run `npm run db:generate` before building

### Database Management

- **View data:** `npm run db:studio`
- **Reset database:** `npm run db:reset`
- **Create migration:** `npx prisma migrate dev --name your_migration_name`

## Performance Optimization

### Database

- Add indexes for frequently queried fields
- Use connection pooling in production
- Consider read replicas for high traffic

### Frontend

- Enable Next.js caching
- Use CDN for static assets
- Implement proper loading states

### Monitoring

- Set up error tracking (Sentry)
- Monitor database performance
- Track user engagement metrics
