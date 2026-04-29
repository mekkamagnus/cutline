# Chore: Deploy cutline.mekaelturner.com Subdomain with CI/CD

## Chore Description
Set up the `cutline.mekaelturner.com` subdomain on the DigitalOcean server (137.184.143.235), mirroring the configuration used for `phraser.mekaelturner.com`. This includes:
- DNS A record configuration
- NGINX reverse proxy setup
- SSL certificate via Let's Encrypt
- PM2 process management
- GitHub Actions CI/CD pipeline for automated deployments

### Architecture Overview
```
DNS (cutline.mekaelturner.com → 137.184.143.235)
    → NGINX (443/80)
        → /api/* → localhost:3600 (Bun/Elysia backend)
        → /*      → static files (Vite/React frontend)
    → PM2 (cutline-api process)
```

**Key Difference from Phraser**: Cutline has separate frontend (static) and backend (API) components.

## Relevant Files

### Existing Files to Reference
- `app/client/package.json` - Frontend build scripts (`npm run build`)
- `app/client/vite.config.ts` - Vite build configuration (outputs to `dist/`)
- `app/server/package.json` - Backend start scripts (`bun run start`)
- `app/server/src/index.ts` - Server entry point (default port 3001)
- `specs/phraser-subdomain-review.md` - Reference configuration

### New Files to Create

#### `.github/workflows/deploy.yml`
GitHub Actions workflow for CI/CD pipeline with:
- Trigger on push to main branch
- Build frontend (Vite)
- Deploy to server via SSH

#### `scripts/deploy.sh`
Server-side deployment script for:
- Pulling latest code
- Building frontend
- Restarting PM2 process

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Configure DNS (DigitalOcean)
- [ ] Create A record: `cutline.mekaelturner.com` → `137.184.143.235`
- [ ] Verify DNS propagation: `dig +short cutline.mekaelturner.com`

```bash
doctl compute domain records create mekaelturner.com \
  --record-type A \
  --record-name cutline \
  --record-data 137.184.143.235 \
  --record-ttl 300
```

### 2. Create Application Directory on Server
- [ ] SSH to server and create directory structure
- [ ] Clone repository to `/opt/cutline`

```bash
ssh mekaelturner "mkdir -p /opt/cutline && chown deploy:deploy /opt/cutline"
ssh mekaelturner "cd /opt && git clone https://github.com/mekkamagnus/cutline.git cutline"
```

### 3. Create NGINX Configuration
- [ ] Create `/etc/nginx/sites-available/cutline.mekaelturner.com`
- [ ] Symlink to sites-enabled
- [ ] Test and reload NGINX

**NGINX Config** (`/etc/nginx/sites-available/cutline.mekaelturner.com`):
```nginx
server {
    server_name cutline.mekaelturner.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3600;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend static files
    location / {
        root /opt/cutline/app/client/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/cutline.mekaelturner.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cutline.mekaelturner.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name cutline.mekaelturner.com;
    return 301 https://$host$request_uri;
}
```

### 4. Provision SSL Certificate
- [ ] Run Certbot to obtain SSL certificate

```bash
ssh mekaelturner "sudo certbot certonly --nginx -d cutline.mekaelturner.com"
```

### 5. Configure PM2 for Backend
- [ ] Start backend with PM2 on port 3600
- [ ] Save PM2 configuration

```bash
ssh mekaelturner "cd /opt/cutline/app/server && PORT=3600 pm2 start src/index.ts --name cutline-api -- -p 3600"
ssh mekaelturner "pm2 save"
```

### 6. Create GitHub Actions Workflow
- [ ] Create `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/client/package-lock.json

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install frontend dependencies
        working-directory: app/client
        run: npm ci

      - name: Build frontend
        working-directory: app/client
        run: npm run build
        env:
          VITE_API_URL: https://cutline.mekaelturner.com/api

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 137.184.143.235
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/cutline
            git pull origin main

            # Install and build frontend
            cd app/client
            npm ci
            npm run build

            # Install backend dependencies
            cd ../server
            bun install

            # Restart PM2 process
            pm2 restart cutline-api || pm2 start src/index.ts --name cutline-api

            # Reload NGINX
            sudo systemctl reload nginx
```

### 7. Configure GitHub Secrets
- [ ] Add `SSH_USERNAME` (e.g., `root` or `deploy`)
- [ ] Add `SSH_PRIVATE_KEY` (private key for server access)

### 8. Update Frontend API Configuration
- [ ] Ensure frontend uses correct API URL for production

### 9. Initial Deployment
- [ ] Push changes to trigger CI/CD
- [ ] Verify deployment at https://cutline.mekaelturner.com

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

```bash
# DNS Resolution
dig +short cutline.mekaelturner.com
# Expected: 137.184.143.235

# SSL Certificate
ssh mekaelturner "sudo certbot certificates | grep cutline"

# NGINX Status
ssh mekaelturner "sudo nginx -t"

# PM2 Process Status
ssh mekaelturner "pm2 status | grep cutline"

# Port Check
ssh mekaelturner "sudo lsof -i :3600"

# Frontend Accessibility
curl -sI https://cutline.mekaelturner.com | head -5

# API Health Check
curl -s https://cutline.mekaelturner.com/api/
```

## Notes

### Port Allocation
| App | Port |
|-----|------|
| phraser | 3500 |
| cutline-api | 3600 |

### Key Differences from Phraser
1. **Phraser**: Single Next.js app (standalone server)
2. **Cutline**: Separate frontend (static) + backend (Bun/Elysia)
   - Frontend: Built by Vite, served by NGINX
   - Backend: Bun runtime, proxied via `/api/`

### Environment Variables for Production
The backend may need these environment variables (add to PM2 or `.env`):
```
NODE_ENV=production
PORT=3600
```

### Future Enhancements
- Add database migration step to CI/CD
- Add health check endpoint
- Configure log rotation for PM2
- Set up monitoring/alerting
