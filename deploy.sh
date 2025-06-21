#!/bin/bash

# Script de build local et déploiement du dossier .next vers o2switch
# Usage: ./deploy-next.sh

# Configuration
SERVER_USER="aymo1441"
SERVER_IP="109.234.166.34"
SERVER_PATH="~/PrimeContent"
LOCAL_PATH="$(pwd)"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Démarrage du build et déploiement du dossier .next ===${NC}"

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
echo -e "${YELLOW}[3/5] Transfert vers le serveur o2switch...${NC}"
scp "$ARCHIVE_NAME" "$SERVER_USER@$SERVER_IP:~/" || { echo -e "${RED}Erreur lors du transfert${NC}"; exit 1; }

# Exécuter les commandes de déploiement sur le serveur
echo -e "${YELLOW}[4/5] Mise à jour du code source avec git pull...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << EOF
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
