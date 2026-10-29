import { ProductDiscountCallout } from './product-discount-callout.element';
import React from 'react';

export const ProductDiscountCalloutComposition: React.FC = () => {
	return (
		<>
			<ProductDiscountCallout
				durationInFrames={120}
				name="Wiggling Callout"
				style={{ width: 760, height: 760, position: 'absolute' }}
			/>
		</>
	);
};
