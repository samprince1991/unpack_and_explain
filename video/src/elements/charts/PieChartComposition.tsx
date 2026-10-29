import { PieChart } from './pie-chart.element';
import React from 'react';

export const PieChartComposition: React.FC = () => {
	return (
		<>
			<PieChart
				durationInFrames={120}
				name="Pie Chart"
				style={{ position: 'absolute' }}
			/>
		</>
	);
};
