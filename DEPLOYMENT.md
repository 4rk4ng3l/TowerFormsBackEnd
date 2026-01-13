# Guía de Despliegue en Producción - AWS EC2

Esta guía te ayudará a desplegar TowerForms Backend en tu servidor EC2.

## Información del Servidor

- **IP Pública**: 3.208.180.76
- **Base de datos**: PostgreSQL
- **Acceso**: SSH con PuTTY

---

## 📋 Prerequisitos en EC2

### 1. Instalar Node.js (v18 o superior)

Conecta a tu EC2 con PuTTY y ejecuta:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 2. Instalar PostgreSQL (si no está instalado)

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Verificar que está corriendo
sudo systemctl status postgresql
```

### 3. Instalar PM2 (Gestor de procesos)

```bash
sudo npm install -g pm2
```

### 4. Instalar Git

```bash
sudo apt install git -y
```

---

## 🗄️ Configurar PostgreSQL

### 1. Crear base de datos y usuario

```bash
# Conectar a PostgreSQL como usuario postgres
sudo -u postgres psql

# Dentro de PostgreSQL, ejecutar:
CREATE DATABASE forms_alexia;
CREATE USER towerforms_user WITH ENCRYPTED PASSWORD 'TU_PASSWORD_SEGURO_AQUI';
GRANT ALL PRIVILEGES ON DATABASE forms_alexia TO towerforms_user;
\q
```

### 2. Configurar acceso remoto (opcional, solo para desarrollo)

```bash
# Editar configuración de PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf

# Buscar y modificar:
listen_addresses = 'localhost'  # Solo local para producción

# Guardar con Ctrl+O, salir con Ctrl+X

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

---

## 🚀 Despliegue de la Aplicación

### 1. Clonar el repositorio

```bash
# Ir al directorio home
cd ~

# Clonar el repositorio (reemplaza con tu URL)
git clone https://github.com/TU_USUARIO/TowerFormsBackEnd.git

# O si ya tienes el código, súbelo usando SCP/WinSCP desde tu PC
```

### 2. Configurar variables de entorno

```bash
cd ~/TowerFormsBackEnd

# Editar archivo .env.production
nano .env.production
```

**IMPORTANTE**: Actualiza estas variables en `.env.production`:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration - ACTUALIZA ESTOS VALORES
DATABASE_URL="postgresql://towerforms_user:TU_PASSWORD_AQUI@localhost:5432/forms_alexia?schema=public"

# JWT Configuration - CAMBIA ESTE SECRET
JWT_SECRET=TU_SECRET_SUPER_SECRETO_Y_ALEATORIO_AQUI_MIN_32_CARACTERES
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# File Upload Configuration
UPLOAD_DIR=/var/www/towerforms/uploads
EXPORTS_DIR=/var/www/towerforms/uploads/exports
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
BASE_URL=http://3.208.180.76:3000

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

**Genera un JWT_SECRET seguro**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Ejecutar script de despliegue

```bash
# Dar permisos de ejecución
chmod +x deploy.sh

# Ejecutar despliegue
./deploy.sh
```

Este script automáticamente:
- Instala dependencias
- Compila TypeScript
- Crea directorios necesarios
- Ejecuta migraciones de base de datos
- Genera Prisma Client

### 4. Iniciar el servidor con PM2

```bash
# Crear directorio para logs
sudo mkdir -p /var/log/towerforms
sudo chown -R $USER:$USER /var/log/towerforms

# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Guardar configuración PM2
pm2 save

# Configurar PM2 para iniciar al reiniciar servidor
pm2 startup
# Ejecuta el comando que PM2 te muestre
```

### 5. Verificar que está funcionando

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs towerforms-backend

# Ver logs en tiempo real
pm2 logs --lines 100
```

Prueba el endpoint de salud:
```bash
curl http://localhost:3000/health
```

---

## 🔥 Configurar Firewall

```bash
# Permitir tráfico en puerto 3000
sudo ufw allow 3000/tcp

# Si SSH no está permitido
sudo ufw allow 22/tcp

# Habilitar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

**IMPORTANTE**: También configura el Security Group en AWS:
- Ve a EC2 Console → Security Groups
- Edita el security group de tu instancia
- Agrega regla de entrada (Inbound Rule):
  - Type: Custom TCP
  - Port: 3000
  - Source: 0.0.0.0/0 (o tu IP específica para más seguridad)

---

## 🌐 Configurar HTTPS con Nginx (Recomendado)

### 1. Instalar Nginx

```bash
sudo apt install nginx -y
```

### 2. Configurar reverse proxy

```bash
sudo nano /etc/nginx/sites-available/towerforms
```

Agregar:
```nginx
server {
    listen 80;
    server_name 3.208.180.76;  # O tu dominio

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
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
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/towerforms /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Permitir tráfico HTTP
sudo ufw allow 'Nginx Full'
```

Ahora tu API estará disponible en `http://3.208.180.76`

---

## 📱 Actualizar Frontend

Ya actualicé el archivo de configuración del frontend:
```typescript
// app/src/data/api/config.ts
BASE_URL: 'http://3.208.180.76:3000/api'
```

**IMPORTANTE**: Si instalas Nginx, cambia a:
```typescript
BASE_URL: 'http://3.208.180.76/api'
```

---

## 🔄 Actualizar la Aplicación

```bash
# Ir al directorio
cd ~/TowerFormsBackEnd

# Obtener últimos cambios
git pull

# Reinstalar dependencias y compilar
npm ci
npm run build

# Ejecutar migraciones si hay cambios en BD
NODE_ENV=production npx prisma migrate deploy

# Reiniciar PM2
pm2 restart towerforms-backend

# Ver logs
pm2 logs
```

---

## 🛠️ Comandos Útiles PM2

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs towerforms-backend

# Reiniciar
pm2 restart towerforms-backend

# Detener
pm2 stop towerforms-backend

# Eliminar
pm2 delete towerforms-backend

# Ver uso de recursos
pm2 monit

# Ver información detallada
pm2 show towerforms-backend
```

---

## 🐛 Troubleshooting

### Error: Cannot connect to database

1. Verifica que PostgreSQL esté corriendo:
```bash
sudo systemctl status postgresql
```

2. Verifica las credenciales en `.env.production`

3. Prueba conexión manual:
```bash
psql -U towerforms_user -d forms_alexia -h localhost
```

### Error: Port 3000 already in use

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000

# Matar proceso
kill -9 PID
```

### No se puede acceder desde app móvil

1. Verifica firewall de EC2:
```bash
sudo ufw status
```

2. Verifica Security Group en AWS Console

3. Prueba desde tu PC:
```bash
curl http://3.208.180.76:3000/health
```

### Ver logs de errores

```bash
# Logs de PM2
pm2 logs towerforms-backend --err

# Logs del sistema
tail -f /var/log/towerforms/error.log
```

---

## 📊 Monitoreo

```bash
# Instalar herramienta de monitoreo
pm2 install pm2-logrotate

# Configurar rotación de logs
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔐 Seguridad Adicional (Recomendado)

### 1. Cambiar puerto SSH

```bash
sudo nano /etc/ssh/sshd_config
# Cambiar: Port 22 → Port 2222
sudo systemctl restart sshd
```

### 2. Instalar fail2ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Configurar backups automáticos de PostgreSQL

```bash
# Crear script de backup
nano ~/backup-db.sh
```

Agregar:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
pg_dump -U towerforms_user forms_alexia > $BACKUP_DIR/backup_$TIMESTAMP.sql
# Mantener solo últimos 7 días
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x ~/backup-db.sh

# Agregar a crontab (diario a las 2 AM)
crontab -e
# Agregar: 0 2 * * * /home/ubuntu/backup-db.sh
```

---

## ✅ Checklist de Despliegue

- [ ] Node.js instalado (v18+)
- [ ] PostgreSQL configurado
- [ ] Base de datos creada
- [ ] Usuario de BD creado
- [ ] Repositorio clonado
- [ ] `.env.production` configurado
- [ ] Script de despliegue ejecutado
- [ ] Migraciones ejecutadas
- [ ] PM2 instalado y configurado
- [ ] Aplicación iniciada con PM2
- [ ] Firewall configurado
- [ ] Security Group de AWS configurado
- [ ] Endpoint `/health` respondiendo
- [ ] App móvil conectándose correctamente

---

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs de PM2: `pm2 logs`
2. Logs del sistema: `/var/log/towerforms/`
3. Estado de PostgreSQL: `sudo systemctl status postgresql`
4. Conectividad: `curl http://localhost:3000/health`
