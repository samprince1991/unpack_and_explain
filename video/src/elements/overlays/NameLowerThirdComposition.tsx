import { NameLowerThird } from './name-lower-third.element';
import React from 'react';

export const NameLowerThirdComposition: React.FC = () => {
	return (
		<>
			<NameLowerThird
				durationInFrames={120}
				name="Name Lower Third"
				style={{ width: 534, height: 132, position: 'absolute' }}
			/>
		</>
	);
};
