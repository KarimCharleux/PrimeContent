import fs from 'fs';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Configuration pour la production et le développement
const MEDIA_ROOT =
    process.env.NODE_ENV === 'production'
        ? '/var/www/PrimeContentMedia'
        : path.join(process.cwd(), 'public');

const CACHE_DIR =
    process.env.NODE_ENV === 'production'
        ? '/var/www/PrimeContentMedia/cache/watermarked'
        : path.join(process.cwd(), 'public/cache/watermarked');

// Configuration des chemins selon l'environnement

// Configuration du watermark
const WATERMARK_CONFIG = {
    text: '© DALI FILMS',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 6,
};

// Créer le dossier de cache s'il n'existe pas
function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
}

// Générer un nom de fichier cache basé sur le chemin et la position
function getCacheFileName(imagePath: string, position: string): string {
    const hash = Buffer.from(`${imagePath}-${position}`).toString('base64url');
    return `${hash}.webp`;
}

// Créer un SVG watermark
function createWatermarkSVG(
    text: string,
    position: string,
    imageWidth: number,
    imageHeight: number,
): string {
    const config = WATERMARK_CONFIG;

    // Calculer la position en fonction des dimensions de l'image
    let x, y, anchor;
    const margin = 20;

    switch (position) {
        case 'top-left':
            x = margin;
            y = margin + config.fontSize;
            anchor = 'start';
            break;
        case 'top-right':
            x = imageWidth - margin;
            y = margin + config.fontSize;
            anchor = 'end';
            break;
        case 'bottom-left':
            x = margin;
            y = imageHeight - margin;
            anchor = 'start';
            break;
        case 'bottom-right':
            x = imageWidth - margin;
            y = imageHeight - margin;
            anchor = 'end';
            break;
        case 'center':
            x = imageWidth / 2;
            y = imageHeight / 2;
            anchor = 'middle';
            break;
        default:
            x = imageWidth - margin;
            y = imageHeight - margin;
            anchor = 'end';
    }

    return `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
        </filter>
      </defs>
      
      <!-- Fond du watermark avec blur -->
      <rect x="${x - (anchor === 'end' ? 120 : anchor === 'middle' ? 60 : 0)}" 
            y="${y - config.fontSize - config.padding / 2}" 
            width="120" 
            height="${config.fontSize + config.padding}" 
            rx="${config.borderRadius}" 
            fill="${config.backgroundColor}" 
            filter="url(#blur)" />
      
      <!-- Texte du watermark -->
      <text x="${x}" y="${y}" 
            font-family="${config.fontFamily}" 
            font-size="${config.fontSize}" 
            font-weight="600"
            fill="${config.color}" 
            text-anchor="${anchor}" 
            letter-spacing="0.5px">
        ${text}
      </text>
    </svg>
  `;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imagePath = searchParams.get('path');
        const position = searchParams.get('position') || 'bottom-right';
        const quality = parseInt(searchParams.get('quality') || '90');

        if (!imagePath) {
            return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
        }

        // Nettoyer et sécuriser le chemin
        const cleanPath = imagePath.replace(/^\/+/, '').replace(/\.\.+/g, '');
        const fullImagePath = path.join(MEDIA_ROOT, cleanPath);

        // Vérifier que le fichier existe
        if (!fs.existsSync(fullImagePath)) {
            return NextResponse.json(
                {
                    error: 'Image not found',
                    path: cleanPath,
                },
                { status: 404 },
            );
        }

        // Vérifier le type de fichier
        const ext = path.extname(fullImagePath).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
            return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
        }

        // Créer le dossier de cache
        ensureCacheDir();

        // Vérifier le cache
        const cacheFileName = getCacheFileName(cleanPath, position);
        const cacheFilePath = path.join(CACHE_DIR, cacheFileName);

        // Vérifier si la version cachée existe et est plus récente que l'original
        const originalStat = fs.statSync(fullImagePath);
        if (fs.existsSync(cacheFilePath)) {
            const cacheStat = fs.statSync(cacheFilePath);
            if (cacheStat.mtime > originalStat.mtime) {
                // Servir depuis le cache
                const cachedImage = fs.readFileSync(cacheFilePath);
                return new NextResponse(cachedImage, {
                    headers: {
                        'Content-Type': 'image/webp',
                        'Cache-Control': 'public, max-age=31536000, immutable',
                        'X-Cache': 'HIT',
                    },
                });
            }
        }

        // Traiter l'image avec Sharp
        const image = sharp(fullImagePath);
        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) {
            return NextResponse.json({ error: 'Invalid image metadata' }, { status: 400 });
        }

        // Créer le watermark SVG
        const watermarkSVG = createWatermarkSVG(
            WATERMARK_CONFIG.text,
            position,
            metadata.width,
            metadata.height,
        );

        // Appliquer le watermark
        const watermarkedImage = await image
            .composite([
                {
                    input: Buffer.from(watermarkSVG),
                    top: 0,
                    left: 0,
                },
            ])
            .webp({ quality })
            .toBuffer();

        // Sauvegarder dans le cache
        try {
            fs.writeFileSync(cacheFilePath, watermarkedImage);
        } catch (error) {
            console.warn('Failed to write to cache:', error);
        }

        // Retourner l'image avec watermark
        return new NextResponse(watermarkedImage, {
            headers: {
                'Content-Type': 'image/webp',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Cache': 'MISS',
            },
        });
    } catch (error) {
        console.error('Error processing image with watermark:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details:
                    process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
            },
            { status: 500 },
        );
    }
}

// Endpoint pour vider le cache
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clearAll = searchParams.get('all') === 'true';

        if (clearAll) {
            // Vider tout le cache
            if (fs.existsSync(CACHE_DIR)) {
                const files = fs.readdirSync(CACHE_DIR);
                let deleted = 0;

                for (const file of files) {
                    try {
                        fs.unlinkSync(path.join(CACHE_DIR, file));
                        deleted++;
                    } catch (error) {
                        console.warn(`Failed to delete cache file ${file}:`, error);
                    }
                }

                return NextResponse.json({
                    message: `Cache cleared successfully. ${deleted} files deleted.`,
                });
            } else {
                return NextResponse.json({ message: 'Cache directory does not exist' });
            }
        } else {
            const imagePath = searchParams.get('path');
            if (!imagePath) {
                return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
            }

            // Supprimer les versions cachées de cette image
            const cleanPath = imagePath.replace(/^\/+/, '').replace(/\.\.+/g, '');
            const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
            let deleted = 0;

            for (const position of positions) {
                const cacheFileName = getCacheFileName(cleanPath, position);
                const cacheFilePath = path.join(CACHE_DIR, cacheFileName);

                if (fs.existsSync(cacheFilePath)) {
                    try {
                        fs.unlinkSync(cacheFilePath);
                        deleted++;
                    } catch (error) {
                        console.warn(`Failed to delete cache file ${cacheFileName}:`, error);
                    }
                }
            }

            return NextResponse.json({
                message: `Cache cleared for image. ${deleted} variants deleted.`,
            });
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
    }
}
