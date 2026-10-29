import { SpeedLines } from './speed-lines.element';
import React from 'react';

export const SpeedLinesComposition: React.FC = () => {
	return (
		<>
			<SpeedLines
				color="#ffffff"
				durationInFrames={45}
				name="Speed Lines"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
