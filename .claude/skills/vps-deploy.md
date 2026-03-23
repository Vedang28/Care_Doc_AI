---
name: vps-deploy
description: Deploy to any platform — VPS (SSH + PM2), Vercel, Railway, Fly.io, or Render. Asks for platform if not set in CLAUDE.md. Includes rollback plan for every deployment.
---

# VPS Deploy Skill — Multi-Platform Deployment

**First: check CLAUDE.md for deployment platform.**
If not set → ask the user before proceeding. Never assume.

---

## Step 0: Determine Platform

Read `CLAUDE.md` → `Deployment Target` field.

If blank or "not configured": ask:
```
Which platform are you deploying to?
  A) VPS (SSH + PM2)
  B) Vercel
  C) Railway
  D) Fly.io
  E) Render
  F) Docker (custom)

Enter A–F:
```

---

## Platform A: VPS (SSH + PM2)

### Setup (First Time)

```bash
# 1. Generate a dedicated deploy SSH key (do NOT use personal key)
ssh-keygen -t ed25519 -C "github-deploy-[project]" -f ~/.ssh/deploy_[project] -N ""

# 2. Add public key to VPS
ssh-copy-id -i ~/.ssh/deploy_[project].pub [VPS_USER]@[VPS_IP]

# 3. Add private key to GitHub Secrets
# Key name: VPS_SSH_KEY
# Value: cat ~/.ssh/deploy_[project]

# 4. Set remaining GitHub Secrets:
# VPS_HOST = [VPS_IP]
# VPS_USER = [VPS_USER]
# VPS_APP_PATH = [VPS_APP_PATH]
# PM2_PROCESS = [PM2_PROCESS_NAME]

# 5. Set up GitHub Actions workflow — see devops-engineer agent
```

### Pre-Deploy Checklist

```bash
# Note rollback hash BEFORE deploying
echo "Rollback hash if needed: $(git rev-parse HEAD)"

# Verify VPS is reachable
nc -z -w 5 $VPS_IP 22 && echo "✅ SSH reachable" || echo "❌ VPS unreachable"
```

### Deploy

```bash
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
  set -e
  cd $VPS_APP_PATH

  echo "=== Pull latest ==="
  git fetch origin main
  git reset --hard origin/main

  echo "=== Install dependencies ==="
  npm install --production --silent

  echo "=== Run migrations ==="
  npx prisma migrate deploy

  echo "=== Restart ==="
  pm2 restart $PM2_PROCESS
  pm2 save

  echo "✅ Deploy complete"
ENDSSH
```

### Verify Live

```bash
sleep 10
curl -s --max-time 10 http://$VPS_IP:$PORT/api/v1/health
[ $? -eq 0 ] && echo "✅ Live health check passed" || echo "❌ Health check FAILED"

# Always check PM2 logs even if health passes
ssh $VPS_USER@$VPS_IP "pm2 logs $PM2_PROCESS --lines 20 --nostream"
```

### Rollback (VPS)

```bash
# Emergency rollback to previous commit
ROLLBACK_HASH=[PASTE FROM ADR.md]

ssh $VPS_USER@$VPS_IP << ENDSSH
  cd $VPS_APP_PATH
  git reset --hard $ROLLBACK_HASH
  npm install --production --silent
  npx prisma migrate deploy
  pm2 restart $PM2_PROCESS
  echo "✅ Rolled back to $ROLLBACK_HASH"
ENDSSH
```

---

## Platform B: Vercel

```bash
# Install Vercel CLI (once)
npm i -g vercel

# Link project (once)
vercel link

# Set env vars (once per env var)
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production

# Deploy manually (normally auto via GitHub push)
vercel --prod

# Check deployment status
vercel ls

# Rollback: Go to Vercel Dashboard → Deployments → Click previous deployment → "Promote to Production"
```

**GitHub Integration** (recommended):
- Connect repo in Vercel dashboard → auto-deploys on push to main
- Preview deployments on every PR

---

## Platform C: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login + link
railway login
railway link

# Deploy
railway up

# View logs
railway logs

# Set env vars
railway variables set DATABASE_URL=...

# Rollback: Railway Dashboard → Deployments → click a deployment → "Redeploy"
```

---

## Platform D: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login + launch (first time)
fly auth login
fly launch

# Deploy
fly deploy

# Check status
fly status
fly logs

# Rollback
fly releases   # list releases
fly deploy --image [previous-image-id]
```

---

## Platform E: Render

```bash
# Auto-deploys via GitHub integration (set up in Render dashboard)
# Manual deploy via Render dashboard → "Deploy"

# Check logs
# Render Dashboard → your service → Logs

# Rollback
# Render Dashboard → Deploys → click previous deploy → "Redeploy"
```

---

## GitHub Actions Auto-Deploy (All Platforms)

For VPS: see `devops-engineer` agent for the complete workflow YAML.

For Vercel/Railway/Render: use their official GitHub Actions:
```yaml
# Vercel
- uses: amondnet/vercel-action@v20

# Railway
- uses: bervProject/railway-deploy@main
```

---

## Common VPS Problems + Fixes

| Problem | Fix |
|---------|-----|
| SSH connection refused | `nc -z VPS_IP 22` → check firewall + VPS is running |
| PM2 process not found | `ssh VPS "pm2 list"` → restart with `pm2 start ecosystem.config.js` |
| Port not accessible | `ssh VPS "ufw allow PORT"` → restart Nginx |
| Out of disk space | `ssh VPS "df -h"` → `pm2 flush` to clear logs |
| Node version mismatch | `ssh VPS "nvm use 20"` in deploy script |
| Migration failed | `ssh VPS "npx prisma migrate status"` → resolve manually |
| ECONNREFUSED DB | Check DATABASE_URL on VPS matches running PostgreSQL port |

---

> Rule: Note the rollback hash BEFORE every deploy. Never deploy without knowing how to undo it.
> Rule: Run /ship before this skill — never deploy code that hasn't passed the full pipeline.
