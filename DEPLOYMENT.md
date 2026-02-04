# Deployment Guide - CanadaClothes.ca

Complete production deployment guide for Vercel + Supabase + Printify.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Vercel Setup](#vercel-setup)
4. [Environment Configuration](#environment-configuration)
5. [GitHub Integration](#github-integration)
6. [Testing Deployment](#testing-deployment)
7. [Production Monitoring](#production-monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- GitHub account with this repo
- Vercel account (free tier OK)
- Supabase account (free tier OK for development)
- Printify account with API key and Shop ID
- Node.js 18.x or later
- npm 9.x or later

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Create a new project:
   - Name: `canadaclothes`
   - Database password: Generate strong password
   - Region: `us-east-1` (closest to your users)
4. Wait for project initialization (2-5 minutes)

### 2. Run SQL Migrations

1. Go to project → SQL Editor
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into SQL editor
5. Click "Run"
6. Verify tables are created in "Table Editor"

Expected tables:
- `orders` (with order_number sequence)
- `order_items`
- `products`
- `product_cache`

### 3. Get Credentials

1. Go to project → Settings → API
2. Copy and save:
   - **Project URL**: Used as `SUPABASE_URL`
   - **anon public key**: Used as `SUPABASE_ANON_KEY`
   - **service_role secret key**: Used as `SUPABASE_SERVICE_ROLE_KEY`

### 4. Enable Realtime (Optional)

For future order tracking features:
1. Go to project → Database → Replication
2. Enable Realtime for `orders` table

## Vercel Setup

### 1. Create Vercel Project

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Select this GitHub repository
5. Project settings:
   - Framework: `Other` (vanilla JS)
   - Build Command: `npm run build` (if needed)
   - Output Directory: `public`
   - Install Command: `npm ci`
6. Click "Deploy"

#### Option B: Via CLI

```bash
npm install -g vercel
vercel login
vercel
```

### 2. Configure Environment Variables

1. Go to Vercel project → Settings → Environment Variables
2. Add production variables (one by one):

   | Variable | Value | Source |
   |----------|-------|--------|
   | `SUPABASE_URL` | From Supabase API settings | Your Supabase project |
   | `SUPABASE_ANON_KEY` | From Supabase API settings | Your Supabase project |
   | `SUPABASE_SERVICE_ROLE_KEY` | From Supabase API settings | Your Supabase project |
   | `PRINTIFY_API_KEY` | Your API key | Printify Dashboard → API |
   | `PRINTIFY_SHOP_ID` | Your Shop ID | Printify Dashboard → Settings |
   | `NODE_ENV` | `production` | Static value |
   | `VERCEL_ORG_ID` | From `vercel.json` | Your Vercel org |
   | `VERCEL_PROJECT_ID` | From `vercel.json` | Your Vercel project |

3. Select "Production" for all environment variables
4. Click "Save"

### 3. Get Vercel IDs

After first deployment:

1. Run `vercel` in project directory
2. Save the `Org ID` and `Project ID` from `.vercel/project.json`
3. Update GitHub Secrets with these values

## Environment Configuration

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all values:
   ```bash
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   PRINTIFY_API_KEY=your-api-key
   PRINTIFY_SHOP_ID=your-shop-id
   NODE_ENV=development
   ```

3. Install dependencies and test:
   ```bash
   npm install
   npm run dev
   # Visit http://localhost:3000
   ```

### Production (Vercel)

Environment variables are configured in Vercel dashboard (see section above).

Verify with:
```bash
vercel env ls
```

## GitHub Integration

### 1. Add GitHub Secrets

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add these secrets:

   | Secret | Value |
   |--------|-------|
   | `VERCEL_TOKEN` | From Vercel Settings → Tokens → Create Token |
   | `VERCEL_ORG_ID` | From Vercel project → `.vercel/project.json` |
   | `VERCEL_PROJECT_ID` | From Vercel project → `.vercel/project.json` |
   | `SNYK_TOKEN` | From snyk.io (optional for security) |
   | `SUPABASE_URL` | Your Supabase URL |
   | `SUPABASE_ANON_KEY` | Your anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
   | `PRINTIFY_API_KEY` | Your Printify API key |
   | `PRINTIFY_SHOP_ID` | Your Printify Shop ID |

### 2. Get Vercel Token

1. Go to vercel.com → Settings → Tokens
2. Create new token → Copy value
3. Add to GitHub as `VERCEL_TOKEN` secret

### 3. Enable GitHub Actions

1. Go to repo → Actions → Enable Actions
2. Workflows should auto-run on:
   - Push to `main` → Deploy to production
   - Push to `develop` → Deploy to preview
   - Pull request → Run tests
   - Weekly → Run security scan

## Testing Deployment

### 1. Test Preview Deployment

1. Create new branch: `git checkout -b test-deployment`
2. Make a small change (e.g., update README)
3. Push: `git push -u origin test-deployment`
4. Create Pull Request
5. Wait for GitHub Actions to complete
6. Vercel creates Preview URL in PR comments
7. Test preview deployment
8. Merge PR if satisfied

### 2. Deploy to Production

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Make changes and commit
git add .
git commit -m "feat: new feature"

# Push to main (triggers auto-deploy)
git push origin main

# Monitor deployment
# Option A: Vercel dashboard
# Option B: GitHub Actions → Workflows → Deploy
```

### 3. Verify Production Deployment

```bash
curl https://your-domain.com/api/config
# Should return:
# {
#   "success": true,
#   "config": {
#     "supabase": { ... },
#     "environment": "production",
#     "version": "1.0.0"
#   }
# }

curl https://your-domain.com/api/products
# Should return products from Printify
```

### 4. Monitor Production

- **Vercel Dashboard**: Deployments, analytics, logs
- **Supabase Dashboard**: Database, API usage
- **Printify Dashboard**: Product syncs, errors

## Production Monitoring

### 1. Set Up Alerts

#### Vercel Alerts
1. Go to project → Settings → Alerts
2. Enable:
   - Deployment failures
   - Production errors

#### Supabase Alerts
1. Go to project → Settings → Email
2. Enable notifications for:
   - High database usage
   - Connection limit warnings

### 2. Monitor Logs

```bash
# View Vercel logs
vercel logs

# View real-time logs
vercel logs --follow
```

### 3. Check Health

Create a monitoring dashboard:
```bash
# Test API endpoints
watch -n 60 'curl -s https://your-domain.com/api/products | jq ".success"'
```

### 4. Database Monitoring

In Supabase dashboard:
- Monitor `orders` table row count
- Check `product_cache` update frequency
- Review error logs

## Troubleshooting

### Issue: "Supabase URL not found"

**Problem**: API returns error about missing Supabase URL

**Solution**:
1. Verify environment variable is set: `vercel env ls`
2. Re-run deployment: `vercel --prod`
3. Check Vercel logs: `vercel logs`

### Issue: Products not loading

**Problem**: `/api/products` returns error

**Causes & Solutions**:
1. **Printify credentials missing**
   - Check Vercel env vars have `PRINTIFY_API_KEY` and `PRINTIFY_SHOP_ID`
   - Verify keys are correct in Printify dashboard

2. **Supabase cache table missing**
   - Run migrations: Copy SQL from `supabase/migrations/001_initial_schema.sql`
   - Paste into Supabase SQL editor and run

3. **Network issues**
   - Check Vercel function logs: `vercel logs` → filter for `/api/products`
   - Verify Printify API is accessible

### Issue: Orders not saving

**Problem**: Checkout fails, no order created

**Causes & Solutions**:
1. **Supabase connection issue**
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel env vars
   - Test Supabase connection: Supabase dashboard → SQL Editor → Run test query

2. **RLS policies blocking inserts**
   - Check Supabase table policies
   - Ensure `INSERT` policy exists for `orders` and `order_items` tables

3. **Email validation failing**
   - Verify email format: must contain `@` and `.`
   - Check browser console for validation errors

### Issue: Deployment stuck or failing

**Problem**: GitHub Actions shows deployment failed

**Solution**:
1. Check GitHub Actions logs: Go to repo → Actions → Select failed workflow
2. Common causes:
   - Missing secrets: Add all required env vars to GitHub Secrets
   - npm ci failure: Delete `package-lock.json`, run `npm install`, commit
   - ESLint errors: Run `npm run lint` locally to fix

3. Manual redeploy:
   ```bash
   vercel --prod --token $VERCEL_TOKEN
   ```

### Issue: Products showing old data

**Problem**: Product changes in Printify not reflected

**Solution**:
1. Cache expires after 1 hour
2. To force refresh: Delete row in `product_cache` table in Supabase
3. Next API call will fetch fresh from Printify

## Next Steps

1. **Custom Domain**: Add custom domain in Vercel → Project → Domains
2. **SSL/TLS**: Auto-provisioned by Vercel (free)
3. **Analytics**: Enable in Vercel → Project → Analytics
4. **Payments**: Integrate Stripe for real payments
5. **Email Confirmations**: Add SendGrid for order emails
6. **Monitoring**: Set up LogRocket or Sentry for errors

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Printify Docs**: https://developers.printify.com
- **GitHub Actions**: https://docs.github.com/en/actions
