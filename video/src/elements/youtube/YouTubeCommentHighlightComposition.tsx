import { YouTubeCommentHighlight } from './youtube-comment-highlight.element';
import React from 'react';

export const YouTubeCommentHighlightComposition: React.FC = () => {
	return (
		<>
			<YouTubeCommentHighlight
				durationInFrames={180}
				name="YouTube Comment Highlight"
				style={{ width: 1120, height: 360, position: 'absolute' }}
			/>
		</>
	);
};
