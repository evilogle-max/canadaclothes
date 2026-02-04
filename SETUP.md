# Setup Guide - CanadaClothes.ca

Complete guide to set up the project locally and deploy to production.

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd <your-repo>
npm install

# 2. Create .env.local with your credentials
cp .env.example .env.local
# Edit .env.local and add your credentials

# 3. Run locally
npm run dev
# Visit http://localhost:3000
```

## Full Setup Guide

### Part 1: Prerequisites

**Accounts Needed** (all free tiers available):
- ✅ GitHub account
- ✅ Vercel account (free tier)
- ✅ Supabase account (free tier)
- ✅ Printify account (free, with API key)

**Software Required**:
- Node.js 18.x or later
- npm 9.x or later
- Git
- Terminal/Command Prompt

**Verify Installation**:
```bash
node --version      # Should be v18.x or higher
npm --version       # Should be 9.x or higher
git --version       # Should be 2.x or higher
```

### Part 2: Get Printify API Key

1. Go to [printify.com](https://printify.com)
2. Sign in or create account
3. Go to Dashboard → Settings → API
4. Generate API key (or use existing)
5. Go to Settings → General → Find Shop ID
6. Save both values (use them in `.env.local`)

### Part 3: Set Up Supabase

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in with GitHub (recommended)
3. Click "New project"
4. Enter:
   - **Organization**: Select or create
   - **Project name**: `canadaclothes` (or your choice)
   - **Database password**: Generate strong password
   - **Region**: Choose closest to you
5. Click "Create new project" and wait 2-5 minutes

#### Import Database Schema
1. After project creation, go to SQL Editor
2. Click "New query"
3. Paste entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Verify in Table Editor (should see 4 tables)

#### Get Credentials
1. Go to Settings → API
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`  
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Part 4: Configure Local Environment

1. In project root, create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in:
   ```bash
   # Supabase (from Part 3)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

   # Printify (from Part 2)
   PRINTIFY_API_KEY=your-api-key-here
   PRINTIFY_SHOP_ID=your-shop-id

   # Local development
   NODE_ENV=development
   ```

3. Save file (do NOT commit to Git)

### Part 5: Install Dependencies

```bash
npm install
```

This installs:
- Supabase client library
- Jest (testing)
- Playwright (E2E testing)
- ESLint (code quality)
- Prettier (formatting)
- And more...

### Part 6: Run Locally

```bash
npm run dev
```

Expected output:
```
> canadaclothes@1.0.0 dev
> node -e "..."

Server running at http://localhost:3000
```

Then:
1. Open browser to `http://localhost:3000`
2. Should see loading spinner → products grid
3. Try adding items to cart
4. Try checkout (preview mode)

### Part 7: Deploy to Vercel

#### Via Web Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Select your GitHub repository
5. Configure:
   - Framework Preset: `Other`
   - Build command: Leave blank
   - Install command: `npm ci`
   - Output directory: `public`
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Click link to visit production site

#### Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login with GitHub
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Set Environment Variables on Vercel

1. After deployment, go to Vercel project
2. Go to Settings → Environment Variables
3. Add same variables from `.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PRINTIFY_API_KEY`
   - `PRINTIFY_SHOP_ID`
   - `NODE_ENV=production`

4. Click "Save"
5. Re-deploy: Click "Deployments" → "..." on latest → "Redeploy"

### Part 8: Verify Production Deployment

Test your live site:

```bash
# Test config endpoint
curl https://your-domain.com/api/config

# Test products endpoint
curl https://your-domain.com/api/products

# Expected response: { "success": true, ... }
```

Visit your Vercel URL in browser:
- Should load products
- Should be able to add to cart
- Should be able to checkout (creates order in database)

## Running Tests

### Unit Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Watch Mode (while developing)
```bash
npm run test:watch
```

### E2E Tests (after starting dev server)
```bash
npm start &        # Start server
npm run test:e2e   # Run Playwright tests
```

## Code Quality

### Lint Code
```bash
npm run lint
```

### Fix Lint Issues
```bash
npm run lint:fix
```

### Format Code
```bash
npm run format
```

## Project Structure

```
.
├── api/                    # Vercel serverless functions
│   ├── products.js        # GET /api/products
│   ├── orders.js          # POST /api/orders
│   └── config.js          # GET /api/config
│
├── public/                # Static files
│   └── index.html         # Main SPA HTML
│
├── src/
│   ├── js/               # JavaScript modules
│   │   ├── app.js        # Main application class
│   │   ├── store.js      # State management
│   │   ├── api-client.js # HTTP requests
│   │   ├── checkout.js   # Checkout logic
│   │   └── utils.js      # Utilities
│   │
│   └── css/              # Stylesheets
│       ├── base.css      # Reset, variables, typography
│       ├── layout.css    # Header, main, footer
│       ├── components.css # Product grid, cart, buttons
│       └── animations.css # Loading, transitions
│
├── supabase/
│   └── migrations/       # Database migrations
│       └── 001_initial_schema.sql
│
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
│       ├── deploy.yml    # Auto-deploy on push
│       ├── test.yml      # Run tests on PR
│       └── security.yml  # Security scan
│
├── .env.example          # Environment variable template
├── .eslintrc.json        # ESLint config
├── .prettierrc            # Prettier config
├── jest.config.js        # Jest test config
├── package.json          # Dependencies
├── vercel.json           # Vercel deployment config
├── README.md             # Project documentation
├── SETUP.md              # This file
└── DEPLOYMENT.md         # Production deployment guide
```

## Troubleshooting

### npm install fails
```bash
# Try clearing cache
npm cache clean --force

# Remove lock file and reinstall
rm package-lock.json
npm install
```

### Local server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -an | findstr 3000  # Windows

# Kill process using port
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Try different port
PORT=3001 npm run dev
```

### Products not loading
1. Check `.env.local` has correct values
2. Verify Supabase URL is accessible
3. Check browser console for errors
4. Verify Printify API key is valid in Printify dashboard
5. Check Supabase SQL migrations ran successfully

### Deployment fails
1. Check GitHub Actions logs: Repo → Actions → Failed workflow
2. Verify all environment variables set in Vercel
3. Try redeploying: `vercel --prod`
4. Check Vercel logs: `vercel logs --follow`

### Tests failing
```bash
# Check what's failing
npm test -- --verbose

# Fix ESLint issues
npm run lint:fix

# Clear Jest cache
npm test -- --clearCache

# Run single test
npm test -- store.test.js
```

## Environment Variables Reference

| Variable | Required | Format | Example |
|----------|----------|--------|---------|
| `SUPABASE_URL` | Yes | URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | JWT Token | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (backend only) | JWT Token | `eyJhbGc...` |
| `PRINTIFY_API_KEY` | Yes | API Key | `Bearer xxx` |
| `PRINTIFY_SHOP_ID` | Yes | Integer | `12345` |
| `NODE_ENV` | No | `development\|production` | `production` |
| `VERCEL_URL` | Auto (Vercel) | URL | Auto-set by Vercel |

## Common Tasks

### Add New Environment Variable
1. Add to `.env.example` with description
2. Add to `.env.local` with your value
3. Add to Vercel project settings
4. Add to GitHub Secrets (for CI/CD)
5. Reference in code: `process.env.YOUR_VAR`

### Add New API Endpoint
1. Create file in `api/your-endpoint.js`
2. Export default handler function
3. Access via `/api/your-endpoint`
4. Example:
   ```javascript
   export default async function handler(req, res) {
     return res.json({ message: 'Hello' });
   }
   ```

### Deploy New Version
```bash
git add .
git commit -m "feat: your change"
git push origin main
# GitHub Actions auto-deploys to production
```

### Monitor Deployment
1. Go to Vercel project
2. Click "Deployments"
3. Click recent deployment to see:
   - Build logs
   - Function usage
   - Performance
   - Errors

## Getting Help

- **Project README**: [README.md](README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Printify Docs**: https://developers.printify.com

## Next Steps

1. ✅ Complete Setup.md
2. ✅ Deploy to Vercel
3. ⏭️ Add custom domain (Vercel settings)
4. ⏭️ Set up email notifications (SendGrid)
5. ⏭️ Integrate payment processor (Stripe)
6. ⏭️ Add product management dashboard
7. ⏭️ Set up analytics (Vercel + Supabase)

---

**Ready to launch?** Follow [DEPLOYMENT.md](DEPLOYMENT.md) for production best practices!
