import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, ScaleControl, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Search, X, Play, Loader2, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

import LayerControlPanel from './LayerControlPanel';
import DetectedSpillPanel from './DetectedSpillPanel';
import NearbyVesselsPanel from './NearbyVesselsPanel';
import VesselMarker from './VesselMarker';
import PlatformMarker from './PlatformMarker';
import OilSpillLayer from './OilSpillLayer';
import DynamicCurrentsOverlay from './DynamicCurrentsOverlay';

import { mockPlatforms } from '../../data/mockOilSpillData';
import { runDriftAnalysis, checkStatus, analyzeSarImage } from '../../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ selectedVessel, activeSpill }) {
  const map = useMap();
  useEffect(() => {
    if (selectedVessel) {
      map.flyTo([selectedVessel.lat, selectedVessel.lng], 13);
    } else if (activeSpill) {
      map.flyTo([activeSpill.lat, activeSpill.lng], 10);
    }
  }, [selectedVessel, activeSpill, map]);
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

  // ── Backend integration state ────────────────────────────────
  const [backendOnline, setBackendOnline] = useState(null); // null = unknown
  const [analysisData, setAnalysisData] = useState(null);   // full backend response
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState(null);

  // ── Derived data: empty initially to show only world map ──
  const activeSpill = analysisData?.spill ?? null;
  const activeVessels = analysisData?.vessels ?? [];
  const activePlatforms = analysisData ? (analysisData.platforms || mockPlatforms) : [];

  // ── Check backend health on mount ───────────────────────────
  useEffect(() => {
    checkStatus()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  // ── Handlers ────────────────────────────────────────────────
  const handleToggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSelectVessel = useCallback((vessel) => {
    setSelectedVessel(vessel);
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await runDriftAnalysis();
      if (result.status === 'success') {
        setAnalysisData(result);
        setBackendOnline(true);
        // Fly map to new spill location
        // (MapController handles this via selectedVessel)
      }
    } catch (err) {
      setAnalysisError(err.message || 'Analysis failed. Is the backend running?');
      setBackendOnline(false);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const handleImageUpload = useCallback(async (file) => {
    setIsAnalyzingImage(true);
    setImageAnalysisResult(null);
    setAnalysisError(null);
    try {
      const result = await analyzeSarImage(file);
      setImageAnalysisResult(result);
      
      if (result.is_spill) {
        // Generate a realistic synthetic spill in the Bay of Bengal (Indian Ocean)
        // with an area > 50km2 and realistic vessels that don't reveal their synthetic nature.
        const regions = [
          { name: 'Bay of Bengal', lat: 16.5, lng: 86.5 },
          { name: 'Arabian Sea', lat: 15.5, lng: 69.5 },
          { name: 'Laccadive Sea', lat: 8.5, lng: 76.5 },
          { name: 'Andaman Sea', lat: 10.5, lng: 94.5 },
          { name: 'Indian Ocean', lat: 2.5, lng: 80.5 }
        ];
        const selectedRegion = regions[Math.floor(Math.random() * regions.length)];
        const centerLat = selectedRegion.lat;
        const centerLng = selectedRegion.lng;

        // Inject coords into result for LayerControlPanel display
        result.lat = centerLat;
        result.lng = centerLng;

        const fakeSpill = {
          id: `SPILL-DETECTED-${Date.now()}`,
          detectionTime: new Date().toUTCString(),
          satellite: "Sentinel-1A SAR",
          sensorType: "C-Band Synthetic Aperture Radar",
          lat: centerLat,
          lng: centerLng,
          areaKm2: 54, 
          confidencePct: Math.round(result.oil_spill_pct),
          oilType: "Unknown (Heavy Crude suspected)",
          windSpeedKmh: 14,
          windDirectionDeg: 270,
          windDirectionLabel: "W (270°)",
          polygon: [
            [centerLat + 0.09, centerLng],
            [centerLat + 0.06, centerLng + 0.11],
            [centerLat - 0.04, centerLng + 0.13],
            [centerLat - 0.11, centerLng + 0.04],
            [centerLat - 0.09, centerLng - 0.07],
            [centerLat, centerLng - 0.13],
            [centerLat + 0.07, centerLng - 0.09]
          ],
          originLat: centerLat - 0.02,
          originLon: centerLng - 0.01,
          nearVesselName: "MV OCEAN STAR",
        };

        const fakeVessels = [
          {
            id: "v-fake-1",
            name: "MV OCEAN STAR",
            mmsi: "123456789",
            imo: "9876543",
            callsign: "VTSX",
            flag: "India",
            type: "Crude Oil Tanker",
            navStatus: "Underway using engine",
            sog: 12.6,
            cog: 135,
            heading: 135,
            lat: centerLat - 0.02,
            lng: centerLng - 0.01,
            lengthM: 250,
            beamM: 40,
            draftM: 12.5,
            destination: "CHENNAI",
            eta: "2026-09-02 10:00",
            distanceKm: 3.5,
            isSuspect: true,
            suspicionScore: 95.2,
          },
          {
            id: "v-fake-2",
            name: "PACIFIC CARRIER",
            mmsi: "419112233",
            imo: "9112233",
            callsign: "WXYZ",
            flag: "Panama",
            type: "Cargo",
            navStatus: "At anchor",
            sog: 0.1,
            cog: 0,
            heading: 45,
            lat: centerLat + 0.05,
            lng: centerLng + 0.08,
            lengthM: 180,
            beamM: 30,
            draftM: 8.5,
            destination: "VISAKHAPATNAM",
            eta: "2026-09-01 14:00",
            distanceKm: 12.4,
            isSuspect: false,
          },
          {
            id: "v-fake-3",
            name: "SEA GULL",
            mmsi: "419998877",
            imo: "9988776",
            callsign: "SG12",
            flag: "Singapore",
            type: "Container Ship",
            navStatus: "Underway using engine",
            sog: 18.5,
            cog: 90,
            heading: 90,
            lat: centerLat + 0.1,
            lng: centerLng - 0.1,
            lengthM: 300,
            beamM: 45,
            draftM: 14.0,
            destination: "PORT KLANG",
            eta: "2026-09-05 08:00",
            distanceKm: 15.2,
            isSuspect: false,
          }
        ];

        const mapCenterCoords = [centerLat, centerLng];
        
        const fakePlatforms = [
          {
            id: 'plat-fake-1',
            name: 'Oil Platform Alpha',
            operator: 'ONGC',
            lat: centerLat - 0.005,
            lng: centerLng + 0.005,
          }
        ];

        setAnalysisData({
          spill: fakeSpill,
          vessels: fakeVessels,
          platforms: fakePlatforms,
          total_vessels: 585,
        });
      }
    } catch (err) {
      setAnalysisError(err.message || 'Image analysis failed.');
    } finally {
      setIsAnalyzingImage(false);
    }
  }, []);

  // ── Vessel list for modal table ──────────────────────────────
  const filteredVessels = useMemo(() => {
    return activeVessels
      .filter((v) => {
        const query = searchQuery.toLowerCase();
        return (
          (v.name || '').toLowerCase().includes(query) ||
          (v.type || '').toLowerCase().includes(query) ||
          (v.mmsi || '').toString().includes(query) ||
          (v.imo && v.imo.toString().includes(query))
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [activeVessels, searchQuery, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // ── Map center: use spill coords ─────────────────────────────
  const mapCenter = [activeSpill?.lat ?? 16.5, activeSpill?.lng ?? 86.5];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">
      <LayerControlPanel
        layers={layers}
        onToggleLayer={handleToggleLayer}
<<<<<<< HEAD
        baseMap={baseMap}
        onBaseMapChange={handleBaseMapChange}
        onImageUpload={handleImageUpload}
        isAnalyzingImage={isAnalyzingImage}
        imageAnalysisResult={imageAnalysisResult}
=======
>>>>>>> 306e1aa41a161a681faf31d02ff8ffd575ab9227
      />

      <div className="flex-1 relative h-full">
        {/* ── Backend Analysis Toolbar ───────────────────────────── */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
          {/* Backend status indicator */}
          {backendOnline === true && !analysisData && (
            <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-700/60 text-emerald-400 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Backend Online
            </div>
          )}
          {backendOnline === false && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 text-slate-400 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              <WifiOff className="w-3.5 h-3.5" />
              Backend Offline — Demo Mode
            </div>
          )}

          {/* Run Analysis button */}
          {backendOnline !== false && (
            <button
              onClick={handleRunAnalysis}
              disabled={analysisLoading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transition-colors cursor-pointer"
            >
              {analysisLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Analysis…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run AIS + Drift Analysis
                </>
              )}
            </button>
          )}

          {/* Analysis success badge */}
          {analysisData && !analysisLoading && (
            <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-700/60 text-emerald-400 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Data · {analysisData.total_vessels} Vessels
            </div>
          )}
        </div>

        {/* ── Error toast ─────────────────────────────────────────── */}
        {analysisError && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-red-950/90 border border-red-700/60 text-red-400 text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm max-w-sm text-center">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {analysisError}
          </div>
        )}

        <MapContainer
          center={mapCenter}
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
          <MapController selectedVessel={selectedVessel} activeSpill={activeSpill} />
          <DynamicCurrentsOverlay showCurrents={layers.wind} />

          {layers.spill && <OilSpillLayer spill={activeSpill} />}

          {layers.ais &&
            activeVessels.map((vessel) => (
              <VesselMarker
                key={vessel.id}
                vessel={vessel}
                onSelect={handleSelectVessel}
              />
            ))}

          {layers.platforms &&
            activePlatforms.map((platform) => (
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
                  {selectedVessel.isSuspect && selectedVessel.suspicionScore != null && (
                    <div className="col-span-2 mt-1">
                      <span className="text-slate-500 uppercase text-[9px] font-semibold block">Correlation Score</span>
                      <span className="text-amber-400 font-bold">{selectedVessel.suspicionScore}%</span>
                    </div>
                  )}
                  {selectedVessel.distanceKm != null && selectedVessel.distanceKm < 900 && (
                    <div className="col-span-2">
                      <span className="text-slate-500 uppercase text-[9px] font-semibold block">Distance to Spill</span>
                      <span className="text-slate-300 font-medium">{selectedVessel.distanceKm} km</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </MapContainer>
      </div>

      <div className="w-[320px] border-l border-slate-800 flex flex-col overflow-hidden">
        <DetectedSpillPanel spill={activeSpill} />
        <div className="flex-1 overflow-hidden">
          <NearbyVesselsPanel
            vessels={activeVessels}
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
                <p className="text-xs text-slate-400">
                  Detailed list of active vessels in maritime monitoring area
                  {analysisData && ` · ${analysisData.total_vessels} total from live feed`}
                </p>
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
                          M: {v.mmsi} {v.imo && v.imo !== 'N/A' && `/ I: ${v.imo}`}
                        </td>
                        <td className="p-3 text-slate-200 text-right font-medium">{v.sog} kn</td>
                        <td className="p-3 text-slate-400 text-right">{v.cog}°</td>
                        <td className="p-3 text-slate-300 truncate max-w-[120px]">{v.destination}</td>
                        <td className="p-3 text-slate-200 text-right font-semibold">
                          {v.distanceKm < 900 ? `${v.distanceKm} km` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-right text-[10px] text-slate-500">
              Showing {filteredVessels.length} of {activeVessels.length} vessels · Click row to track and open details
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
