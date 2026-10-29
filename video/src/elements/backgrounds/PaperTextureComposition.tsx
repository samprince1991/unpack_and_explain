import { PaperTexture } from './paper-texture.element';
import React from 'react';

export const PaperTextureComposition: React.FC = () => {
	return (
		<>
			<PaperTexture
				durationInFrames={120}
				name="Paper Texture"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
