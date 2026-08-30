import React from 'react';

export default function DetectedSpillPanel({ spill }) {
  if (!spill) return null;

  return (
    <div className="bg-slate-900/60 p-4 border-b border-slate-800">
      <h2 className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-4">
        DETECTED SPILL
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
        <div>
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Detection ID</dt>
          <dd className="text-slate-100 text-xs font-mono font-medium mt-0.5 break-all">{spill.id}</dd>
        </div>
        <div>
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Detection Time</dt>
          <dd className="text-slate-100 text-xs font-medium mt-0.5">{spill.detectionTime}</dd>
        </div>
        <div>
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Satellite</dt>
          <dd className="text-slate-100 text-xs font-medium mt-0.5">{spill.satellite}</dd>
        </div>
        <div>
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Position</dt>
          <dd className="text-slate-100 text-xs font-medium mt-0.5 font-mono">
            {spill.lat.toFixed(4)}° N, {spill.lng.toFixed(4)}° E
          </dd>
        </div>
        <div>
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Area</dt>
          <dd className="text-slate-100 text-xs font-medium mt-0.5">{spill.areaKm2} km²</dd>
        </div>
        <div>
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Confidence</dt>
          <dd className="mt-1">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full text-[10px] inline-block">
              {spill.confidencePct}%
            </span>
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Oil Type</dt>
          <dd className="text-slate-100 text-xs font-medium mt-0.5">{spill.oilType}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Wind</dt>
          <dd className="text-slate-100 text-xs font-medium mt-0.5">
            {spill.windSpeedKmh} km/h ({spill.windDirectionLabel})
          </dd>
        </div>
      </dl>
    </div>
  );
}
