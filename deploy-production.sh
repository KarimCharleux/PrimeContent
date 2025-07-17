#!/bin/bash

# Script de déploiement automatique pour Dalifilms
# Usage: ./deploy-production.sh

# Configuration
APP_DIR="/var/www/PrimeContent"
BACKUP_DIR="/root/backups"
LOG_FILE="/var/log/deploy.log"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$DATE]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$DATE] ERREUR:${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$DATE] ATTENTION:${NC} $1" | tee -a $LOG_FILE
}

# Créer le dossier de backup si nécessaire
mkdir -p $BACKUP_DIR

log "🚀 Début du déploiement automatique"

# Vérifier que PM2 tourne
if ! pm2 list | grep -q "dalifilms"; then
    error "L'application dalifilms n'est pas démarrée dans PM2"
    exit 1
fi

# Aller dans le répertoire de l'application
cd $APP_DIR || {
    error "Impossible d'accéder au répertoire $APP_DIR"
    exit 1
}

log "📁 Répertoire: $APP_DIR"

# Sauvegarder l'état actuel
log "💾 Création d'une sauvegarde..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_DIR/$BACKUP_NAME" .next package-lock.json 2>/dev/null || warning "Impossible de créer la sauvegarde"

# Garder seulement les 5 dernières sauvegardes
find $BACKUP_DIR -name "backup-*.tar.gz" -type f -mtime +5 -delete

# Arrêter l'application
log "⏹️  Arrêt de l'application..."
pm2 stop dalifilms

# Récupérer les dernières modifications
log "📥 Récupération des modifications Git..."
git fetch origin

# Vérifier s'il y a des modifications locales
if ! git diff --quiet HEAD origin/master; then
    log "🔄 Nouvelles modifications détectées"
    
    # Sauvegarder les fichiers locaux modifiés
    git stash push -m "Auto-stash before deploy $(date)"
    
    # Mettre à jour le code
    git reset --hard origin/master
    
    log "📦 Installation des dépendances..."
    npm ci --production=false
    
    log "🔧 Installation de Sharp pour Linux..."
    npm install --platform=linux --arch=x64 sharp
    
    log "🏗️  Build de l'application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log "✅ Build réussi"
    else
        error "❌ Échec du build"
        
        # Restaurer la sauvegarde
        warning "🔙 Restauration de la sauvegarde..."
        if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
            tar -xzf "$BACKUP_DIR/$BACKUP_NAME"
        fi
        
        pm2 start dalifilms
        exit 1
    fi
else
    log "✅ Aucune modification à déployer"
fi

# Redémarrer l'application
log "🔄 Redémarrage de l'application..."
pm2 start dalifilms

# Attendre que l'application soit prête
sleep 5

# Vérifier que l'application répond
if curl -f -s http://localhost:3000 > /dev/null; then
    log "✅ Application démarrée avec succès"
    log "🌐 Site accessible sur: https://dalifilms.fr"
else
    error "❌ L'application ne répond pas"
    
    # Restaurer la sauvegarde en cas d'échec
    warning "🔙 Restauration de la sauvegarde..."
    if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
        pm2 stop dalifilms
        tar -xzf "$BACKUP_DIR/$BACKUP_NAME"
        pm2 start dalifilms
        error "⚠️  Application restaurée à l'état précédent"
    fi
    exit 1
fi

# Nettoyer les anciens logs
find /var/log -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true

# Recharger PM2 (au cas où)
pm2 reload dalifilms --update-env

log "🎉 Déploiement terminé avec succès !"
log "📊 Statut de l'application:"
pm2 list | grep dalifilms | tee -a $LOG_FILE

echo ""
log "📈 Statistiques:"
log "   - Version: $(git rev-parse --short HEAD)"
log "   - Branche: $(git branch --show-current)"
log "   - Dernier commit: $(git log -1 --pretty=format:'%s')"

exit 0 