export function getMediaUrl(path: string): string {
    if (path.startsWith('blob:')) {
        return path;
    }

    const baseUrl = 'https://media.primecontent.fr';

    // Assurez-vous que le chemin commence par '/'
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}
