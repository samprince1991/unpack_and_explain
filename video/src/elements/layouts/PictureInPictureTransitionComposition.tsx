import { PictureInPictureTransition } from './picture-in-picture-transition.element';
import React from 'react';

export const PictureInPictureTransitionComposition: React.FC = () => {
	return (
		<>
			<PictureInPictureTransition
				durationInFrames={150}
				name="Picture in Picture Transition"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
