export function getMediaUrl(path: string | null | undefined): string {
    // Vérification défensive pour les valeurs nulles/undefined
    if (!path || typeof path !== 'string') {
        return 'https://media.dalifilms.fr/placeholder-image.png'; // Image de placeholder par défaut
    }

    if (path.startsWith('blob:')) {
        return path;
    }

    const baseUrl = 'https://media.dalifilms.fr';

    // Assurez-vous que le chemin commence par '/'
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}
