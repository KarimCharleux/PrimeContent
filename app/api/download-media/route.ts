import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const mediaPath = searchParams.get('path');

        if (!mediaPath) {
            return NextResponse.json({ error: 'Le paramètre path est requis' }, { status: 400 });
        }

        // Construire l'URL complète du média
        const MEDIA_BASE_URL = 'https://media.primecontent.fr';
        const cleanPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
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
                `Erreur lors du téléchargement: ${response.status} ${response.statusText}`,
            );
            return NextResponse.json(
                { error: `Impossible de télécharger le fichier: ${response.status}` },
                { status: response.status },
            );
        }

        // Récupérer le flux binaire de la réponse origin
        const readableStream = response.body;
        if (!readableStream) {
            console.error('Réponse origin sans corps/stream');
            return NextResponse.json({ error: 'Flux de données indisponible' }, { status: 502 });
        }

        // Propager les headers importants
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentLength = response.headers.get('content-length') || undefined;
        const contentDisposition =
            response.headers.get('content-disposition') ||
            `inline; filename="${cleanPath.split('/').pop() || 'media'}"`;
        const acceptRanges = response.headers.get('accept-ranges') || 'bytes';

        return new NextResponse(readableStream as any, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
                ...(contentLength ? { 'Content-Length': contentLength } : {}),
                'Content-Disposition': contentDisposition,
                'Accept-Ranges': acceptRanges,
                // CORS permissif pour usage via fetch sur même origine
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Range',
                // Désactiver le cache côté CDN/clients pour éviter des payloads HTML en cache
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
