import { BasicCaptions } from './basic-captions.element';
import React from 'react';

export const BasicCaptionsComposition: React.FC = () => {
	return (
		<>
			<BasicCaptions
				captions={[{
					text: 'Simple captions,ready for every video.',
					startMs: 0,
					endMs: 2200,
					timestampMs: 1100,
					confidence: null,
					pageBreakAfter: true
				}, {
					text: 'No animation,\njust clear text.',
					startMs: 2200,
					endMs: 4400,
					timestampMs: 3300,
					confidence: null,
					pageBreakAfter: true
				}, {
					text: 'Easy to read,\nand easy to customize.',
					startMs: 4400,
					endMs: 7000,
					timestampMs: 5700,
					confidence: null
				}]}
				combineTokensWithinMilliseconds={3000}
				width={900}
				durationInFrames={210}
				name="Basic Captions"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
