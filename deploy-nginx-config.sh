#!/bin/bash

set -e

echo "🚀 Déploiement de la configuration Nginx avec support des gros uploads..."

# Sauvegarder la configuration actuelle
echo "📁 Sauvegarde de la configuration actuelle..."
sudo cp /etc/nginx/sites-available/dalifilms /etc/nginx/sites-available/dalifilms.backup.$(date +%Y%m%d_%H%M%S)

# Copier la nouvelle configuration avec support 5GB
echo "🔧 Déploiement de la configuration avec support 5GB..."
sudo cp /var/www/PrimeContent/nginx-config.conf /etc/nginx/sites-available/dalifilms

# Tester la configuration
echo "🧪 Test de la configuration Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valide"
    
    # Recharger Nginx
    echo "🔄 Rechargement de Nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Configuration Nginx déployée avec succès!"
else
    echo "❌ Erreur dans la configuration Nginx"
    echo "🔄 Restauration de la configuration précédente..."
    
    # Restaurer la dernière sauvegarde en cas d'erreur
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/dalifilms.backup.* | head -n1)
    sudo cp "$LATEST_BACKUP" /etc/nginx/sites-available/dalifilms
    
    exit 1
fi

echo "🎉 Déploiement terminé avec succès!" 