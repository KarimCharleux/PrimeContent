#!/bin/bash

# Script de déploiement de la configuration Nginx pour les gros uploads
# Ce script déploie la configuration sécurisée avec support des fichiers de 100MB

set -e

echo "🚀 Déploiement de la configuration Nginx avec support des gros uploads..."

# Vérifier que nous sommes sur le serveur de production
if [[ "$HOSTNAME" != "srv910965.hstgr.cloud" ]]; then
    echo "⚠️  Ce script doit être exécuté sur le serveur de production"
    echo "Current hostname: $HOSTNAME"
    echo "Expected: srv910965.hstgr.cloud"
    exit 1
fi

# Sauvegarder la configuration actuelle
echo "📁 Sauvegarde de la configuration actuelle..."
sudo cp /etc/nginx/sites-available/dalifilms.fr /etc/nginx/sites-available/dalifilms.fr.backup.$(date +%Y%m%d_%H%M%S)

# Copier la nouvelle configuration avec support 5GB
echo "🔧 Déploiement de la configuration avec support 5GB..."
sudo cp /var/www/PrimeContent/nginx-config.conf /etc/nginx/sites-available/dalifilms.fr

# Tester la configuration
echo "🧪 Test de la configuration Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valide"
    
    # Recharger Nginx
    echo "🔄 Rechargement de Nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Configuration Nginx déployée avec succès!"
    echo "📊 Limites configurées :"
    echo "   - Taille max des uploads : 5GB 🚀"
    echo "   - Timeout de lecture : 1 heure"
    echo "   - Timeout d'envoi : 1 heure" 
    echo "   - Streaming direct activé (pas de buffering)"
    echo "   - Protection anti-DDoS activée"
    echo "   - Headers de sécurité renforcés"
    
else
    echo "❌ Erreur dans la configuration Nginx"
    echo "🔄 Restauration de la configuration précédente..."
    
    # Restaurer la dernière sauvegarde en cas d'erreur
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/dalifilms.fr.backup.* | head -n1)
    sudo cp "$LATEST_BACKUP" /etc/nginx/sites-available/dalifilms.fr
    
    exit 1
fi

echo "🎉 Déploiement terminé avec succès!" 