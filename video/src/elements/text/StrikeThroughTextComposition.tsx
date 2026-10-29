import { StrikeThroughText } from './strike-through.element';
import React from 'react';

export const StrikeThroughTextComposition: React.FC = () => {
	return (
		<>
			<StrikeThroughText
				durationInFrames={120}
				name="Strike Through"
				style={{ width: 900, height: 220, position: 'absolute' }}
			/>
		</>
	);
};
