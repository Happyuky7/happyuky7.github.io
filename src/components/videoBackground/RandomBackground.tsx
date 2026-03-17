import React from 'react';
import VideoBackground from './VideoBackground';
import { getRandomBackground } from '@/utils/backgrounds';

/**
 * Component that renders a VideoBackground with a random background
 * 
 * @example
 * <RandomBackground overlay={true} />
 */

interface RandomBackgroundProps {
    overlay?: boolean;
    imageRendering?: 'auto' | 'crisp-edges' | 'pixelated';
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
}

const RandomBackground: React.FC<RandomBackgroundProps> = ({ 
    overlay = true,
    imageRendering = 'auto',
    objectFit = 'cover'
}) => {
    // Get a random background only once when the component mounts
    const [selectedBackground] = React.useState(() => getRandomBackground());

    return (
        <VideoBackground 
            videoSrc={selectedBackground} 
            overlay={overlay}
            imageRendering={imageRendering}
            objectFit={objectFit}
        />
    );
};

export default RandomBackground;

// Re-export the utility functions for greater convenience
export { getRandomBackground, getRandomBackgroundAdvanced, getAllBackgrounds } from '@/utils/backgrounds';
