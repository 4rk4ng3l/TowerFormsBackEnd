#!/bin/bash

# Script de despliegue para TowerForms Backend en EC2
# Ejecutar este script en tu servidor EC2 después de clonar el repositorio

set -e  # Exit on error

echo "=========================================="
echo "TowerForms Backend - Deployment Script"
echo "=========================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json no encontrado. Ejecuta este script desde el directorio raíz del proyecto.${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Instalando dependencias...${NC}"
npm ci --production=false

echo -e "${YELLOW}2. Compilando TypeScript...${NC}"
npm run build

echo -e "${YELLOW}3. Verificando archivo .env.production...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production no encontrado.${NC}"
    echo "Por favor crea el archivo .env.production con las configuraciones necesarias."
    exit 1
fi

echo -e "${YELLOW}4. Creando directorios para uploads...${NC}"
sudo mkdir -p /var/www/towerforms/uploads
sudo mkdir -p /var/www/towerforms/uploads/exports
sudo chown -R $USER:$USER /var/www/towerforms

echo -e "${YELLOW}5. Ejecutando migraciones de Prisma...${NC}"
NODE_ENV=production npx prisma migrate deploy

echo -e "${YELLOW}6. Generando Prisma Client...${NC}"
npx prisma generate

echo -e "${GREEN}=========================================="
echo "Despliegue completado exitosamente!"
echo "==========================================${NC}"
echo ""
echo "Para iniciar el servidor en producción, ejecuta:"
echo "  npm run start:prod"
echo ""
echo "Para iniciar con PM2 (recomendado):"
echo "  pm2 start ecosystem.config.js"
echo ""
