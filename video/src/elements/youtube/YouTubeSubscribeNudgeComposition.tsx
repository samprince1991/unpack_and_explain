import { YouTubeSubscribeNudge } from './youtube-subscribe-nudge.element';
import { staticFile } from 'remotion';
import React from 'react';

export const YouTubeSubscribeNudgeComposition: React.FC = () => {
	return (
		<>
			<YouTubeSubscribeNudge
				clickSrc={staticFile('elements/youtube-subscribe-nudge/mouse-click.wav')}
				dingSrc={staticFile('elements/youtube-subscribe-nudge/ding.wav')}
				avatarSrc={staticFile('elements/youtube-subscribe-nudge/remotion-logo.png')}
				durationInFrames={120}
				name="YouTube Subscribe Nudge"
				style={{ width: 760, height: 240, position: 'absolute' }}
			/>
		</>
	);
};
