import React, { useMemo } from 'react';

export default function NearbyVesselsPanel({ vessels = [], onSelectVessel, onViewFullList }) {
  const sortedVessels = useMemo(() => {
    return [...vessels].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [vessels]);

  const shipIconSvg = (color) => (
    <svg className="w-5 h-5 flex-shrink-0" fill={color} viewBox="0 0 24 24">
      <path d="M12 2L2 22l10-6 10 6L12 2z" />
    </svg>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900/40">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">
          NEARBY VESSELS
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedVessels.length === 0 ? (
          <div className="text-slate-500 text-xs text-center py-8">
            No nearby vessels
          </div>
        ) : (
          sortedVessels.map((vessel) => {
            if (vessel.isSuspect) {
              return (
                <button
                  key={vessel.id}
                  onClick={() => onSelectVessel && onSelectVessel(vessel)}
                  className="w-full text-left block focus:outline-none transition-transform active:scale-[0.99]"
                >
                  <div className="border-2 border-amber-500 bg-amber-500/10 p-3 rounded-lg shadow-lg flex gap-3 items-start">
                    {shipIconSvg('#f59e0b')}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-amber-400 truncate">{vessel.name}</span>
                        <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                          {vessel.distanceKm} km
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1 font-semibold">{vessel.type}</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-2 text-[10px] text-slate-400">
                        <div>IMO: <span className="text-slate-300 font-mono">{vessel.imo}</span></div>
                        <div>MMSI: <span className="text-slate-300 font-mono">{vessel.mmsi}</span></div>
                        <div>Dim: <span className="text-slate-300">{vessel.lengthM}m × {vessel.beamM}m</span></div>
                        <div>Speed: <span className="text-slate-300">{vessel.sog} kn</span></div>
                        <div className="col-span-2 truncate">Status: <span className="text-slate-300">{vessel.navStatus}</span></div>
                      </div>
                      <div className="mt-2 text-[10px] bg-red-950/60 border border-red-500/30 text-red-400 font-bold px-2 py-0.5 rounded inline-block">
                        Suspicion Score: {vessel.suspicionScore}%
                      </div>
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={vessel.id}
                onClick={() => onSelectVessel && onSelectVessel(vessel)}
                className="w-full text-left block focus:outline-none transition-transform active:scale-[0.99]"
              >
                <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg flex gap-3 items-start hover:border-slate-600 transition-colors">
                  {shipIconSvg('#06b6d4')}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-cyan-400 truncate">{vessel.name}</span>
                      <span className="bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                        {vessel.distanceKm} km
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-medium">{vessel.type}</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-2 text-[10px] text-slate-400 font-mono">
                      <div>MMSI: <span className="text-slate-300">{vessel.mmsi}</span></div>
                      <div>Dim: <span className="text-slate-300">{vessel.lengthM}m × {vessel.beamM}m</span></div>
                      <div>Speed: <span className="text-slate-300">{vessel.sog} kn</span></div>
                      <div>Course: <span className="text-slate-300">{vessel.cog}°</span></div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onViewFullList}
          className="w-full border border-slate-700 hover:border-slate-600 hover:bg-slate-800/40 text-slate-300 hover:text-slate-200 text-xs font-semibold py-2 px-4 rounded transition-colors text-center uppercase tracking-wide cursor-pointer"
        >
          VIEW FULL VESSEL LIST →
        </button>
      </div>
    </div>
  );
}
