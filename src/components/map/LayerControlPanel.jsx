import React from 'react';
import { Waves } from 'lucide-react';

export default function LayerControlPanel({
  layers,
  onToggleLayer,
  baseMap,
  onBaseMapChange,
}) {
  const layerMeta = {
    spill: { label: 'Oil Spill Polygon', color: 'bg-red-500' },
    ais: { label: 'AIS Registered Vessels', color: 'bg-cyan-500' },
    platforms: { label: 'Offshore Platforms', color: 'bg-amber-500' },
    wind: { label: 'Ocean & Wind Currents', color: 'bg-green-500' },
  };

  return (
    <div className="w-[260px] h-full overflow-y-auto bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
          <Waves className="h-5 w-5 text-cyan-400" />
          <h1 className="text-xs font-bold text-slate-100 uppercase tracking-widest leading-tight">
            MARINE POLLUTION<br />MONITORING SYSTEM
          </h1>
        </div>

        <div className="mb-6">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            MAP LAYER CONTROLS
          </h2>
          <div className="space-y-2">
            {Object.entries(layerMeta).map(([key, meta]) => (
              <label
                key={key}
                className="flex items-center justify-between p-2 rounded bg-slate-950/40 border border-slate-800/60 hover:bg-slate-950/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-sm ${meta.color}`} />
                  <span className="text-xs font-medium text-slate-300">{meta.label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!layers[key]}
                  onChange={() => onToggleLayer(key)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 h-4 w-4"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            BASE MAP
          </h2>
          <div className="space-y-1.5">
            {['light', 'dark', 'satellite'].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-800/40 cursor-pointer capitalize text-xs text-slate-300"
              >
                <input
                  type="radio"
                  name="baseMap"
                  value={type}
                  checked={baseMap === type}
                  onChange={(e) => onBaseMapChange(e.target.value)}
                  className="border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 h-4 w-4"
                />
                <span>{type} Map</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-4 mt-auto">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          LEGEND
        </h2>
        <div className="space-y-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 border border-dashed border-red-500 bg-red-950/30 rounded-sm" />
            <span>Oil Spill</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 22l10-6 10 6L12 2z"/>
            </svg>
            <span>Primary Suspect</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 22l10-6 10 6L12 2z"/>
            </svg>
            <span>AIS Vessel</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 stroke-amber-500" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 22l4-8h8l4 8M2 14h20M12 14V4l3 3M12 4L9 7M12 22V14" />
            </svg>
            <span>Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 stroke-green-500" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            <span>Current Flow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
