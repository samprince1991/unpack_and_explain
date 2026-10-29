import { LocationLowerThird } from './location-lower-third.element';
import React from 'react';

export const LocationLowerThirdComposition: React.FC = () => {
	return (
		<>
			<LocationLowerThird
				durationInFrames={120}
				name="Location Lower Third"
				style={{ width: 680, height: 138, position: 'absolute' }}
			/>
		</>
	);
};
