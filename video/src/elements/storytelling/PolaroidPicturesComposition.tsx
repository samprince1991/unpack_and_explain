import { PolaroidPictures } from './polaroid-pictures.element';
import React from 'react';

export const PolaroidPicturesComposition: React.FC = () => {
	return (
		<>
			<PolaroidPictures
				durationInFrames={150}
				name="Polaroid Pictures"
				style={{ width: 1480, height: 640, position: 'absolute' }}
			/>
		</>
	);
};
