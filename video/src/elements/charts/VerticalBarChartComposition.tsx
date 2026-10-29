import { VerticalBarChart } from './vertical-bar-chart.element';
import React from 'react';

export const VerticalBarChartComposition: React.FC = () => {
	return (
		<>
			<VerticalBarChart
				durationInFrames={120}
				name="Vertical Bar Chart"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
