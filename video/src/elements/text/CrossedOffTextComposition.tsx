import { CrossedOffText } from './crossed-off.element';
import React from 'react';

export const CrossedOffTextComposition: React.FC = () => {
	return (
		<>
			<CrossedOffText
				durationInFrames={120}
				name="Crossed Off"
				style={{ width: 900, height: 220, position: 'absolute' }}
			/>
		</>
	);
};
