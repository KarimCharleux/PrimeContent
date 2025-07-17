#!/bin/bash

# Script à exécuter SUR LE SERVEUR VPS pour diagnostiquer les médias
echo "🔍 Diagnostic des médias sur le serveur VPS"
echo "============================================"

# Informations de base
echo "📊 Informations serveur:"
echo "   - Hostname: $(hostname)"
echo "   - Date: $(date)"
echo "   - Utilisateur: $(whoami)"

# Test 1: Vérifier la structure des dossiers
echo ""
echo "1️⃣ Structure du dossier média..."
if [ -d "/var/www/PrimeContentMedia" ]; then
    echo "✅ Dossier /var/www/PrimeContentMedia existe"
    echo "📁 Contenu du dossier principal:"
    ls -la /var/www/PrimeContentMedia/ | head -10
    
    echo ""
    echo "📊 Nombre total de fichiers/dossiers:"
    find /var/www/PrimeContentMedia -type f | wc -l | sed 's/^/   Fichiers: /'
    find /var/www/PrimeContentMedia -type d | wc -l | sed 's/^/   Dossiers: /'
    
    echo ""
    echo "📂 Sous-dossiers principaux:"
    find /var/www/PrimeContentMedia -maxdepth 1 -type d | sort
else
    echo "❌ Dossier /var/www/PrimeContentMedia n'existe pas !"
    exit 1
fi

# Test 2: Vérifier le dossier uploads spécifiquement
echo ""
echo "2️⃣ Vérification du dossier uploads..."
if [ -d "/var/www/PrimeContentMedia/uploads" ]; then
    echo "✅ Dossier uploads existe"
    echo "📁 Contenu du dossier uploads:"
    ls -la /var/www/PrimeContentMedia/uploads/ | head -20
    
    echo ""
    echo "📊 Nombre de fichiers dans uploads:"
    find /var/www/PrimeContentMedia/uploads -type f | wc -l
else
    echo "❌ Dossier uploads n'existe pas"
    echo "📁 Création du dossier uploads..."
    mkdir -p /var/www/PrimeContentMedia/uploads
    chown -R www-data:www-data /var/www/PrimeContentMedia/uploads
    chmod -R 755 /var/www/PrimeContentMedia/uploads
    echo "✅ Dossier uploads créé"
fi

# Test 3: Chercher le fichier spécifique
echo ""
echo "3️⃣ Recherche du fichier SCR-20250618-ukfp.png..."
SEARCH_RESULT=$(find /var/www/PrimeContentMedia -name "*SCR-20250618-ukfp*" -type f 2>/dev/null)
if [ -n "$SEARCH_RESULT" ]; then
    echo "✅ Fichier trouvé:"
    echo "$SEARCH_RESULT" | while read file; do
        echo "   📁 $file"
        ls -la "$file"
    done
else
    echo "❌ Fichier SCR-20250618-ukfp.png non trouvé"
    echo ""
    echo "🔍 Recherche de fichiers similaires..."
    find /var/www/PrimeContentMedia -name "*.png" -type f | head -10
fi

# Test 4: Vérifier les permissions
echo ""
echo "4️⃣ Vérification des permissions..."
echo "📁 Permissions du dossier principal:"
ls -ld /var/www/PrimeContentMedia/
if [ -d "/var/www/PrimeContentMedia/uploads" ]; then
    echo "📁 Permissions du dossier uploads:"
    ls -ld /var/www/PrimeContentMedia/uploads/
fi

# Test 5: Vérifier la configuration Nginx
echo ""
echo "5️⃣ Vérification de Nginx..."
echo "⚙️ Test de la configuration:"
nginx -t 2>&1

echo ""
echo "📊 Statut de Nginx:"
systemctl is-active nginx || echo "Nginx n'est pas actif"

# Test 6: Test d'accès local au fichier
echo ""
echo "6️⃣ Test d'accès local..."
echo "🌐 Test HTTP local:"
curl -s -o /dev/null -w "Code: %{http_code}\n" http://localhost/uploads/SCR-20250618-ukfp.png 2>/dev/null

echo "🔒 Test HTTPS via media.dalifilms.fr:"
curl -s -o /dev/null -w "Code: %{http_code}\n" https://media.dalifilms.fr/uploads/SCR-20250618-ukfp.png 2>/dev/null

# Test 7: Proposer des corrections
echo ""
echo "🔧 ACTIONS CORRECTIVES"
echo "====================="
echo ""
echo "✅ Si le fichier existe mais n'est pas accessible:"
echo "   sudo chown -R www-data:www-data /var/www/PrimeContentMedia/"
echo "   sudo chmod -R 755 /var/www/PrimeContentMedia/"
echo ""
echo "✅ Si le fichier n'existe pas:"
echo "   # Vérifiez votre code d'upload dans l'application"
echo "   # Le fichier devrait être dans /var/www/PrimeContentMedia/uploads/"
echo ""
echo "✅ Si Nginx a des problèmes:"
echo "   sudo nginx -s reload"
echo "   sudo systemctl restart nginx"
echo ""
echo "✅ Pour tester un fichier de test:"
echo "   echo 'Test file' > /var/www/PrimeContentMedia/uploads/test.txt"
echo "   curl https://media.dalifilms.fr/uploads/test.txt" 