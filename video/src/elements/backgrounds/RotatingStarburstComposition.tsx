import { RotatingStarburst } from './rotating-starburst.element';
import React from 'react';

export const RotatingStarburstComposition: React.FC = () => {
	return (
		<>
			<RotatingStarburst
				durationInFrames={240}
				name="Rotating Starburst"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
