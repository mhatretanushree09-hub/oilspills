import React from 'react';
import { Polygon, Tooltip } from 'react-leaflet';

export default function OilSpillLayer({ spill }) {
  if (!spill || !spill.polygon) return null;

  return (
    <Polygon
      positions={spill.polygon}
      pathOptions={{
        color: '#ef4444',
        weight: 2,
        dashArray: '6 6',
        fillColor: '#7f1d1d',
        fillOpacity: 0.35,
      }}
    >
      <Tooltip
        permanent
        direction="center"
        className="!bg-slate-950/90 !border-red-500/40 !text-red-400 !font-semibold !shadow-lg !rounded !px-2 !py-1 text-xs whitespace-nowrap"
      >
        Detected Oil Spill · Area: {spill.areaKm2} km²
      </Tooltip>
    </Polygon>
  );
}
