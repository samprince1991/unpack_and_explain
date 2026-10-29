import { NotebookPaper } from './notebook-paper.element';
import React from 'react';

export const NotebookPaperComposition: React.FC = () => {
	return (
		<>
			<NotebookPaper
				durationInFrames={120}
				name="Notebook Paper"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
