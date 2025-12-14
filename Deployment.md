## 1. Repository

* **GitHub URL**: [https://github.com/aabiilrqm/library-api.git](https://github.com/aabiilrqm/library-api.git)
* **Branch**: `main`

---

## 2. Production URLs

* **Base URL (Public)**: [http://52.3.0.28](http://52.3.0.28)
* **Direct API (Internal)**: [http://127.0.0.1:4000](http://127.0.0.1:4000)
* **Health Check**: `GET /health`

Contoh:

```
http://52.3.0.28/health
```

---

## 3. AWS EC2 Instance Details

| Item          | Value                   |
| ------------- | ----------------------- |
| Instance Type | t3.micro (Free Tier)    |
| OS            | Ubuntu Server 22.04 LTS |
| Region        | us-east-1 (N. Virginia) |
| Public IP     | 52.3.0.28               |
| Storage       | 8 GB (gp3)              |

---

## 4. EC2 & Security Group Setup

### 4.1 Inbound Rules

| Type       | Port | Source    | Description                    |
| ---------- | ---- | --------- | ------------------------------ |
| SSH        | 22   | 0.0.0.0/0 | SSH Access                     |
| HTTP       | 80   | 0.0.0.0/0 | Web Traffic                    |
| Custom TCP | 4000 | 0.0.0.0/0 | Node.js API (internal/testing) |

> ⚠️ **Production Note**: Setelah NGINX aktif, port `4000` sebaiknya **ditutup** dari public.

---

## 5. Server Environment Setup

```bash
# Login ke server
ssh -i "web-api.pem" ubuntu@52.3.0.28

# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install tools
sudo apt install -y git nginx
sudo npm install -g pm2
```

---

## 6. Application Deployment

```bash
cd ~

git clone https://github.com/aabiilrqm/library-api.git
cd library-api

npm install --only=production
```

---

## 7. Environment Variables

Buat file `.env`:

```bash
cp .env.example .env
nano .env
```

### Contoh `.env` (Production)

```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

DATABASE_URL="file:./prod.db"

JWT_SECRET=CHANGE_ME_32_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=CHANGE_ME_32_CHARS_REFRESH
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://52.3.0.28
```

> ❗ Jangan pernah commit `.env` ke repository.

---

## 8. Database Setup (Prisma)

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

---

## 9. Run Application with PM2

```bash
pm2 start src/server.js --name library-api

pm2 save
pm2 startup
```

Jalankan command `sudo env PATH=...` yang ditampilkan oleh PM2, lalu:

```bash
pm2 save
```

---

## 10. NGINX (Reverse Proxy)

### 10.1 Config File

```bash
sudo nano /etc/nginx/sites-available/library-api
```

```nginx
server {
    listen 80;
    server_name 52.3.0.28;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.2 Enable & Reload

```bash
sudo ln -s /etc/nginx/sites-available/library-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. Verification

### 11.1 Internal Test

```bash
pm2 status
sudo lsof -i :4000
curl http://localhost:4000/api/health
```

### 11.2 Public Test

```bash
curl http://52.3.0.28/api/health
```

---

## 12. Test Credentials (Development Only)

### Admin

* Email: [admin@library.com](mailto:admin@library.com)
* Password: Admin123!

### Users

* [user1@library.com](mailto:user1@library.com) / User1123!
* [user2@library.com](mailto:user2@library.com) / User2123!
* [user3@library.com](mailto:user3@library.com) / User3123!

---

## 13. Monitoring & Logs

```bash
pm2 status
pm2 logs library-api
pm2 monit
```

NGINX logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 14. Maintenance

### Update App

```bash
git pull origin main
npm install --only=production
npx prisma migrate deploy
pm2 restart library-api
```

### Backup Database

```bash
cp prod.db ~/backups/prod-$(date +%Y%m%d).db
```

---

## 15. Security Notes

* Gunakan HTTPS (Certbot) untuk production
* Batasi SSH hanya IP tertentu
* Tutup port 4000 dari public SG
* Rotasi JWT secret secara berkala

---

## ✅ Status

**Production Ready** ✔️

*Last updated: 14 December 2025*
