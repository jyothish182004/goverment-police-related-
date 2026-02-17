
import React, { useState, useRef, useEffect } from 'react';
import { analyzeVisualMedia } from '../services/geminiService';
import { Incident, IdentifiedSubject } from '../types';

interface CriminalIDProps {
  onNewIncident: (incident: Incident) => void;
  incidents: Incident[];
  isSimulated?: boolean;
}

interface DetectionResult {
  type: string;
  identifiedSubject: IdentifiedSubject;
  confidence: number;
  autoConfirmed?: boolean;
}

const CriminalID: React.FC<CriminalIDProps> = ({ onNewIncident, incidents, isSimulated = false }) => {
  const [registry, setRegistry] = useState<IdentifiedSubject[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTarget, setAlertTarget] = useState<IdentifiedSubject | null>(null);
  
  const suspectInputRef = useRef<HTMLInputElement>(null);
  const registryInputRef = useRef<HTMLInputElement>(null);

  const handleAddRegistryEntry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const newEntry: IdentifiedSubject = {
        name: `Target-${registry.length + 1}`,
        id: `TRG-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Wanted',
        riskLevel: 'High',
        bio: "Monitored Profile. High-priority tracking active.",
        matchConfidence: 1,
        mugshotUrl: url,
        mugshotBase64: base64
      };
      setRegistry(prev => [newEntry, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  const handleSuspectCheck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setDetections([]);
    setShowAlert(false);
    const url = URL.createObjectURL(file);
    setCurrentMediaUrl(url);
    setIsProcessing(true);
    setStatus('SYNCING BIOMETRIC REGISTRY...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setStatus('SCANNING GROUP NEURAL VECTORS...');
        try {
          const results = await analyzeVisualMedia(base64, file.type, isSimulated, registry);
          
          if (results && results.length > 0) {
            const processedDetections: DetectionResult[] = results
              .filter(r => r.identifiedSubject)
              .map(r => {
                const isTarget = r.type === "Target Match" || r.identifiedSubject?.matchConfidence > 0.7;
                const confidence = r.identifiedSubject?.matchConfidence || r.confidence || 0;
                
                if (isTarget && confidence > 0.8) {
                  setAlertTarget(r.identifiedSubject);
                  setShowAlert(true);
                  archiveAutoMatch(r.identifiedSubject, url);
                }

                return {
                  type: r.type,
                  identifiedSubject: r.identifiedSubject,
                  confidence: confidence,
                  autoConfirmed: isTarget && confidence > 0.8
                };
              });

            setDetections(processedDetections);
            setStatus(`SCAN COMPLETE: ${processedDetections.length} TARGETS LOCKED`);
          } else {
            setError('SCENE CLEAR // NO REGISTERED TARGETS DETECTED');
          }
        } catch (error: any) {
          setError('NEURAL UPLINK FAILURE');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('INPUT ERROR');
      setIsProcessing(false);
    }
  };

  const archiveAutoMatch = (subject: IdentifiedSubject, url: string) => {
    const now = new Date();
    const incident: Incident = {
      id: `GROUP-ID-${Math.floor(Math.random() * 90000)}`,
      type: 'Suspicious Behavior',
      timestamp: 'LIVE',
      savedAt: now.toLocaleString(),
      location: `SECTOR ALPHA // ${subject.locationInImage || 'UNSPECIFIED QUADRANT'}`,
      confidence: subject.matchConfidence || 0.95,
      videoRef: 'High-Res Scan',
      snapshotUrl: url,
      description: `CRITICAL MATCH: Target ${subject.name} identified within group at ${subject.locationInImage || 'Active Sector'}. Biometric signature confirmed.`,
      detectedObjects: ['Human', 'Target Locked'],
      identifiedSubject: subject
    };
    onNewIncident(incident);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-slate-900 pb-10 gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.8)]"></span>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Biometric Hub v2.1</span>
           </div>
           <h1 className="text-7xl font-black text-white uppercase tracking-tighter leading-none">Group <span className="text-rose-600">Scanner</span></h1>
        </div>
        <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 flex items-center gap-8">
           <div className="text-center px-6 border-r border-slate-800">
              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Registry Targets</span>
              <span className="text-4xl font-black text-rose-500">{registry.length}</span>
           </div>
           <button onClick={() => registryInputRef.current?.click()} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
              Add Target +
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
         {/* REGISTRY SIDEBAR */}
         <div className="lg:w-80 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
               <i className="fa-solid fa-folder-open"></i> Live Registry
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
               {registry.length > 0 ? registry.map((t, i) => (
                 <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center gap-4 group hover:border-rose-500/50 transition-all">
                    <img src={t.mugshotUrl} className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                    <div className="min-w-0">
                       <p className="text-[10px] font-black text-white uppercase truncate">{t.name}</p>
                       <p className="text-[8px] font-bold text-rose-500 uppercase">{t.id}</p>
                    </div>
                 </div>
               )) : (
                 <p className="text-[10px] font-bold text-slate-600 uppercase italic">Awaiting profile uploads...</p>
               )}
            </div>
         </div>

         <div className="flex-1 bg-slate-950 border-4 border-slate-900 rounded-[4rem] p-12 min-h-[700px] flex flex-col relative overflow-hidden shadow-2xl">
            <input type="file" ref={registryInputRef} className="hidden" accept="image/*" onChange={handleAddRegistryEntry} />
            <input type="file" ref={suspectInputRef} className="hidden" accept="image/*" onChange={handleSuspectCheck} />

            {!currentMediaUrl && !isProcessing && (
              <div onClick={() => suspectInputRef.current?.click()} className="flex-1 border-4 border-dashed border-slate-900 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer group hover:border-rose-600/30 transition-all">
                 <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-users-viewfinder text-5xl text-slate-700 group-hover:text-rose-600"></i>
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Scan Group Feed</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Identify targets within group environments</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                 <div className="w-20 h-20 border-4 border-slate-900 border-t-rose-600 rounded-full animate-spin"></div>
                 <p className="text-rose-500 font-black text-xl uppercase tracking-[0.4em] animate-pulse">{status}</p>
              </div>
            )}

            {currentMediaUrl && !isProcessing && (
              <div className="flex-1 flex flex-col lg:flex-row gap-12 animate-in slide-in-from-bottom-6">
                 <div className="lg:w-2/3 bg-black rounded-[3rem] overflow-hidden border-4 border-slate-900 relative">
                    <img src={currentMediaUrl} className="w-full h-full object-contain" />
                    {/* Visual Lock Overlay */}
                    <div className="absolute inset-0 border-[20px] border-rose-600/5 pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-rose-600/40"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-rose-600/40"></div>
                 </div>

                 <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Neural Lock Active</h4>
                       <button onClick={() => { setCurrentMediaUrl(null); setDetections([]); setShowAlert(false); }} className="text-slate-500 hover:text-white transition-colors">
                          <i className="fa-solid fa-xmark"></i>
                       </button>
                    </div>

                    <div className="space-y-4">
                       {detections.map((det, idx) => (
                         <div key={idx} className={`p-8 rounded-[2.5rem] border-2 transition-all ${det.autoConfirmed ? 'bg-rose-600/10 border-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
                            <div className="flex items-center gap-6">
                               <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 ${det.autoConfirmed ? 'border-rose-600 animate-pulse' : 'border-slate-700'}`}>
                                  <img src={`https://picsum.photos/seed/${det.identifiedSubject.id}/200`} className="w-full h-full object-cover" />
                               </div>
                               <div>
                                  <h5 className="text-xl font-black text-white uppercase leading-none">{det.identifiedSubject.name}</h5>
                                  <p className="text-rose-500 font-bold text-[9px] uppercase mt-1 tracking-widest">Confidence: {Math.round(det.confidence * 100)}%</p>
                               </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                               <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                  <span className="text-slate-500 tracking-widest">Group Location</span>
                                  <span className="text-white bg-rose-600/20 px-3 py-1 rounded-lg">{det.identifiedSubject.locationInImage || 'Searching...'}</span>
                               </div>
                               <p className="text-xs text-slate-400 italic">"Subject identified within crowd. Neural signature matches registry file."</p>
                            </div>
                         </div>
                       ))}
                       
                       {detections.length === 0 && (
                         <div className="p-12 text-center opacity-20 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                            <i className="fa-solid fa-face-viewfinder text-6xl mb-4"></i>
                            <p className="font-black uppercase text-xs">No Matches</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* EMERGENCY ALERT MODAL */}
      {showAlert && alertTarget && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8 overflow-hidden">
           <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xl animate-pulse"></div>
           <div className="relative w-full max-w-4xl bg-black border-8 border-rose-600 rounded-[5rem] p-16 space-y-10 text-center shadow-[0_0_150px_rgba(225,29,72,0.6)] animate-in zoom-in-95 duration-300">
              
              <div className="flex justify-center gap-10">
                 <div className="w-32 h-32 bg-slate-900 rounded-[3rem] border-4 border-slate-800 overflow-hidden">
                    <img src={registry.find(t => t.id === alertTarget.id)?.mugshotUrl} className="w-full h-full object-cover grayscale" />
                 </div>
                 <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center animate-ping self-center">
                    <i className="fa-solid fa-triangle-exclamation text-white text-3xl"></i>
                 </div>
                 <div className="w-32 h-32 bg-slate-900 rounded-[3rem] border-4 border-rose-600 overflow-hidden">
                    <img src={currentMediaUrl || ''} className="w-full h-full object-cover" />
                 </div>
              </div>

              <div className="space-y-4">
                 <h2 className="text-7xl font-black text-white uppercase tracking-tighter leading-none">Target <span className="text-rose-600">Matched</span></h2>
                 <p className="text-2xl font-black text-rose-500 uppercase tracking-widest">{alertTarget.name} // {alertTarget.id}</p>
                 <div className="inline-block bg-rose-600/20 px-8 py-3 rounded-2xl border border-rose-600/40">
                    <p className="text-xs font-black text-white uppercase tracking-widest">Locked Sector: {alertTarget.locationInImage}</p>
                 </div>
              </div>

              <div className="flex gap-6">
                 <button onClick={() => setShowAlert(false)} className="flex-1 bg-white text-black font-black py-8 rounded-[2.5rem] text-xl uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                    Deploy Authorities
                 </button>
                 <button onClick={() => setShowAlert(false)} className="flex-1 bg-slate-900 border-4 border-slate-800 text-slate-500 font-black py-8 rounded-[2.5rem] text-xl uppercase tracking-widest hover:text-white transition-all">
                    Dismiss Alert
                 </button>
              </div>

              <div className="absolute top-10 left-10 text-rose-600 font-mono text-[10px] font-bold uppercase space-y-1 text-left opacity-40">
                 <p>SYS_STATUS: CRITICAL_MATCH</p>
                 <p>SECTOR_OVERWATCH: ACTIVE</p>
                 <p>BIOMETRIC_PRECISION: 0.9882</p>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(600px); }
        }
      `}</style>
    </div>
  );
};

export default CriminalID;
