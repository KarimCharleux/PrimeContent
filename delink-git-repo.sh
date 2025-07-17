#!/bin/bash

# Script pour "delinker" le dossier de production du repo Git
# Supprime .git/ et tous les fichiers liés à Git pour sécuriser la production

echo "🔗 Suppression des liens Git du dossier de production"
echo "=================================================="

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
    echo "❌ Erreur: Ce script doit être exécuté dans /var/www/PrimeContent"
    exit 1
fi

echo "📁 Dossier actuel: $(pwd)"

# Vérifier que c'est bien un repo Git
if [ ! -d ".git" ]; then
    echo "✅ Ce dossier n'est déjà pas lié à Git"
    exit 0
fi

echo "📊 Espace utilisé par Git:"
du -sh .git/ 2>/dev/null || echo "   Impossible de calculer"

# Créer une sauvegarde du dossier .git (au cas où)
echo ""
echo "💾 Sauvegarde du dossier .git..."
BACKUP_NAME="git-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "/root/backups/$BACKUP_NAME" .git/ 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde Git créée: /root/backups/$BACKUP_NAME"
else
    echo "⚠️ Impossible de créer la sauvegarde Git (non critique)"
fi

# Arrêter l'application temporairement pour éviter tout conflit
echo ""
echo "⏹️ Arrêt temporaire de l'application..."
pm2 stop dalifilms

# Supprimer le dossier .git et les fichiers Git
echo ""
echo "🗑️ Suppression des fichiers Git..."

GIT_FILES_TO_DELETE=(
    ".git/"
    ".gitignore"
    ".gitattributes"
    ".github/"
)

for item in "${GIT_FILES_TO_DELETE[@]}"; do
    if [ -e "$item" ]; then
        echo "   🗑️ Suppression: $item"
        rm -rf "$item"
    else
        echo "   ℹ️ Absent: $item"
    fi
done

# Vérifier que Git n'est plus présent
echo ""
echo "✅ Vérification..."
if [ -d ".git" ]; then
    echo "❌ Le dossier .git existe encore"
    exit 1
else
    echo "✅ Dossier .git supprimé avec succès"
fi

# Vérifier que les fichiers essentiels sont toujours là
ESSENTIAL_FILES=(
    ".next/"
    "node_modules/"
    "package.json"
    "server.js"
    "ecosystem.config.js"
)

echo ""
echo "🔍 Vérification des fichiers essentiels..."
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
    echo "❌ Fichiers essentiels manquants ! Problème critique."
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
    echo "❌ Problème de redémarrage"
    exit 1
fi

# Afficher les résultats
echo ""
echo "🎉 Dossier délié de Git avec succès !"
echo ""
echo "📊 Espace libéré: $(du -sh /root/backups/$BACKUP_NAME 2>/dev/null | cut -f1 || echo 'N/A')"
echo ""
echo "✅ Avantages obtenus:"
echo "   - 🔒 Plus d'historique Git exposé"
echo "   - 🚀 Dossier de production plus léger"
echo "   - 🛡️ Sécurité améliorée"
echo "   - 🧹 Structure plus propre"
echo ""
echo "📁 Contenu du dossier après nettoyage:"
ls -la | grep -v '^total'
echo ""
echo "💾 Sauvegarde Git disponible: /root/backups/$BACKUP_NAME"
echo "🗑️ Vous pouvez supprimer la sauvegarde Git après vérification avec:"
echo "   rm /root/backups/$BACKUP_NAME"

echo ""
echo "🚀 Status de l'application:"
pm2 list | grep dalifilms

echo ""
echo "🔄 Rappel: Vos déploiements se font maintenant uniquement via GitHub Actions"
echo "   Plus besoin de Git sur le serveur !" 