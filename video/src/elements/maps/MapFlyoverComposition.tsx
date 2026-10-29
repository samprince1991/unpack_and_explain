import { MapFlyover } from './map-flyover.element';
import React from 'react';

export const MapFlyoverComposition: React.FC = () => {
	return (
		<>
			<MapFlyover
				durationInFrames={285}
				name="A-to-B Map Flyover"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
