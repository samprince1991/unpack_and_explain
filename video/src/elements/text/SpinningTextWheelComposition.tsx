import { SpinningTextWheel } from './spinning-text-wheel.element';
import React from 'react';

export const SpinningTextWheelComposition: React.FC = () => {
	return (
		<>
			<SpinningTextWheel
				durationInFrames={120}
				name="Spinning Text Wheel"
				style={{ width: 400, height: 200, position: 'absolute' }}
			/>
		</>
	);
};
