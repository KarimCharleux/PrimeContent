/**
 * Génère un UUID v4 simple
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Extrait l'extension d'un nom de fichier
 */
export function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
}

/**
 * Upload un fichier avec renommage UUID pour les mariages
 */
export async function uploadFileWithUUID(
    file: File,
    path: string,
    onProgress?: (message: string) => void,
): Promise<{ fileUrl: string; filename: string; uuid: string }> {
    try {
        if (onProgress) onProgress("Préparation de l'upload...");

        // Générer un UUID et garder l'extension originale
        const uuid = generateUUID();
        const extension = getFileExtension(file.name);
        const newFilename = `${uuid}${extension}`;

        if (onProgress) onProgress('Upload en cours...');

        // Créer un nouveau fichier avec le nom UUID
        const renamedFile = new File([file], newFilename, { type: file.type });

        const formData = new FormData();
        formData.append('file', renamedFile);
        formData.append('path', path);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Erreur lors du téléchargement du fichier');
        }

        const data = await response.json();

        if (onProgress) onProgress('Upload terminé avec succès');

        return {
            fileUrl: data.fileUrl,
            filename: newFilename,
            uuid: uuid,
        };
    } catch (error) {
        console.error("Erreur lors de l'upload avec UUID:", error);
        throw error;
    }
}
