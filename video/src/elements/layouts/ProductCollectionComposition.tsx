import { ProductCollection } from './product-collection.element';
import React from 'react';

export const ProductCollectionComposition: React.FC = () => {
	return (
		<>
			<ProductCollection
				durationInFrames={150}
				name="Rotating Cards"
				style={{ width: 1020, height: 1020, position: 'absolute' }}
			/>
		</>
	);
};
