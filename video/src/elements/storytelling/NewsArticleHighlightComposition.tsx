import { NewsArticleHighlight } from './news-article-highlight.element';
import React from 'react';

export const NewsArticleHighlightComposition: React.FC = () => {
	return (
		<>
			<NewsArticleHighlight
				durationInFrames={150}
				name="News Article Highlight"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
