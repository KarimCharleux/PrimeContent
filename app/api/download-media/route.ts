import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const mediaPath = searchParams.get('path');

        if (!mediaPath) {
            return NextResponse.json({ error: 'Le paramètre path est requis' }, { status: 400 });
        }

        // Construire l'URL complète du média
        const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL || 'https://media.dalifilms.fr';
        const rawCleanPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
        // Encoder le chemin pour éviter les espaces/caractères spéciaux
        const cleanPath = encodeURI(rawCleanPath);
        const fullUrl = `${MEDIA_BASE_URL}${cleanPath}`;

        // Propager éventuellement l'en-tête Range si fourni (support téléchargements partiels)
        const rangeHeader = request.headers.get('range') || undefined;

        // Requête vers le serveur de médias, en évitant tout cache
        const response = await fetch(fullUrl, {
            headers: {
                'User-Agent': 'DaliFilms-App/1.0',
                ...(rangeHeader ? { Range: rangeHeader } : {}),
                Accept: '*/*',
            },
            cache: 'no-store',
            redirect: 'follow',
        });

        if (!response.ok && response.status !== 206) {
            console.error(
                `Erreur lors du téléchargement: ${response.status} ${response.statusText} pour ${fullUrl}`,
            );
            return NextResponse.json(
                { error: `Impossible de télécharger le fichier: ${response.status}` },
                { status: response.status },
            );
        }

        // Lire entièrement la réponse en binaire pour garantir l'intégrité
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Déterminer le type de contenu
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition =
            response.headers.get('content-disposition') ||
            `inline; filename="${decodeURIComponent(rawCleanPath.split('/').pop() || 'media')}"`;
        const acceptRanges = response.headers.get('accept-ranges') || 'bytes';

        return new NextResponse(buffer, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(buffer.byteLength),
                'Content-Disposition': contentDisposition,
                'Accept-Ranges': acceptRanges,
                // CORS permissif
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Range',
                // Pas de cache
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Erreur dans download-media API:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
        },
    });
}
