import { SpinningGlobe } from './spinning-globe.element';
import { staticFile } from 'remotion';
import React from 'react';

export const SpinningGlobeComposition: React.FC = () => {
	return (
		<>
			<SpinningGlobe
				src={staticFile('elements/spinning-globe/earth.jpg')}
				durationInFrames={240}
				name="Spinning Globe"
				style={{ width: 840, height: 840, position: 'absolute' }}
			/>
		</>
	);
};
