import { SlideToSplitScreen } from './slide-to-split-screen.element';
import React from 'react';

export const SlideToSplitScreenComposition: React.FC = () => {
	return (
		<>
			<SlideToSplitScreen
				durationInFrames={150}
				name="Slide to Split Screen"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
