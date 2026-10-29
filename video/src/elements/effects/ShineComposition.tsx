import { Shine } from './shine.element';
import React from 'react';

export const ShineComposition: React.FC = () => {
	return (
		<>
			<Shine
				durationInFrames={45}
				name="Shine"
				style={{ width: 1280, height: 720, position: 'absolute' }}
			/>
		</>
	);
};
