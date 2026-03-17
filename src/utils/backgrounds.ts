/**
 * Utilidad para obtener fondos aleatorios
 * 
 * Puede usarse directamente con el componente VideoBackground:
 * 
 * @example
 * import { getRandomBackground } from '@/utils/backgrounds';
 * import VideoBackground from '@/components/videoBackground/VideoBackground';
 * 
 * const randomBg = getRandomBackground();
 * <VideoBackground videoSrc={randomBg} overlay={true} />
 */

/**
 * Lista de fondos disponibles (videos, GIFs, imágenes)
 * Puedes agregar más fondos a este array
 */
import { publicPath } from '@/utils/publicPath';

const backgrounds = [
    'assets/video/background.mp4',
    'assets/video/background2.mp4',
    'assets/video/background3.mp4',
    'assets/video/background4.mp4',
    'assets/video/background5.gif',
    'assets/video/background6.gif',
    'assets/video/background7.gif',
    'assets/video/background8.gif',
    'assets/video/background9.gif',
    'assets/video/background10.gif',
    'assets/video/background11.gif',
].map(publicPath);

/**
 * Obtiene un fondo aleatorio de la lista
 * @returns {string} Path/URL del fondo aleatorio
 */
export const getRandomBackground = (): string => {
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    return backgrounds[randomIndex];
};

/**
 * Obtiene un fondo aleatorio con opciones avanzadas
 * @param options Opciones de filtrado
 * @returns {string} Path/URL del fondo aleatorio
 */
export const getRandomBackgroundAdvanced = (options?: {
    type?: 'video' | 'image' | 'gif';
    exclude?: string[];
}): string => {
    let filtered = backgrounds;

    // Filtrar por tipo si se especifica
    if (options?.type === 'video') {
        filtered = backgrounds.filter(bg => bg.endsWith('.mp4') || bg.endsWith('.webm'));
    } else if (options?.type === 'gif') {
        filtered = backgrounds.filter(bg => bg.endsWith('.gif'));
    } else if (options?.type === 'image') {
        filtered = backgrounds.filter(bg => 
            bg.endsWith('.jpg') || bg.endsWith('.jpeg') || 
            bg.endsWith('.png') || bg.endsWith('.webp')
        );
    }

    // Excluir fondos específicos
    if (options?.exclude && options.exclude.length > 0) {
        filtered = filtered.filter(bg => !options.exclude!.includes(bg));
    }

    // Si no quedan fondos después del filtrado, usar todos
    if (filtered.length === 0) {
        filtered = backgrounds;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
};

/**
 * Obtiene todos los fondos disponibles
 * @returns {string[]} Array con todos los paths/URLs de fondos
 */
export const getAllBackgrounds = (): string[] => {
    return [...backgrounds];
};
