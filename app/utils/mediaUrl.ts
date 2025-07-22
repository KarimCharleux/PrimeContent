export function getMediaUrl(path: string | null | undefined): string {
    // Vérification défensive pour les valeurs nulles/undefined
    if (!path || typeof path !== 'string') {
        return 'https://media.dalifilms.fr/placeholder-image.png'; // Image de placeholder par défaut
    }

    // Si c'est un blob ou une URL complète (http/https), la retourner directement
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const baseUrl = 'https://media.dalifilms.fr';

    // Assurez-vous que le chemin commence par '/'
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}
