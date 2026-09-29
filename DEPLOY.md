# Shajara — Serverga O'rnatish va Joylashtirish Qo'llanmasi (Deployment Guide)

Ushbu ilova har qanday Linux VPS serverida (Hetzner, DigitalOcean, Serverspace.uz, UzCloud va boshqalar) osonlik bilan ishga tushirilishi uchun loyihalashtirilgan.

---

## 1-Usul: Docker & Docker Compose orqali (Eng qulay va tavsiya etilgan)

### 1. Serverda Docker va Docker Compose o'rnatilganligini tekshiring:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

### 2. Loyihani yuklab oling:
```bash
git clone https://github.com/elee02/shajara.git
cd shajara
```

### 3. Konfiguratsiyani sozlang:
```bash
cp .env.example .env
# .env faylida JWT_SECRET qiymatini xavfsiz kalitga almashtiring:
nano .env
```

### 4. Konteynerni ishga tushiring:
```bash
docker-compose up -d --build
```
Ilova avtomatik tarzda `http://SERVER_IP:3000` portida ishga tushadi. SQLite ma'lumotlar bazasi `./data/shajara.db` da saqlanadi va server qayta yuklanganda ham yo'qolmaydi.

---

## 2-Usul: Node.js va PM2 orqali to'g'ridan-to'g'ri o'rnatish

### 1. Node.js (v20+) o'rnatish:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential
sudo npm install -g pm2
```

### 2. Loyihani yuklash va tayyorlash:
```bash
git clone https://github.com/elee02/shajara.git
cd shajara
npm install
npm run build
```

### 3. PM2 yordamida fonga tushirish:
```bash
pm2 start npm --name "shajara" -- start
pm2 save
pm2 startup
```

---

## 3. Nginx va Bepul SSL (HTTPS) ulash

Domen nomingiz (masalan: `shajara.uz`) orqali xavfsiz HTTPS bilan ulash uchun:

### Nginx konfiguratsiyasi:
`/etc/nginx/sites-available/shajara`:
```nginx
server {
    server_name shajara.uz www.shajara.uz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/shajara /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bepul SSL sertifikati olish:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shajara.uz -d www.shajara.uz
```

---

## Boshlang'ich Tizim Administratori:
* **Login**: `admin`
* **Parol**: `admin123`
*(Tizimga kirgach yangi shaxs va a'zolarni kiritishingiz mumkin)*
