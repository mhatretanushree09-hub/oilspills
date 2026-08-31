import React, { useMemo } from 'react';
import { Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';

export default function VesselMarker({ vessel, onSelect }) {
  const color = vessel.isSuspect ? '#f59e0b' : '#06b6d4';

  const customIcon = useMemo(() => {
    const iconHtml = `
      <div style="display: flex; justify-content: center; align-items: center; width: 32px; height: 32px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1.5" style="transform: rotate(${vessel.cog}deg); transform-origin: center; transition: transform 0.2s;">
          <path d="M12 2L2 22l10-6 10 6L12 2z"/>
        </svg>
      </div>
    `;
    return L.divIcon({
      html: iconHtml,
      className: 'vessel-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }, [vessel.cog, vessel.isSuspect, color]);

  return (
    <>
      <Marker
        position={[vessel.lat, vessel.lng]}
        icon={customIcon}
        eventHandlers={{
          click: () => onSelect && onSelect(vessel),
        }}
      >
        {vessel.isSuspect && (
          <Tooltip
            permanent
            direction="top"
            className="!bg-slate-950 !border-amber-500/40 !text-amber-400 !font-semibold !shadow-lg !rounded !px-2 !py-0.5 text-[10px]"
          >
            MMSI: {vessel.mmsi} | {vessel.sog} kn
          </Tooltip>
        )}
      </Marker>
      {vessel.isSuspect && vessel.trajectory && (
        <Polyline
          positions={vessel.trajectory}
          pathOptions={{
            color: '#facc15',
            dashArray: '4 4',
            weight: 2,
          }}
        />
      )}
    </>
  );
}
