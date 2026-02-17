
import React, { useState, useRef, useEffect } from 'react';
import { Incident, IncidentType, TransportMode, VerificationAudit } from '../types';
import { verifyReportImage, findNearbyHospitals } from '../services/geminiService';

declare const L: any;

interface HospitalData {
  id: string;
  name: string;
  location: { lat: number, lng: number };
  address?: string;
  uri?: string;
  image?: string;
}

interface TacticalMapProps {
  incidents: Incident[];
  onManualReport: (incident: Incident) => void;
  onDeleteIncident: (id: string) => void;
}

const TacticalMap: React.FC<TacticalMapProps> = ({ incidents, onManualReport, onDeleteIncident }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [discoveredHospitals, setDiscoveredHospitals] = useState<HospitalData[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode | null>(null);
  
  // Navigation & Mission State
  const [navigationMode, setNavigationMode] = useState(false);
  const [routeDistance, setRouteDistance] = useState<string>('0.0 KM');
  const [nextTurn, setNextTurn] = useState<string>('Follow emergency corridor');
  const [eta, setEta] = useState<string>('CALC...');

  const userMarkerRef = useRef<any>(null);
  const hospitalMarkersRef = useRef<Map<string, any>>(new Map());
  const incidentMarkersRef = useRef<Map<string, any>>(new Map());
  const routeLineRef = useRef<any>(null);

  // Road-wise routing using OSRM API
  const fetchRoadRoute = async (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
    try {
      const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`);
      const data = await resp.json();
      if (data.routes && data.routes.length > 0) {
        const distKm = (data.routes[0].distance / 1000).toFixed(1);
        const timeMin = Math.ceil(data.routes[0].duration / 60);
        setRouteDistance(`${distKm} KM`);
        setEta(`${timeMin} MINS`);
        return data.routes[0].geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
      }
    } catch (e) {
      console.error("Routing Error:", e);
    }
    return [[start.lat, start.lng], [end.lat, end.lng]];
  };

  const syncLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      const { latitude, longitude } = p.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      if (mapRef.current && !navigationMode) {
        mapRef.current.setView([latitude, longitude], 15);
        updateUserMarker(latitude, longitude);
      }
    }, () => setUserLocation({ lat: 12.9716, lng: 77.5946 }));
  };

  const updateUserMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      userMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'user-marker',
          html: `<div class="relative flex items-center justify-center">
                  <div class="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping"></div>
                  <div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white">
                    <i class="fa-solid fa-location-arrow transform -rotate-45 text-[10px]"></i>
                  </div>
                </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(mapRef.current);
    }
  };

  const handleSOSScan = async (mode: TransportMode) => {
    if (!userLocation) return;
    setTransportMode(mode);
    setIsScanning(true);
    setShowSOSModal(false);
    setSelectedHospital(null);
    
    // Scan hospitals within 10km radius
    const hospitals = await findNearbyHospitals(userLocation.lat, userLocation.lng);
    setDiscoveredHospitals(hospitals);
    setIsScanning(false);

    // Clear old hospital markers
    hospitalMarkersRef.current.forEach(m => m.remove());
    hospitalMarkersRef.current.clear();

    // Place facility markers
    hospitals.forEach(h => {
      const marker = L.marker([h.location.lat, h.location.lng], {
        icon: L.divIcon({
          className: 'hosp-marker',
          html: `<div class="w-10 h-10 bg-emerald-500 rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-white transition-all transform hover:scale-125">
                   <i class="fa-solid fa-hospital"></i>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).on('click', () => handleHospitalSelect(h)).addTo(mapRef.current);
      hospitalMarkersRef.current.set(h.id, marker);
    });

    if (hospitals.length > 0) {
      const bounds = L.latLngBounds(hospitals.map(h => [h.location.lat, h.location.lng]));
      bounds.extend([userLocation.lat, userLocation.lng]);
      mapRef.current.fitBounds(bounds, { padding: [100, 100], duration: 1.5 });
    }
  };

  const handleHospitalSelect = async (h: HospitalData) => {
    setSelectedHospital(h);
    if (!userLocation) return;
    
    // Cleanup previous route
    if (routeLineRef.current) routeLineRef.current.remove();
    
    // Get actual road path
    const roadPoints = await fetchRoadRoute(userLocation, { lat: h.location.lat, lng: h.location.lng });
    
    routeLineRef.current = L.polyline(roadPoints, { 
      color: '#10b981', 
      weight: 10, 
      opacity: 0.9,
      lineJoin: 'round',
      dashArray: '1, 15', // Visual pulse effect
    }).addTo(mapRef.current);

    mapRef.current.setView([h.location.lat, h.location.lng], 16, { animate: true });
  };

  const startMission = () => {
    if (!selectedHospital || !userLocation) return;
    setNavigationMode(true);
    mapRef.current.setView([userLocation.lat, userLocation.lng], 19, { animate: true });
    setNextTurn("Proceed to emergency corridor // Exit Sector");
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([12.9716, 77.5946], 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    syncLocation();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    incidents.forEach((inc) => {
      if (incidentMarkersRef.current.has(inc.id)) return;
      const marker = L.marker([inc.locationCoords?.lat || 12.9716, inc.locationCoords?.lng || 77.5946], {
        icon: L.divIcon({
          className: 'incident-marker',
          html: `<div class="w-10 h-10 ${inc.type.includes('Collision') ? 'bg-red-600' : 'bg-amber-500'} rounded-xl border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                   <i class="fa-solid ${inc.type.includes('Collision') ? 'fa-car-burst' : 'fa-triangle-exclamation'} text-white text-xs"></i>
                 </div>`
        })
      }).addTo(mapRef.current);
      incidentMarkersRef.current.set(inc.id, marker);
    });
  }, [incidents]);

  return (
    <div className="h-[calc(100vh-140px)] w-full relative overflow-hidden bg-black rounded-[4rem] border-4 border-slate-900 shadow-2xl">
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* NAVIGATION HUD */}
      {navigationMode && selectedHospital && (
        <div className="absolute top-0 inset-x-0 z-[2000] p-6 animate-in slide-in-from-top duration-500">
           <div className="max-w-xl mx-auto bg-slate-950/90 backdrop-blur-3xl border-x-4 border-b-4 border-emerald-500 rounded-b-[3rem] p-8 shadow-[0_30px_70px_rgba(16,185,129,0.5)]">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl animate-pulse">
                       <i className="fa-solid fa-location-arrow transform -rotate-45"></i>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">MISSION ACTIVE: {transportMode?.toUpperCase()}</p>
                       <h3 className="text-2xl font-black text-white uppercase leading-tight">{nextTurn}</h3>
                    </div>
                 </div>
                 <button onClick={() => setNavigationMode(false)} className="bg-slate-900 w-10 h-10 rounded-full text-slate-500 hover:text-white transition-colors flex items-center justify-center">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>
              <div className="grid grid-cols-3 gap-6">
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Target Hub</p>
                    <p className="text-xs font-bold text-white truncate">{selectedHospital.name}</p>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Dist.</p>
                    <p className="text-xs font-bold text-emerald-500">{routeDistance}</p>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">ETA Profile</p>
                    <p className="text-xs font-bold text-white">{eta}</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* HOSPITAL FACILITY OVERLAY (Detailed) */}
      {!navigationMode && selectedHospital && (
        <div className="absolute bottom-10 left-10 z-[1500] w-[26rem] animate-in slide-in-from-left duration-500">
           <div className="bg-slate-950 border-4 border-emerald-500/30 p-8 rounded-[3.5rem] shadow-2xl space-y-6 relative overflow-hidden">
              <div className="h-44 -mx-8 -mt-8 bg-slate-900 relative">
                 <img src={selectedHospital.image} className="w-full h-full object-cover opacity-80" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                 <button onClick={() => setSelectedHospital(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black transition-all">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>
              <div className="space-y-1">
                 <span className="bg-emerald-600/20 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Facility Profile Verified</span>
                 <h3 className="text-2xl font-black text-white uppercase leading-none mt-3">{selectedHospital.name}</h3>
              </div>
              <div className="flex items-center gap-3 text-slate-400 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                 <i className="fa-solid fa-location-dot text-emerald-500"></i>
                 <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{selectedHospital.address}</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Road Distance</p>
                    <p className="text-xs text-emerald-500 font-black">{routeDistance}</p>
                 </div>
                 <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Dispatch Mode</p>
                    <p className="text-xs text-white font-black">{transportMode?.toUpperCase()}</p>
                 </div>
              </div>
              <button onClick={startMission} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-3 transition-all">
                 <i className="fa-solid fa-bolt"></i> Start Mission Navigation
              </button>
           </div>
        </div>
      )}

      {/* DISCOVERY CAROUSEL */}
      {!navigationMode && discoveredHospitals.length > 0 && !selectedHospital && (
        <div className="absolute bottom-10 inset-x-10 z-[1400] flex gap-6 overflow-x-auto pb-6 px-4 no-scrollbar">
           {discoveredHospitals.map((h) => (
             <div 
               key={h.id} 
               onClick={() => handleHospitalSelect(h)}
               className="shrink-0 w-80 bg-slate-950 border-4 border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer rounded-[3rem] overflow-hidden shadow-2xl"
             >
                <div className="h-36 bg-slate-900 relative">
                   <img src={h.image} className="w-full h-full object-cover opacity-60" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                </div>
                <div className="p-6 space-y-3">
                   <h4 className="text-lg font-black text-white uppercase truncate">{h.name}</h4>
                   <p className="text-[9px] text-slate-500 uppercase font-bold truncate">{h.address}</p>
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Click to View Routing</p>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* SCANNING RADAR */}
      {isScanning && (
        <div className="absolute inset-0 z-[2500] bg-black/70 backdrop-blur-2xl flex flex-col items-center justify-center">
           <div className="relative">
              <div className="w-64 h-64 border-4 border-emerald-500/10 rounded-full animate-ping"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-48 h-48 border-2 border-emerald-500/30 rounded-full animate-spin-slow">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full absolute -top-1 left-1/2 -translate-x-1/2 shadow-[0_0_15px_rgba(16,185,129,1)]"></div>
                 </div>
                 <i className="fa-solid fa-satellite-dish text-6xl text-emerald-500 animate-bounce absolute"></i>
              </div>
           </div>
           <div className="mt-16 text-center">
              <h3 className="text-3xl font-black text-white uppercase tracking-[0.6em] animate-pulse">Scanning 10KM Radius</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Connecting to Neural Map Grid // Identifying Facilities</p>
           </div>
        </div>
      )}

      {/* DISCOVERY BACK BUTTON */}
      {!navigationMode && discoveredHospitals.length > 0 && (
        <button 
          onClick={() => { setDiscoveredHospitals([]); setSelectedHospital(null); if (routeLineRef.current) routeLineRef.current.remove(); }}
          className="absolute top-10 left-10 z-[1500] bg-slate-950/90 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-4 hover:bg-slate-900 transition-all shadow-2xl"
        >
          <i className="fa-solid fa-chevron-left text-emerald-500"></i> Exit Discovery View
        </button>
      )}

      {/* STANDARD TOOLS */}
      {!navigationMode && !isScanning && discoveredHospitals.length === 0 && (
        <div className="absolute bottom-12 right-12 z-[1000] flex flex-col gap-6">
          <button onClick={() => setShowSOSModal(true)} className="w-24 h-24 rounded-full bg-red-600 shadow-[0_0_60px_rgba(220,38,38,0.7)] flex flex-col items-center justify-center text-white border-4 border-white/20 hover:scale-110 transition-all">
            <i className="fa-solid fa-truck-medical text-3xl mb-1"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">SOS</span>
          </button>
          <button onClick={() => setShowReportModal(true)} className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all border border-blue-500/30"><i className="fa-solid fa-plus text-2xl"></i></button>
          <button onClick={syncLocation} className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 shadow-2xl hover:scale-110 transition-all border border-slate-800"><i className="fa-solid fa-location-crosshairs text-2xl"></i></button>
        </div>
      )}

      {/* SOS SELECTION MODAL */}
      {showSOSModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-red-950/70 backdrop-blur-2xl" onClick={() => setShowSOSModal(false)}></div>
          <div className="relative bg-slate-950 border-4 border-red-600/50 p-16 rounded-[5rem] w-full max-w-2xl space-y-12 text-center shadow-2xl">
            <div className="space-y-4">
               <div className="w-24 h-24 bg-red-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl">
                  <i className="fa-solid fa-tower-broadcast text-4xl text-white animate-pulse"></i>
               </div>
               <h3 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Emergency Hub Scan</h3>
               <p className="text-slate-400 font-bold max-w-md mx-auto">Select transport mode for 10KM tactical discovery results.</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
               <button onClick={() => handleSOSScan('Car')} className="p-12 bg-slate-900 border-2 border-slate-800 hover:border-blue-600 rounded-[3rem] space-y-6 group transition-all">
                  <div className="w-20 h-20 bg-slate-950 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                     <i className="fa-solid fa-car text-5xl text-slate-700 group-hover:text-blue-500"></i>
                  </div>
                  <p className="text-xs font-black uppercase text-slate-500 group-hover:text-white tracking-widest">Private Vehicle</p>
               </button>
               <button onClick={() => handleSOSScan('Ambulance')} className="p-12 bg-slate-900 border-2 border-slate-800 hover:border-emerald-600 rounded-[3rem] space-y-6 group transition-all">
                  <div className="w-20 h-20 bg-slate-950 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                     <i className="fa-solid fa-truck-medical text-5xl text-slate-700 group-hover:text-emerald-500"></i>
                  </div>
                  <p className="text-xs font-black uppercase text-slate-500 group-hover:text-white tracking-widest">Ambulance SOS</p>
               </button>
            </div>
            <button onClick={() => setShowSOSModal(false)} className="text-slate-600 font-black uppercase text-[10px] tracking-[0.5em] hover:text-white">Dismiss Request</button>
          </div>
        </div>
      )}

      {/* MANUAL REPORT */}
      {showReportModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowReportModal(false)}></div>
          <div className="relative bg-slate-950 border-4 border-slate-900 p-16 rounded-[5rem] w-full max-w-xl space-y-12 shadow-2xl text-center">
            <h3 className="text-5xl font-black text-white uppercase tracking-tighter">Tactical Entry</h3>
            <div className="grid grid-cols-1 gap-6">
               <button onClick={() => { setShowReportModal(false); reportFileInputRef.current?.click(); }} className="p-10 bg-slate-900 border-2 border-slate-800 hover:border-blue-600 rounded-[2.5rem] flex justify-between items-center text-white font-black uppercase tracking-widest group transition-all">
                  Log Collision <i className="fa-solid fa-car-burst text-slate-700 group-hover:text-blue-500"></i>
               </button>
               <button onClick={() => { setShowReportModal(false); reportFileInputRef.current?.click(); }} className="p-10 bg-slate-900 border-2 border-slate-800 hover:border-amber-600 rounded-[2.5rem] flex justify-between items-center text-white font-black uppercase tracking-widest group transition-all">
                  Log Traffic <i className="fa-solid fa-traffic-light text-slate-700 group-hover:text-amber-500"></i>
               </button>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={reportFileInputRef} className="hidden" accept="image/*" />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes road-pulse {
          0% { stroke-dashoffset: 0; stroke-opacity: 0.9; }
          100% { stroke-dashoffset: -30; stroke-opacity: 0.6; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .leaflet-interactive { animation: road-pulse 1s infinite linear; }
      `}</style>
    </div>
  );
};

export default TacticalMap;
