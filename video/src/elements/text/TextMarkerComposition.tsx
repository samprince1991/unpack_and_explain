import { TextMarker } from './text-marker.element';
import React from 'react';

export const TextMarkerComposition: React.FC = () => {
	return (
		<>
			<TextMarker
				durationInFrames={120}
				name="Text Marker"
				style={{ width: 900, height: 220, position: 'absolute' }}
			/>
		</>
	);
};
