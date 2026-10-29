import { OnScreenMessages } from './on-screen-messages.element';
import React from 'react';

export const OnScreenMessagesComposition: React.FC = () => {
	return (
		<>
			<OnScreenMessages
				durationInFrames={162}
				name="On-Screen Messages"
				style={{ width: 1260, height: 680, position: 'absolute' }}
			/>
		</>
	);
};
