import { Tear } from './tear.element';
import React from 'react';

export const TearComposition: React.FC = () => {
	return (
		<>
			<Tear
				durationInFrames={45}
				name="Tear apart"
				style={{ width: 1280, height: 720, position: 'absolute' }}
			/>
		</>
	);
};
