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

        // Faire la requête vers le serveur de médias
        const response = await fetch(fullUrl, {
            headers: {
                'User-Agent': 'DaliFilms-App/1.0',
            },
        });

        if (!response.ok) {
            console.error(
                `Erreur lors du téléchargement: ${response.status} ${response.statusText}`,
            );
            return NextResponse.json(
                { error: `Impossible de télécharger le fichier: ${response.status}` },
                { status: response.status },
            );
        }

        // Récupérer le blob du fichier
        const blob = await response.blob();

        // Déterminer le type de contenu
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // Créer une réponse avec le fichier
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${mediaPath.split('/').pop() || 'media'}"`,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
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
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
