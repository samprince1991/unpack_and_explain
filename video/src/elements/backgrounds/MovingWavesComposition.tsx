import { MovingWaves } from './moving-waves.element';
import React from 'react';

export const MovingWavesComposition: React.FC = () => {
	return (
		<>
			<MovingWaves
				durationInFrames={240}
				name="Moving Waves"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
