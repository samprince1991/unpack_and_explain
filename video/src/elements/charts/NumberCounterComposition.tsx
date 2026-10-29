import { NumberCounter } from './number-counter.element';
import React from 'react';

export const NumberCounterComposition: React.FC = () => {
	return (
		<>
			<NumberCounter
				durationInFrames={120}
				name="Number Counter"
				style={{ width: 640, height: 200, position: 'absolute' }}
			/>
		</>
	);
};
