#!/bin/bash

# Script de build local et déploiement du dossier .next vers VPS Hostinger
# Usage: ./deploy.sh

# Configuration
SERVER_USER="root"
SERVER_IP="82.29.173.124"
SERVER_HOST="srv910965.hstgr.cloud"
SERVER_PATH="/var/www/PrimeContent"
LOCAL_PATH="$(pwd)"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Démarrage du build et déploiement vers VPS Hostinger ===${NC}"

# Se positionner dans le répertoire du projet
cd "$LOCAL_PATH" || { echo -e "${RED}Erreur: Impossible d'accéder au répertoire du projet${NC}"; exit 1; }

# Build Next.js en local
echo -e "${YELLOW}[1/5] Build du projet Next.js...${NC}"
npm run build || { echo -e "${RED}Erreur lors du build${NC}"; exit 1; }

# Compresser le dossier .next
echo -e "${YELLOW}[2/5] Compression du dossier .next...${NC}"
ARCHIVE_NAME="next_build_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$ARCHIVE_NAME" .next

# Transférer l'archive vers le serveur
echo -e "${YELLOW}[3/5] Transfert vers le serveur Hostinger...${NC}"
scp "$ARCHIVE_NAME" "$SERVER_USER@$SERVER_HOST:~/" || { echo -e "${RED}Erreur lors du transfert${NC}"; exit 1; }

# Exécuter les commandes de déploiement sur le serveur
echo -e "${YELLOW}[4/5] Mise à jour du code source avec git pull...${NC}"
ssh "$SERVER_USER@$SERVER_HOST" << EOF
  cd $SERVER_PATH || { echo "Erreur: Impossible d'accéder au répertoire du serveur"; exit 1; }
  
  echo "Mise à jour du code source avec git pull..."
  git pull
  
  echo "Sauvegarde de l'ancienne version..."
  [ -d .next_backup ] && rm -rf .next_backup
  [ -d .next ] && mv .next .next_backup
  
  echo "Extraction du nouveau dossier .next..."
  tar -xzf ~/$ARCHIVE_NAME
  
  echo "Nettoyage du fichier d'archive sur le serveur..."
  rm ~/$ARCHIVE_NAME
EOF

# Nettoyer les fichiers temporaires
rm "$ARCHIVE_NAME"

echo -e "${GREEN}Déploiement terminé avec succès !${NC}"
echo -e "${YELLOW}N'oubliez pas de vérifier que votre site fonctionne correctement.${NC}"
