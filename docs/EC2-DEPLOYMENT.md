# EC2 Deployment Guide

## Prerequisites

1. **AWS Account** with EC2 access
2. **EC2 Instance** running Ubuntu 20.04 or later
   - Recommended: t2.small or larger
   - Minimum: t2.micro (for testing)
3. **Security Group** configured:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS) - if using SSL
4. **SSH Key Pair** for instance access
5. **Elastic IP** (recommended for production)

## Step-by-Step Deployment

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Click "Launch Instance"
3. Choose **Ubuntu Server 20.04 LTS** or later
4. Select instance type (t2.small recommended)
5. Configure security group:
   ```
   SSH    (22)   - Your IP
   HTTP   (80)   - 0.0.0.0/0
   HTTPS  (443)  - 0.0.0.0/0
   ```
6. Download and save your .pem key file
7. Launch instance

### Step 2: Connect to Your Instance

```bash
# Set key permissions (Linux/Mac)
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

For Windows, use PuTTY or Windows Terminal.

### Step 3: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clone your repository
git clone https://github.com/YOUR_USERNAME/APAC-Services-Margin-Analysis.git
cd APAC-Services-Margin-Analysis

# Make scripts executable
chmod +x deployment/*.sh
```

### Step 4: Run Setup Script

```bash
./deployment/setup-ec2.sh
```

This script will:
- Install Node.js 18.x
- Install build tools
- Install PM2 (process manager)
- Install and configure Nginx
- Configure firewall (UFW)

**Wait for completion** before proceeding.

### Step 5: Deploy Application

```bash
./deployment/deploy-app.sh
```

This will prompt you to:
1. Configure backend/.env file
2. Create admin user credentials

**Important**: When editing .env, set:
```
NODE_ENV=production
JWT_SECRET=<generate-a-strong-random-secret>
```

To generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Verify Deployment

1. **Check PM2 status**
   ```bash
   pm2 status
   ```
   Should show "margin-analysis-backend" running

2. **Check Nginx**
   ```bash
   sudo systemctl status nginx
   ```
   Should be active (running)

3. **Test application**
   - Open browser: `http://YOUR_EC2_PUBLIC_IP`
   - Should see login page

## Post-Deployment Configuration

### Set Up Domain (Optional)

1. **Point domain to EC2**
   - Create A record: `your-domain.com` → `YOUR_EC2_IP`

2. **Update Nginx config**
   ```bash
   sudo nano /etc/nginx/sites-available/margin-analysis
   ```
   Change `server_name _;` to `server_name your-domain.com;`

3. **Restart Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

### Enable SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### Configure Backend Environment

Edit production environment variables:
```bash
cd ~/APAC-Services-Margin-Analysis/backend
nano .env
```

Important settings:
```
NODE_ENV=production
JWT_SECRET=<your-strong-secret>
FRONTEND_URL=http://your-domain.com
```

Restart backend:
```bash
pm2 restart margin-analysis-backend
```

## Updating the Application

When you push code changes:

```bash
cd ~/APAC-Services-Margin-Analysis
./deployment/update-app.sh
```

Or manually:
```bash
git pull
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart margin-analysis-backend
sudo systemctl reload nginx
```

## Monitoring & Maintenance

### View Logs

```bash
# Backend logs
pm2 logs margin-analysis-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### PM2 Management

```bash
# Status
pm2 status

# Restart
pm2 restart margin-analysis-backend

# Stop
pm2 stop margin-analysis-backend

# Start
pm2 start margin-analysis-backend

# Monitor
pm2 monit
```

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
cp ~/APAC-Services-Margin-Analysis/backend/database/margin-analysis.db \
   ~/backups/margin-analysis-$(date +%Y%m%d-%H%M%S).db

# Automated daily backup (add to crontab)
crontab -e
```

Add this line for daily 2 AM backups:
```
0 2 * * * cp ~/APAC-Services-Margin-Analysis/backend/database/margin-analysis.db ~/backups/margin-analysis-$(date +\%Y\%m\%d).db
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd ~/APAC-Services-Margin-Analysis/backend
npm update
cd ../frontend
npm update
```

## Troubleshooting

### Application Not Accessible

1. **Check Security Group**
   - Ensure port 80 is open to 0.0.0.0/0

2. **Check Nginx**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t  # Test configuration
   ```

3. **Check PM2**
   ```bash
   pm2 status
   pm2 logs margin-analysis-backend
   ```

### Backend API Errors

```bash
# Check backend logs
pm2 logs margin-analysis-backend --lines 100

# Check if database exists
ls -la ~/APAC-Services-Margin-Analysis/backend/database/

# Reinitialize database if needed
cd ~/APAC-Services-Margin-Analysis/backend
npm run init-db
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart PM2
pm2 restart margin-analysis-backend

# If needed, upgrade instance type in AWS Console
```

### Database Locked

```bash
# Check for processes using database
lsof ~/APAC-Services-Margin-Analysis/backend/database/margin-analysis.db

# Restart backend
pm2 restart margin-analysis-backend
```

## Security Best Practices

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong JWT secret** (32+ characters)

3. **Enable firewall**
   ```bash
   sudo ufw status
   ```

4. **Restrict SSH access**
   - Use key-based authentication only
   - Consider changing SSH port
   - Limit to specific IP ranges

5. **Regular backups**
   - Database
   - Configuration files
   - Application code

6. **Monitor logs**
   - Set up log rotation
   - Review regularly for suspicious activity

7. **Use HTTPS**
   - Install SSL certificate
   - Redirect HTTP to HTTPS

## Performance Optimization

### Enable Nginx Caching

Edit `/etc/nginx/sites-available/margin-analysis`:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable Gzip Compression

Add to Nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### PM2 Cluster Mode

For better performance with multi-core CPUs:

```bash
pm2 delete margin-analysis-backend
pm2 start backend/server.js -i max --name margin-analysis-backend
pm2 save
```

## Scaling Considerations

- **Vertical Scaling**: Upgrade instance type (t2.micro → t2.small → t2.medium)
- **Database**: Consider migrating to PostgreSQL or MySQL for larger datasets
- **Load Balancing**: Use AWS ELB for multiple instances
- **CDN**: Use CloudFront for static assets
- **Database Separation**: Move database to RDS for better performance

## Cost Optimization

- Use t2.micro for testing (Free Tier eligible)
- Stop instance when not in use (development)
- Use Reserved Instances for production (cheaper)
- Set up billing alerts in AWS
- Monitor resource usage with CloudWatch

## Support

For deployment issues:
1. Check logs: `pm2 logs` and `/var/log/nginx/`
2. Review this guide
3. Check main README.md
4. Create an issue in the repository
