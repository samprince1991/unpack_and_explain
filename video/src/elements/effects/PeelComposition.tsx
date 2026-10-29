import { Peel } from './peel.element';
import React from 'react';

export const PeelComposition: React.FC = () => {
	return (
		<>
			<Peel
				durationInFrames={60}
				name="Peel"
				style={{ width: 1280, height: 720, position: 'absolute' }}
			/>
		</>
	);
};
