import React, { useMemo } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

export default function PlatformMarker({ platform }) {
  const customIcon = useMemo(() => {
    const iconHtml = `
      <div style="display: flex; justify-content: center; align-items: center; width: 32px; height: 32px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 22l4-8h8l4 8" />
          <path d="M2 14h20" />
          <path d="M12 14V4l3 3M12 4L9 7" />
          <path d="M12 22V14" />
        </svg>
      </div>
    `;
    return L.divIcon({
      html: iconHtml,
      className: 'platform-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }, []);

  return (
    <Marker position={[platform.lat, platform.lng]} icon={customIcon}>
      <Popup className="platform-popup-container">
        <div className="bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-800 w-48 -m-3 shadow-xl">
          <h3 className="font-bold text-sm text-slate-100">{platform.name}</h3>
          <p className="text-xs text-slate-400 mt-1">Operator: {platform.operator}</p>
          <div className="text-[10px] text-slate-500 mt-2 font-mono">
            {platform.lat.toFixed(4)}° N, {platform.lng.toFixed(4)}° E
          </div>
        </div>
      </Popup>
      <Tooltip
        permanent
        direction="bottom"
        className="!bg-slate-950 !border-slate-800/80 !text-slate-300 !shadow-md !rounded !px-1.5 !py-0.5 text-[10px] !mt-2"
      >
        {platform.name}
      </Tooltip>
    </Marker>
  );
}
