import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, ScaleControl, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Search, X } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

import LayerControlPanel from './LayerControlPanel';
import DetectedSpillPanel from './DetectedSpillPanel';
import NearbyVesselsPanel from './NearbyVesselsPanel';
import VesselMarker from './VesselMarker';
import PlatformMarker from './PlatformMarker';
import OilSpillLayer from './OilSpillLayer';
import DynamicCurrentsOverlay from './DynamicCurrentsOverlay';

import { mockSpill, mockVessels, mockPlatforms } from '../../data/mockOilSpillData';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ selectedVessel }) {
  const map = useMap();
  useEffect(() => {
    if (selectedVessel) {
      map.flyTo([selectedVessel.lat, selectedVessel.lng], 13);
    }
  }, [selectedVessel, map]);
  return null;
}

export default function MapView() {
  const [layers, setLayers] = useState({
    spill: true,
    ais: true,
    platforms: true,
    wind: true,
  });

  const [selectedVessel, setSelectedVessel] = useState(null);
  const [isVesselListOpen, setIsVesselListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('distanceKm');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleToggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSelectVessel = useCallback((vessel) => {
    setSelectedVessel(vessel);
  }, []);



  const filteredVessels = useMemo(() => {
    return mockVessels
      .filter((v) => {
        const query = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(query) ||
          v.type.toLowerCase().includes(query) ||
          v.mmsi.includes(query) ||
          (v.imo && v.imo.includes(query))
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [searchQuery, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">
      <LayerControlPanel
        layers={layers}
        onToggleLayer={handleToggleLayer}
      />

      <div className="flex-1 relative h-full">
        <MapContainer
          center={[16.5000, 86.5000]}
          zoom={11}
          className="h-full w-full"
          zoomControl={true}
          maxZoom={20}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            maxNativeZoom={20}
            maxZoom={20}
          />

          <ScaleControl position="bottomleft" imperial={false} />
          <MapController selectedVessel={selectedVessel} />
          <DynamicCurrentsOverlay showCurrents={layers.wind} />

          {layers.spill && <OilSpillLayer spill={mockSpill} />}

          {layers.ais &&
            mockVessels.map((vessel) => (
              <VesselMarker
                key={vessel.id}
                vessel={vessel}
                onSelect={handleSelectVessel}
              />
            ))}

          {layers.platforms &&
            mockPlatforms.map((platform) => (
              <PlatformMarker key={platform.id} platform={platform} />
            ))}

          {selectedVessel && (
            <Popup
              position={[selectedVessel.lat, selectedVessel.lng]}
              onClose={() => setSelectedVessel(null)}
              className="vessel-popup-container"
            >
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg border border-slate-800 w-64 -m-3 shadow-xl select-text">
                <div className="border-b border-slate-800 pb-2 mb-2">
                  <h3 className="font-bold text-sm text-slate-100">{selectedVessel.name}</h3>
                  <p className="text-xs text-slate-400">{selectedVessel.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">IMO</span>
                    <span className="text-slate-300 font-medium">{selectedVessel.imo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">MMSI</span>
                    <span className="text-slate-300 font-medium">{selectedVessel.mmsi || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Callsign</span>
                    <span className="text-slate-300 font-medium">{selectedVessel.callsign || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Flag</span>
                    <span className="text-slate-300 font-medium">{selectedVessel.flag || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Nav Status</span>
                    <span className="text-slate-300 font-medium truncate block">{selectedVessel.navStatus || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">SOG</span>
                    <span className="text-slate-300 font-medium">{selectedVessel.sog !== undefined ? `${selectedVessel.sog} kn` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">COG</span>
                    <span className="text-slate-300 font-medium">{selectedVessel.cog !== undefined ? `${selectedVessel.cog}°` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Draft</span>
                    <span className="text-slate-300 font-medium">{selectedVessel.draftM !== undefined ? `${selectedVessel.draftM} m` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">ETA</span>
                    <span className="text-slate-300 font-medium truncate block">{selectedVessel.eta || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Destination</span>
                    <span className="text-slate-300 font-medium truncate block">{selectedVessel.destination || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </MapContainer>
      </div>

      <div className="w-[320px] border-l border-slate-800 flex flex-col overflow-hidden">
        <DetectedSpillPanel spill={mockSpill} />
        <div className="flex-1 overflow-hidden">
          <NearbyVesselsPanel
            vessels={mockVessels}
            onSelectVessel={handleSelectVessel}
            onViewFullList={() => setIsVesselListOpen(true)}
          />
        </div>
      </div>

      {isVesselListOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div>
                <h3 className="font-bold text-slate-100 text-base">AIS REGISTERED VESSELS</h3>
                <p className="text-xs text-slate-400">Detailed list of active vessels in maritime monitoring area</p>
              </div>
              <button 
                onClick={() => setIsVesselListOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, MMSI, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-3 cursor-pointer select-none hover:text-slate-200" onClick={() => toggleSort('name')}>
                      Vessel Name {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:text-slate-200" onClick={() => toggleSort('type')}>
                      Type {sortField === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-3">MMSI / IMO</th>
                    <th className="p-3 cursor-pointer select-none hover:text-slate-200 text-right" onClick={() => toggleSort('sog')}>
                      SOG {sortField === 'sog' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-3 text-right">COG</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3 cursor-pointer select-none hover:text-slate-200 text-right" onClick={() => toggleSort('distanceKm')}>
                      Distance {sortField === 'distanceKm' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredVessels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-8 text-slate-500">
                        No vessels matching query found.
                      </td>
                    </tr>
                  ) : (
                    filteredVessels.map((v) => (
                      <tr 
                        key={v.id}
                        onClick={() => {
                          handleSelectVessel(v);
                          setIsVesselListOpen(false);
                        }}
                        className={`hover:bg-slate-800/30 cursor-pointer transition-colors ${v.isSuspect ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className="p-3 font-semibold text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${v.isSuspect ? 'bg-amber-500 animate-pulse' : 'bg-cyan-500'}`} />
                            {v.name}
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{v.type}</td>
                        <td className="p-3 text-slate-400 font-mono">
                          M: {v.mmsi} {v.imo && `/ I: ${v.imo}`}
                        </td>
                        <td className="p-3 text-slate-200 text-right font-medium">{v.sog} kn</td>
                        <td className="p-3 text-slate-400 text-right">{v.cog}°</td>
                        <td className="p-3 text-slate-300 truncate max-w-[120px]">{v.destination}</td>
                        <td className="p-3 text-slate-200 text-right font-semibold">{v.distanceKm} km</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-right text-[10px] text-slate-500">
              Showing {filteredVessels.length} of {mockVessels.length} vessels · Click row to track and open details
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
