# Chore: Review phraser.mekaelturner.com Subdomain Setup

## Chore Description
Review and document how the `phraser.mekaelturner.com` subdomain is configured on the production server (137.184.143.235).

## Findings Summary

### Infrastructure Overview
| Component | Value |
|-----------|-------|
| **Server IP** | 137.184.143.235 |
| **Domain** | phraser.mekaelturner.com |
| **App Port** | 3500 |
| **Web Server** | NGINX |
| **Process Manager** | PM2 |
| **SSL Provider** | Let's Encrypt (Certbot) |
| **App Location** | /opt/phraser |
| **App Type** | Next.js (standalone) |

### Architecture
```
Internet → DNS (phraser.mekaelturner.com → 137.184.143.235)
         → NGINX (443/80) → Reverse Proxy → localhost:3500
         → PM2 (phraser process) → Next.js standalone server
```

## Detailed Configuration

### 1. DNS Configuration
- **A Record**: `phraser.mekaelturner.com` → `137.184.143.235`
- **Verified**: DNS resolves correctly

### 2. NGINX Configuration
**File**: `/etc/nginx/sites-enabled/phraser.mekaelturner.com`
- **Symlinked to**: `/etc/nginx/sites-available/phraser.mekaelturner.com`

**Key Settings**:
- HTTP (80) → 301 redirect to HTTPS
- HTTPS (443) with SSL
- Proxy pass to `http://localhost:3500`
- WebSocket support (Upgrade headers)
- Static asset caching:
  - `/_next/static/` - 365 days, immutable
  - `/manifest.webmanifest` - 7 days
  - `/icons/` - 30 days
- Gzip compression enabled

### 3. SSL Certificate
**Provider**: Let's Encrypt via Certbot
- **Certificate**: `/etc/letsencrypt/live/phraser.mekaelturner.com/fullchain.pem`
- **Private Key**: `/etc/letsencrypt/live/phraser.mekaelturner.com/privkey.pem`
- **Key Type**: ECDSA
- **Expiry**: 2026-06-20 (82 days remaining - VALID)
- **Auto-renewal**: Managed by Certbot

### 4. PM2 Process Configuration
**Process Name**: `phraser`
- **Exec Path**: `/opt/phraser/.next/standalone/server.js`
- **Working Dir**: `/opt/phraser/.next/standalone`
- **Port**: 3500
- **Mode**: Fork (single instance)
- **Auto-restart**: Enabled

**Environment Variables**:
```
NODE_ENV=production
PORT=3500
DEEPSEEK_API_KEY=sk-9621754238d7426385c43d2242977a20
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_API_KEY=re_ijAXqjKB_ACXPZNwicoProHPjmosKhc7r
EMAIL_FROM=noreply@mekaelturner.com
```

**Log Files**:
- Output: `/root/.pm2/logs/phraser-out.log`
- Error: `/root/.pm2/logs/phraser-error.log`

### 5. Application Location
**Directory**: `/opt/phraser/`
- **Owner**: `deploy:deploy`
- **Type**: Next.js application with standalone output
- **Framework**: Next.js (React)

### 6. Current Status
⚠️ **The PM2 process is NOT currently running**
- Port 3500 has no active listener
- Error logs show: `Failed to find Server Action "x"` (Next.js Server Action issues)

## Commands to Manage the Subdomain

### Start/Restart the App
```bash
ssh mekaelturner "cd /opt/phraser/.next/standalone && pm2 start server.js --name phraser"
```

### Check Status
```bash
ssh mekaelturner "pm2 status"
ssh mekaelturner "sudo lsof -i :3500"
```

### View Logs
```bash
ssh mekaelturner "pm2 logs phraser"
ssh mekaelturner "tail -f ~/.pm2/logs/phraser-error.log"
```

### Reload NGINX
```bash
ssh mekaelturner "sudo nginx -t && sudo systemctl reload nginx"
```

### Renew SSL Certificate
```bash
ssh mekaelturner "sudo certbot renew"
```

## Notes
- The app is currently down and needs to be restarted
- Error logs indicate Next.js Server Action deployment issues - may need to redeploy
- SSL certificate is valid and auto-renewal is configured
- NGINX configuration is correct and follows best practices
