1. Repository GitHub
URL: https://github.com/aabiilrqm/library-api.git
Branch: main


2. Production URLs
Base URL: http://52.3.0.28
Health Check Endpoint: GET http://52.3.0.28:4000/health


3. AWS EC2 Instance Details
Detail	Value
Instance ID	i-xxxxxxxxxxxxxxxxx
Instance Type	t3.micro (Free Tier Eligible)
Public IPv4 Address	52.3.0.28
Public IPv4 DNS	ec2-52-3-0-28.compute-1.amazonaws.com
Region	us-east-1 (N. Virginia)
Availability Zone	us-east-1a
Operating System	Ubuntu Server 22.04 LTS
AMI ID	ami-0ecb62995f68bb549
Storage	8 GB gp3
4. Deployment Steps
A. EC2 Instance Setup
Launch EC2 Instance:

AMI: Ubuntu Server 22.04 LTS

Instance Type: t3.micro

Key Pair: Create new key pair web-api.pem

Security Group: Configure inbound rules (see below)

Storage: 8 GB gp3

Security Group Configuration (Inbound Rules):

text
Type         | Port | Source        | Description
-------------|------|---------------|-------------
SSH          | 22   | 0.0.0.0/0     | SSH Access
HTTP         | 80   | 0.0.0.0/0     | Web Traffic
Custom TCP   | 4000 | 0.0.0.0/0     | Node.js Application
B. Server Environment Setup
bash
# Connect to EC2 instance
ssh -i "web-api.pem" ubuntu@52.3.0.28

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install additional tools
sudo apt install -y git nginx
sudo npm install -g pm2
C. Application Deployment
bash
# Clone repository
cd ~
git clone https://github.com/username/library-management-api.git
cd library-management-api

# Install dependencies
npm install --only=production

# Setup environment variables
cp .env.example .env
nano .env  # Edit with production values
5. Environment Variables Configuration
env
# Application
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Database
DATABASE_URL="file:./prod.db"

# JWT Authentication
JWT_SECRET=[32-character-strong-secret-here]
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=[32-character-strong-refresh-secret]
JWT_REFRESH_EXPIRES_IN=7d

# CORS (if applicable)
CORS_ORIGIN=http://52.3.0.28:4000
6. Database Setup
bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
# or
npx prisma db seed
7. Application Startup with PM2
bash
# Start application
pm2 start npm --name "library-api" -- start

# Configure PM2 to start on system boot
pm2 startup
# Run the generated command
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Check application status
pm2 status
8. Nginx Configuration (Optional)
bash
# Create nginx config
sudo nano /etc/nginx/sites-available/library-api
nginx
server {
    listen 80;
    server_name 52.3.0.28;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
bash
# Enable site
sudo ln -s /etc/nginx/sites-available/library-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
9. Verification Steps
Test from within EC2:
bash
# Check if application is running
pm2 status

# Check port listening
sudo netstat -tlnp | grep :4000

# Test health endpoint
curl http://localhost:4000/api/health

# Test API endpoint
curl http://localhost:4000/api/books
Test from local machine:
bash
# Test public accessibility
curl http://52.3.0.28:4000/api/health

# Test authentication
curl -X POST http://52.3.0.28:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@library.com","password":"User1123!"}'
Expected Health Check Response:
json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-14T09:45:30.123Z",
    "uptime": "5 minutes",
    "version": "1.0.0",
    "environment": "production"
  }
}
10. Test Credentials
For testing purposes only:

Admin Account:
Email: admin@library.com

Password: Admin123!

Role: ADMIN

Permissions: Full access to all resources

Regular User Accounts:
User 1:

Email: user1@library.com

Password: User1123!

User 2:

Email: user2@library.com

Password: User2123!

User 3:

Email: user3@library.com

Password: User3123!

11. Troubleshooting Common Issues
Issue 1: Application not accessible from public internet
bash
# Check Security Group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxx

# Check application is binding to 0.0.0.0
sudo netstat -tlnp | grep :4000
# Should show: 0.0.0.0:4000

# Check firewall
sudo ufw status
sudo ufw allow 4000
Issue 2: Application crashes on startup
bash
# Check PM2 logs
pm2 logs library-api --lines 100

# Check for port conflicts
sudo lsof -i :4000

# Check environment variables
pm2 env library-api
Issue 3: Database errors
bash
# Check database file
ls -la *.db

# Run Prisma diagnostics
npx prisma diagnose

# Reset database (development only)
npx prisma migrate reset
Issue 4: Cannot SSH to instance
Verify key pair permissions: chmod 400 web-api.pem

Check Security Group allows SSH (port 22)

Verify instance is in running state

Try using instance DNS instead of IP

12. Monitoring
Application Monitoring:
bash
# Check application status
pm2 status
pm2 list

# View application logs
pm2 logs library-api
pm2 logs library-api --lines 100  # Last 100 lines
pm2 logs library-api --err        # Error logs only

# Monitor resource usage
pm2 monit
System Monitoring:
bash
# Check system resources
htop
free -h
df -h

# Check application process
ps aux | grep node

# Check Nginx status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
13. Maintenance Procedures
A. Application Updates
bash
# Connect to EC2
ssh -i "web-api.pem" ubuntu@52.3.0.28

# Navigate to application directory
cd ~/library-management-api

# Pull latest changes
git pull origin main

# Install new dependencies
npm install --only=production

# Run database migrations (if any)
npx prisma migrate deploy

# Restart application
pm2 restart library-api

# Verify update
pm2 status
curl http://localhost:4000/api/health
B. Database Backup
bash
# Create backup
cp ~/library-management-api/prod.db ~/backups/prod-$(date +%Y%m%d).db

# Restore from backup
cp ~/backups/prod-20251214.db ~/library-management-api/prod.db
pm2 restart library-api
C. Log Management
bash
# Setup log rotation for PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Clear application logs
pm2 flush library-api
D. Security Updates
bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Update Node.js dependencies
cd ~/library-management-api
npm audit fix

# Restart after updates
pm2 restart library-api
14. Notes
Important Security Notes:
Never commit .env file to version control

Rotate JWT secrets periodically in production

Restrict Security Group to specific IPs for SSH access

Use HTTPS for production (requires SSL certificate)

Regularly update dependencies and system packages

Free Tier Considerations:
t3.micro instance has 1 GB RAM

Monitor CPU credits for consistent performance

Consider upgrading instance type if traffic increases

Support:
For issues with this deployment, contact:

AWS Support: AWS Academy Learner Lab

Application Issues: Repository maintainer

Last Updated: December 14, 2025
Maintainer: [Your Name]
Status: ✅ Production Ready

Quick Reference Commands
bash
# Start/Stop/Restart
pm2 start library-api
pm2 stop library-api
pm2 restart library-api

# Monitoring
pm2 logs library-api
pm2 status

# Database
npx prisma migrate deploy
npx prisma generate

# System
sudo systemctl restart nginx
sudo ufw status