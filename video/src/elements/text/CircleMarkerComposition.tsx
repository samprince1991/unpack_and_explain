import { CircleMarker } from './circle-marker.element';
import React from 'react';

export const CircleMarkerComposition: React.FC = () => {
	return (
		<>
			<CircleMarker
				durationInFrames={120}
				name="Circle Marker"
				style={{ width: 900, height: 220, position: 'absolute' }}
			/>
		</>
	);
};
