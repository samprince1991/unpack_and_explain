import { CylinderText } from './cylinder-text.element';
import React from 'react';

export const CylinderTextComposition: React.FC = () => {
	return (
		<>
			<CylinderText
				durationInFrames={180}
				name="Cylinder Text"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
