import { AudioOscilloscope } from './oscilloscope.element';
import { staticFile } from 'remotion';
import React from 'react';

export const AudioOscilloscopeComposition: React.FC = () => {
	return (
		<>
			<AudioOscilloscope
				src={staticFile('elements/audio-oscilloscope/remotion-made-this-picture-move.mp3')}
				durationInFrames={271}
				name="Oscilloscope"
				style={{ width: 900, height: 300, position: 'absolute' }}
			/>
		</>
	);
};
