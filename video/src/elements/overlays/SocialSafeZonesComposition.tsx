import { SocialSafeZones } from './social-safe-zones.element';
import React from 'react';

export const SocialSafeZonesComposition: React.FC = () => {
	return (
		<>
			<SocialSafeZones
				platform="tiktok"
				durationInFrames={120}
				name="Social Safe Zones"
				style={{ width: 1080, height: 1920, position: 'absolute' }}
			/>
		</>
	);
};
