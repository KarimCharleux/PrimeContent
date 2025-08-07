#!/bin/bash

# Vérifie la présence d'ImageMagick
if ! command -v convert &> /dev/null; then
  echo "ImageMagick (convert) n'est pas installé. Installez-le avec : brew install imagemagick"
  exit 1
fi

# Extensions d'images supportées
EXTENSIONS="jpg jpeg png JPG JPEG PNG"

# Fonction pour appliquer le watermark
apply_watermark() {
  local img="$1"
  local dir
  dir=$(dirname "$img")
  local base
  base=$(basename "$img")
  local ext="${base##*.}"
  local name="${base%.*}"
  local no_w_img="${dir}/${name}-no-w.${ext}"
  local watermarked_img="${dir}/${base}"

  # Renomme l'original
  mv "$img" "$no_w_img"

  # Applique le watermark
  convert "$no_w_img" \
    -gravity center \
    -pointsize 80 \
    -fill none -stroke black -strokewidth 2 \
    -annotate 30x30+0+0 'dalifilms' \
    -fill white -stroke none \
    -annotate 30x30+0+0 'dalifilms' \
    -tile \
    -draw "gravity center text 0,0 'dalifilms'" \
    "$watermarked_img"
}

export -f apply_watermark

# Recherche récursive des images et traitement
for ext in $EXTENSIONS; do
  find . -type f -iname "*.${ext}" ! -iname "*-no-w.*" -exec bash -c 'apply_watermark "$0"' {} \;
done

echo "✅ Watermark appliqué sur toutes les images. Les originaux sont suffixés par -no-w."