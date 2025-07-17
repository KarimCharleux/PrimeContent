#!/bin/bash

# Script de nettoyage du dossier de production
# Supprime les fichiers de développement inutiles en gardant seulement ce qui est nécessaire

echo "🧹 Nettoyage du dossier de production"
echo "===================================="

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
    echo "❌ Erreur: Ce script doit être exécuté dans /var/www/PrimeContent"
    exit 1
fi

echo "📁 Dossier actuel: $(pwd)"
echo "📊 Espace utilisé avant nettoyage: $(du -sh . | cut -f1)"

# Créer une sauvegarde complète
echo ""
echo "💾 Création d'une sauvegarde complète..."
BACKUP_NAME="full-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "/root/backups/$BACKUP_NAME" . 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde créée: /root/backups/$BACKUP_NAME"
else
    echo "❌ Erreur lors de la sauvegarde. Arrêt du script."
    exit 1
fi

# Arrêter l'application temporairement
echo ""
echo "⏹️ Arrêt temporaire de l'application..."
pm2 stop dalifilms

# Liste des fichiers/dossiers à supprimer
FILES_TO_DELETE=(
    "README.md"
    "LICENSE" 
    "app/"
    "lib/"
    "bun.lockb"
    "yarn.lock"
    "check-server-media.sh"
    "components.json"
    "eslint.config.mjs"
    "firestore.rules"
    "lint-staged.config.js"
    "middleware.ts"
    "nginx-config.conf"
    "nginx-security-enhanced.conf"
    "postcss.config.mjs"
    "tailwind.config.ts"
    "tsconfig.json"
)

# Supprimer les fichiers inutiles
echo ""
echo "🗑️ Suppression des fichiers de développement..."
for item in "${FILES_TO_DELETE[@]}"; do
    if [ -e "$item" ]; then
        echo "   🗑️ Suppression: $item"
        rm -rf "$item"
    else
        echo "   ⚠️ Déjà absent: $item"
    fi
done

# Nettoyer node_modules et réinstaller seulement la production
echo ""
echo "📦 Nettoyage et réinstallation des dépendances de production..."
rm -rf node_modules/
npm ci --only=production

# Vérifier que les fichiers essentiels sont toujours présents
echo ""
echo "✅ Vérification des fichiers essentiels..."
ESSENTIAL_FILES=(
    ".next/"
    "node_modules/"
    "package.json"
    "package-lock.json"
    "server.js"
    "ecosystem.config.js"
    "next.config.mjs"
    "next-env.d.ts"
)

ALL_GOOD=true
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "   ✅ Présent: $file"
    else
        echo "   ❌ MANQUANT: $file"
        ALL_GOOD=false
    fi
done

if [ "$ALL_GOOD" = false ]; then
    echo ""
    echo "❌ Fichiers essentiels manquants ! Restauration de la sauvegarde..."
    tar -xzf "/root/backups/$BACKUP_NAME"
    pm2 start dalifilms
    exit 1
fi

# Redémarrer l'application
echo ""
echo "🚀 Redémarrage de l'application..."
pm2 start dalifilms

# Attendre et vérifier que l'app fonctionne
sleep 5
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Application redémarrée avec succès"
else
    echo "❌ Problème de redémarrage, restauration de la sauvegarde..."
    pm2 stop dalifilms
    tar -xzf "/root/backups/$BACKUP_NAME"
    pm2 start dalifilms
    exit 1
fi

# Afficher les résultats
echo ""
echo "🎉 Nettoyage terminé avec succès !"
echo ""
echo "📊 Espace utilisé après nettoyage: $(du -sh . | cut -f1)"
echo ""
echo "📁 Fichiers restants dans le dossier:"
ls -la
echo ""
echo "💾 Sauvegarde disponible: /root/backups/$BACKUP_NAME"
echo "🗑️ Vous pouvez supprimer la sauvegarde après vérification avec:"
echo "   rm /root/backups/$BACKUP_NAME"

echo ""
echo "🚀 Status de l'application:"
pm2 list | grep dalifilms 