import { HorizontalBarChart } from './horizontal-bar-chart.element';
import React from 'react';

export const HorizontalBarChartComposition: React.FC = () => {
	return (
		<>
			<HorizontalBarChart
				durationInFrames={120}
				name="Horizontal Bar Chart"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
