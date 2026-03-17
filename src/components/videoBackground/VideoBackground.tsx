// Imports Libraries
import React, { useEffect, useMemo, useState } from 'react';
import { useBackground } from '@/background/BackgroundContext';
import { publicPath } from '@/utils/publicPath';
import './VideoBackground.css';

/**
 * VideoBackground Component
 * 
 * Soporta videos (MP4) y imágenes (GIF, PNG, JPG, WEBP) como fondo
 * 
 * @prop {string} videoSrc - Ruta al archivo de video o imagen
 * @prop {boolean} overlay - Mostrar overlay oscuro (default: true)
 * @prop {boolean} staticOverlay - Mostrar overlay cuando se renderiza la imagen estática (modo static). Si no se pasa, usa `overlay`.
 * @prop {string} imageRendering - Calidad de renderizado para imágenes:
 *   - 'auto' (default): Navegador decide la mejor calidad
 *   - 'crisp-edges': Mantiene bordes definidos, bueno para imágenes pequeñas
 *   - 'pixelated': Ideal para pixel art, mantiene los píxeles nítidos
 * @prop {string} objectFit - Cómo se ajusta la imagen/video:
 *   - 'cover' (default): Llena toda la pantalla, puede recortar
 *   - 'contain': Muestra toda la imagen, puede tener barras negras
 *   - 'fill': Estira para llenar, puede distorsionar
 *   - 'scale-down': Como contain pero nunca agranda
 * 
 * @example
 * // Para pixel art GIF
 * <VideoBackground videoSrc="/gif.gif" imageRendering="pixelated" objectFit="contain" />
 * 
 * // Para video normal
 * <VideoBackground videoSrc="/video.mp4" overlay={true} />
 * 
 * // Para imagen normal con mejor calidad
 * <VideoBackground videoSrc="/image.jpg" imageRendering="crisp-edges" objectFit="cover" />
 */

export interface VideoBackgroundProps {
    videoSrc: string;
    overlay?: boolean;
    /** Overlay for the static image fallback (when BackgroundContext mode === 'static'). Defaults to `overlay`. */
    staticOverlay?: boolean;
    imageRendering?: 'auto' | 'crisp-edges' | 'pixelated';
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
    /** Optional static override when navbar is set to static mode */
    staticSrc?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
    videoSrc, 
    overlay = true,
    staticOverlay,
    imageRendering = 'auto',
    objectFit = 'cover',
    staticSrc
}) => {

    const { mode } = useBackground();
    const [staticIndex, setStaticIndex] = useState(0);
    const [staticUnavailable, setStaticUnavailable] = useState(false);
    const [staticLoaded, setStaticLoaded] = useState(false);
    const [resolvedStaticSrc, setResolvedStaticSrc] = useState<string>('');

    const staticCandidates = useMemo(() => {
        // Preferred placeholder image for static & preloading modes.
        // Keep defaults pointing to files that exist in /public.
        const preferredRaw = staticSrc || '/assets/img/background-1-1600.webp';
        const preferred = (preferredRaw.startsWith('/') ? publicPath(preferredRaw) : preferredRaw);
        return [
            preferred,
            publicPath('/assets/img/background-1-1600.jpg'),
            publicPath('/assets/img/background-1.jpg'),
            publicPath('/assets/img/background.png'),
        ];
    }, [staticSrc]);

    useEffect(() => {
        // Reset placeholder selection whenever mode or source changes.
        setStaticIndex(0);
        setStaticUnavailable(false);
        setStaticLoaded(false);
        setResolvedStaticSrc('');
    }, [mode, videoSrc]);

    useEffect(() => {
        // Warm the cache for static mode so toggling is instant.
        // Only preload the preferred candidate to avoid downloading large fallbacks up-front.
        const src = staticCandidates[0];
        if (!src) return;
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
    }, [staticCandidates]);

    useEffect(() => {
        if (mode !== 'static') return;

        let cancelled = false;

        const tryLoad = async (src: string) => {
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.decoding = 'async';
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('load error'));
                img.src = src;
            });
        };

        (async () => {
            for (let i = 0; i < staticCandidates.length; i++) {
                const src = staticCandidates[i];
                try {
                    await tryLoad(src);
                    if (cancelled) return;
                    setResolvedStaticSrc(src);
                    setStaticLoaded(true);
                    setStaticIndex(i);
                    return;
                } catch {
                    // try next
                }
            }
            if (!cancelled) setStaticUnavailable(true);
        })();

        return () => {
            cancelled = true;
        };
    }, [mode, staticCandidates]);

    const resolvedVideoSrc = videoSrc.startsWith('/') ? publicPath(videoSrc) : videoSrc;
    const isImage = /\.(gif|png|jpe?g|webp)$/i.test(resolvedVideoSrc);
    
    const imageRenderingClass =
        imageRendering === 'pixelated'
            ? 'vb-image-render-pixel'
            : imageRendering === 'crisp-edges'
              ? 'vb-image-render-crisp'
              : 'vb-image-render-auto';
    
    const objectFitClass = `object-${objectFit}`;

    const wantsStatic = mode === 'static';
    const shouldShowStatic = wantsStatic && staticLoaded && !staticUnavailable;
    const staticToUse = resolvedStaticSrc || staticCandidates[Math.min(staticIndex, staticCandidates.length - 1)];

    // When user toggles to static, keep the overlay behavior consistent even while we preload.
    const overlayToUse = wantsStatic ? (staticOverlay ?? overlay) : overlay;
    
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
            {/* Background - Video o Imagen */}
            {shouldShowStatic ? (
                <img
                    src={staticToUse}
                    alt=""
                    aria-hidden="true"
                    className={`absolute top-0 left-0 h-full w-full ${objectFitClass} ${imageRenderingClass}`}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onError={() => {
                        setStaticIndex((i) => {
                            const next = i + 1;
                            if (next < staticCandidates.length) return next;
                            setStaticUnavailable(true);
                            return i;
                        });
                    }}
                />
            ) : isImage ? (
                <img
                    src={resolvedVideoSrc}
                    alt=""
                    aria-hidden="true"
                    className={`absolute top-0 left-0 h-full w-full ${objectFitClass} ${imageRenderingClass}`}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                />
            ) : (
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className={`absolute top-0 left-0 h-full w-full ${objectFitClass}`}
                >
                    <source src={resolvedVideoSrc} type="video/mp4" />
                </video>
            )}
            
            {/* Dark Overlay for better text readability */}
            {overlayToUse && (
                <>
                    {/* Primary dark overlay */}
                    <div className={`absolute inset-0 bg-black/60`}></div>
                    
                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/70"></div>
                </>
            )}
        </div>
    );
};

export default VideoBackground;
