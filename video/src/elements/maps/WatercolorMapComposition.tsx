import { WatercolorMap } from './watercolor-map.element';
import React from 'react';

export const WatercolorMapComposition: React.FC = () => {
	return (
		<>
			<WatercolorMap
				durationInFrames={200}
				name="Watercolor Map"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
