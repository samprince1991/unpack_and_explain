import { YouTubeEndCard } from './youtube-end-card.element';
import React from 'react';

export const YouTubeEndCardComposition: React.FC = () => {
	return (
		<>
			<YouTubeEndCard
				durationInFrames={150}
				name="YouTube End Card"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
