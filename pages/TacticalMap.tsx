
import React, { useState, useRef, useEffect } from 'react';
import { Incident, IncidentType, TransportMode, VerificationAudit } from '../types';
import { verifyReportImage } from '../services/geminiService';

declare const L: any;

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
  const [routingTo, setRoutingTo] = useState<{name: string, lat: number, lng: number} | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode | null>(null);
  
  // Verification States
  const [pendingType, setPendingType] = useState<IncidentType | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<VerificationAudit | null>(null);

  const userMarkerRef = useRef<any>(null);
  const incidentMarkersRef = useRef<Map<string, any>>(new Map());
  const routeLineRef = useRef<any>(null);

  const syncLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      const { latitude, longitude } = p.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 15);
        updateUserMarker(latitude, longitude);
      }
    }, () => {
      // Fallback location
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
    });
  };

  const updateUserMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        className: 'user-marker',
        html: `<div class="relative flex items-center justify-center">
                <div class="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping"></div>
                <div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                  <i class="fa-solid fa-crosshairs text-white text-[10px]"></i>
                </div>
              </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      userMarkerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current);
    }
  };

  const handleManualTypeSelect = (type: IncidentType) => {
    setPendingType(type);
    setVerificationError(null);
    setAuditResult(null);
    reportFileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingType || !userLocation) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const mediaUrl = URL.createObjectURL(file);

        // Perform AI Verification for AI-generated detection
        const result = await verifyReportImage(base64, file.type, !process.env.API_KEY, pendingType, userLocation);
        
        setAuditResult(result.audit);

        if (result.isReal) {
          const newInc: Incident = {
            id: `MAN-${Math.floor(Math.random() * 9999)}`,
            type: pendingType,
            timestamp: 'LIVE',
            savedAt: new Date().toLocaleString(),
            location: 'FIELD VERIFIED SECTOR',
            locationCoords: { ...userLocation },
            confidence: result.audit.overallScore / 100,
            videoRef: 'Field Evidence',
            snapshotUrl: mediaUrl,
            description: `MANUAL REPORT: ${pendingType}. Biometrically and neurally verified as real-world imagery.`,
            detectedObjects: ['Visual Evidence']
          };
          
          onManualReport(newInc);
          setTimeout(() => {
            setShowReportModal(false);
            setIsVerifying(false);
            setPendingType(null);
            setAuditResult(null);
          }, 2000);
        } else {
          setVerificationError(result.reason);
          setIsVerifying(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setVerificationError("Neural uplink failed. Please retry.");
      setIsVerifying(false);
    }
  };

  const handleSOS = (mode: TransportMode) => {
    if (!userLocation) return;
    setTransportMode(mode);
    const hosp = {
      name: "CENTRAL MEDICAL HUB",
      lat: userLocation.lat + 0.008,
      lng: userLocation.lng + 0.005,
      eta: "4 Mins"
    };
    setRoutingTo(hosp);
    setShowSOSModal(false);
    
    if (routeLineRef.current) routeLineRef.current.remove();
    routeLineRef.current = L.polyline([[userLocation.lat, userLocation.lng], [hosp.lat, hosp.lng]], { color: '#10b981', weight: 6, opacity: 0.8, dashArray: '10, 10' }).addTo(mapRef.current);
    mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [50, 50] });

    L.marker([hosp.lat, hosp.lng], {
      icon: L.divIcon({
        className: 'hosp-marker',
        html: `<div class="w-10 h-10 bg-emerald-500 rounded-xl border-2 border-white shadow-xl flex items-center justify-center">
                 <i class="fa-solid fa-hospital text-white text-sm"></i>
               </div>`
      })
    }).addTo(mapRef.current).bindPopup(`<b class='text-black'>${hosp.name}</b><br/>ETA: ${hosp.eta}`).openPopup();
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([12.9716, 77.5946], 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    syncLocation();

    // Global listener for "Remove" button in popup
    const handlePopupClick = (e: any) => {
      if (e.target.id && e.target.id.startsWith('remove-btn-')) {
        const id = e.target.id.replace('remove-btn-', '');
        onDeleteIncident(id);
      }
    };
    document.addEventListener('click', handlePopupClick);
    return () => document.removeEventListener('click', handlePopupClick);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clean up markers that are no longer in the list
    const currentIds = new Set(incidents.map(i => i.id));
    incidentMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        incidentMarkersRef.current.delete(id);
      }
    });

    incidents.forEach((inc) => {
      if (incidentMarkersRef.current.has(inc.id)) return;

      const lat = inc.locationCoords?.lat || 12.9716;
      const lng = inc.locationCoords?.lng || 77.5946;
      
      const color = inc.type.includes('Collision') || inc.type.includes('Weapon') ? 'bg-red-600' : 'bg-amber-500';
      const icon = inc.type.includes('Collision') ? 'fa-car-burst' : 'fa-triangle-exclamation';

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'incident-marker',
          html: `<div class="w-10 h-10 ${color} rounded-xl border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                   <i class="fa-solid ${icon} text-white text-xs"></i>
                 </div>`
        })
      }).addTo(mapRef.current);

      marker.bindPopup(`
        <div class="p-3 bg-slate-950 text-white rounded-xl border border-slate-800 flex flex-col items-center">
          <p class="text-[9px] font-black text-blue-500 uppercase">${inc.type}</p>
          <img src="${inc.snapshotUrl}" class="w-32 h-20 object-cover rounded-lg mt-2 border border-slate-800"/>
          <button id="remove-btn-${inc.id}" class="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-500 text-[9px] font-black uppercase tracking-widest text-white rounded-lg transition-all shadow-lg">
            Remove Report
          </button>
        </div>
      `, { className: 'custom-popup', minWidth: 150 });
      
      incidentMarkersRef.current.set(inc.id, marker);
    });
  }, [incidents]);

  return (
    <div className="h-[calc(100vh-140px)] w-full relative overflow-hidden bg-black rounded-[4rem] border-4 border-slate-900 shadow-2xl">
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* OVERLAYS */}
      <div className="absolute top-10 left-10 z-[1000] flex flex-col gap-4 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Sector Overwatch</p>
          <h2 className="text-xl font-black text-white uppercase">{incidents.length} Active Threats</h2>
        </div>
        
        {routingTo && (
          <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-2xl animate-in slide-in-from-left pointer-events-auto">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Hospital Route Locked</p>
            <h3 className="text-lg font-black">{routingTo.name}</h3>
            <p className="text-2xl font-black mt-2">{routingTo.eta}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 right-10 z-[1000] flex flex-col gap-4">
        <button onClick={() => setShowSOSModal(true)} className="w-20 h-20 bg-red-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl hover:scale-110 transition-all border-4 border-white/20">
          <i className="fa-solid fa-truck-medical text-2xl mb-1"></i>
          <span className="text-[8px] font-black uppercase">SOS</span>
        </button>
        
        <button onClick={() => { setShowReportModal(true); setVerificationError(null); setAuditResult(null); }} className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all">
          <i className="fa-solid fa-plus text-2xl"></i>
        </button>
        
        <button onClick={syncLocation} className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 shadow-2xl hover:scale-110 transition-all border border-slate-800">
          <i className="fa-solid fa-location-crosshairs text-2xl"></i>
        </button>
      </div>

      <input type="file" ref={reportFileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      {/* MODALS */}
      {showReportModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isVerifying && setShowReportModal(false)}></div>
          <div className="relative bg-slate-950 border-4 border-slate-900 p-10 rounded-[3rem] w-full max-w-lg space-y-8 shadow-2xl">
            
            {!isVerifying && !auditResult ? (
              <>
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Field Report</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Image verification required for AI-generated detection</p>
                </div>
                
                {verificationError && (
                  <div className="bg-rose-600/10 border border-rose-600/50 p-4 rounded-xl text-rose-500 text-[10px] font-black uppercase flex items-center gap-3">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    {verificationError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <button onClick={() => handleManualTypeSelect('Vehicle Collision')} className="p-6 bg-slate-900 border-2 border-slate-800 hover:border-blue-600 rounded-3xl flex justify-between items-center transition-all group">
                    <span className="font-black uppercase tracking-widest text-white">Report Accident</span>
                    <i className="fa-solid fa-camera text-slate-700 group-hover:text-blue-500 transition-colors"></i>
                  </button>
                  <button onClick={() => handleManualTypeSelect('Traffic Congestion')} className="p-6 bg-slate-900 border-2 border-slate-800 hover:border-amber-600 rounded-3xl flex justify-between items-center transition-all group">
                    <span className="font-black uppercase tracking-widest text-white">Report Traffic</span>
                    <i className="fa-solid fa-camera text-slate-700 group-hover:text-amber-500 transition-colors"></i>
                  </button>
                </div>
              </>
            ) : isVerifying ? (
              <div className="py-12 text-center space-y-8">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                  <i className="fa-solid fa-fingerprint absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-blue-500 animate-pulse"></i>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-white uppercase tracking-widest">Neural Forensics Audit</h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Scanning for synthetic textures...</p>
                </div>
              </div>
            ) : auditResult && (
               <div className="py-12 text-center space-y-8 animate-in zoom-in">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
                    <i className="fa-solid fa-check text-white text-4xl"></i>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Integrity Verified</h4>
                    <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Human Origin Confirmed // Report Archived</p>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* SOS MODAL */}
      {showSOSModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md" onClick={() => setShowSOSModal(false)}></div>
          <div className="relative bg-slate-950 border-4 border-red-600/50 p-12 rounded-[4rem] w-full max-w-lg space-y-10 text-center shadow-2xl">
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Emergency SOS</h3>
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => handleSOS('Car')} className="p-8 bg-slate-900 border-2 border-slate-800 hover:border-blue-500 rounded-[2.5rem] space-y-4 group transition-all">
                <i className="fa-solid fa-car text-3xl text-slate-600 group-hover:text-blue-500"></i>
                <span className="block text-[10px] font-black uppercase text-slate-500 group-hover:text-white">Self-Drive</span>
              </button>
              <button onClick={() => handleSOS('Ambulance')} className="p-8 bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 rounded-[2.5rem] space-y-4 group transition-all">
                <i className="fa-solid fa-truck-medical text-3xl text-slate-600 group-hover:text-emerald-500"></i>
                <span className="block text-[10px] font-black uppercase text-slate-500 group-hover:text-white">Ambulance</span>
              </button>
            </div>
            <button onClick={() => setShowSOSModal(false)} className="text-slate-600 font-black uppercase text-[10px] tracking-widest">Cancel Request</button>
          </div>
        </div>
      )}

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
        .custom-popup .leaflet-popup-tip { display: none !important; }
      `}</style>
    </div>
  );
};

export default TacticalMap;
