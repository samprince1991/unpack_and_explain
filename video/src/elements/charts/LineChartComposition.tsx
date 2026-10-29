import { LineChart } from './line-chart.element';
import React from 'react';

export const LineChartComposition: React.FC = () => {
	return (
		<>
			<LineChart
				durationInFrames={120}
				name="Line Chart"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
