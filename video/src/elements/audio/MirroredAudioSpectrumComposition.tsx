import { MirroredAudioSpectrum } from './mirrored-spectrum.element';
import { staticFile } from 'remotion';
import React from 'react';

export const MirroredAudioSpectrumComposition: React.FC = () => {
	return (
		<>
			<MirroredAudioSpectrum
				src={staticFile('elements/audio-oscilloscope/remotion-made-this-picture-move.mp3')}
				durationInFrames={271}
				name="Mirrored Spectrum"
				style={{ width: 900, height: 300, position: 'absolute' }}
			/>
		</>
	);
};
