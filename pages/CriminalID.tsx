
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
        bio: "Registered tactical profile. Monitored for safety threats.",
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
    const url = URL.createObjectURL(file);
    setCurrentMediaUrl(url);
    setIsProcessing(true);
    setStatus('SYNCING BIOMETRIC REGISTRY...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setStatus('PERFORMING VISUAL CROSS-MATCH...');
        try {
          // Now passing the full registry with images to Gemini
          const results = await analyzeVisualMedia(base64, file.type, isSimulated, registry);
          
          if (results && results.length > 0) {
            const processedDetections: DetectionResult[] = results
              .filter(r => r.identifiedSubject)
              .map(r => {
                const isTarget = r.type === "Target Match";
                const confidence = r.identifiedSubject?.matchConfidence || r.confidence || 0;
                
                // Smart Logic: Auto-Confirm high confidence matches
                const autoConfirm = isTarget && confidence > 0.85;
                
                if (autoConfirm) {
                  archiveAutoMatch(r.identifiedSubject, url);
                }

                return {
                  type: r.type,
                  identifiedSubject: r.identifiedSubject,
                  confidence: confidence,
                  autoConfirmed: autoConfirm
                };
              });

            setDetections(processedDetections);
            setStatus(`SCAN COMPLETE: ${processedDetections.length} IDENTITIES RESOLVED`);
          } else {
            setError('SCENE CLEAR // NO SUBJECTS DETECTED');
          }
        } catch (error: any) {
          setError('NEURAL UPLINK FAILURE: CHECK API STATUS');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('MEDIA INPUT ERROR');
      setIsProcessing(false);
    }
  };

  const archiveAutoMatch = (subject: IdentifiedSubject, url: string) => {
    const now = new Date();
    const incident: Incident = {
      id: `AUTO-${Math.floor(Math.random() * 90000)}`,
      type: 'Suspicious Behavior',
      timestamp: '00:01',
      savedAt: `${now.toLocaleDateString()}, ${now.toLocaleTimeString()}`,
      location: 'SECTOR ALPHA // BIOMETRIC LOCK',
      confidence: subject.matchConfidence || 0.95,
      videoRef: 'High-Res Scan',
      snapshotUrl: url,
      description: `Target ${subject.name} (ID: ${subject.id}) matched against registry. System auto-confirmed biometric signature via visual comparison.`,
      detectedObjects: ['Human', 'Target'],
      identifiedSubject: subject
    };
    onNewIncident(incident);
  };

  const confirmManualMatch = (det: DetectionResult) => {
    const now = new Date();
    const incident: Incident = {
      id: `BIOLOCK-${Math.floor(Math.random() * 90000)}`,
      type: 'Suspicious Behavior',
      timestamp: '00:01',
      savedAt: `${now.toLocaleDateString()}, ${now.toLocaleTimeString()}`,
      location: 'SECTOR ALPHA // OPERATOR CONFIRMED',
      confidence: det.confidence,
      videoRef: 'Manual Cross-Match',
      snapshotUrl: currentMediaUrl || '',
      description: `Target ${det.identifiedSubject.name} manually verified by operator after Uncertainty Audit.`,
      detectedObjects: ['Human', 'Target Match'],
      identifiedSubject: det.identifiedSubject
    };
    onNewIncident(incident);
    setDetections(prev => prev.map(d => d.identifiedSubject.id === det.identifiedSubject.id ? { ...d, autoConfirmed: true } : d));
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-slate-900 pb-10 gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]"></span>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Biometric ID Terminal</span>
           </div>
           <h1 className="text-7xl font-black text-white uppercase tracking-tighter leading-none">Search <span className="text-rose-600">Hub</span></h1>
        </div>
        <div className="flex items-center gap-10 bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 shadow-2xl">
           <div className="text-center px-10 border-r border-slate-800">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Registry</span>
              <span className="text-4xl font-black text-rose-500">{registry.length}</span>
           </div>
           <div className="text-center px-10">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Confirmed Matches</span>
              <span className="text-4xl font-black text-emerald-500">{incidents.filter(i => i.id.startsWith('AUTO') || i.id.startsWith('BIO')).length}</span>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
         <div className="p-10 lg:p-14 bg-slate-950 border-4 border-slate-900 rounded-[4rem] shadow-2xl space-y-12 min-h-[850px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
               <div className="space-y-1">
                  <h2 className="text-4xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                     <i className="fa-solid fa-users-viewfinder text-rose-600"></i> Neural <span className="text-rose-600">Comparison</span>
                  </h2>
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Multi-vector visual biometric alignment</p>
               </div>
               <div className="flex items-center gap-4">
                 <input type="file" ref={registryInputRef} className="hidden" accept="image/*" onChange={handleAddRegistryEntry} />
                 <button onClick={() => registryInputRef.current?.click()} className="bg-slate-900 hover:bg-white hover:text-black text-white px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-800 flex items-center gap-3 active:scale-95 shadow-lg">
                    <i className="fa-solid fa-user-plus text-xs"></i> Add Registry Target
                 </button>
               </div>
            </div>

            {/* Registry Visual Thumbnails */}
            {registry.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar border-b border-slate-900">
                 {registry.map((target, idx) => (
                   <div key={idx} className="group relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900 shrink-0 hover:border-rose-500 transition-all cursor-help">
                      <img src={target.mugshotUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      <div className="absolute inset-0 bg-rose-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-1 right-1">
                         <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_5px_rgba(225,29,72,1)]"></div>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            <div className="flex-1 flex flex-col pt-4">
               <input type="file" ref={suspectInputRef} className="hidden" accept="image/*" onChange={handleSuspectCheck} />
               
               {!currentMediaUrl && !isProcessing && (
                 <div onClick={() => suspectInputRef.current?.click()} className="flex-1 bg-slate-900/20 border-4 border-dashed border-slate-900 rounded-[4rem] flex flex-col items-center justify-center cursor-pointer group hover:border-rose-600/40 transition-all">
                    <div className="w-28 h-28 bg-slate-950 border border-slate-800 rounded-[3rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform group-hover:border-rose-600 shadow-inner">
                       <i className="fa-solid fa-scan text-6xl text-slate-700 group-hover:text-rose-600"></i>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-[0.2em]">Upload Scene Feed</h3>
                    <p className="text-slate-600 text-[11px] uppercase font-black tracking-widest mt-4">Analyzing images against registry targets in real-time</p>
                 </div>
               )}

               {isProcessing && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 mb-10">
                       <div className="absolute inset-0 border-8 border-slate-900 rounded-full"></div>
                       <div className="absolute inset-0 border-8 border-t-rose-600 rounded-full animate-spin"></div>
                       <i className="fa-solid fa-dna absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-rose-500 animate-pulse"></i>
                    </div>
                    <p className="text-rose-500 font-black text-xl uppercase tracking-[0.4em] animate-pulse">{status}</p>
                 </div>
               )}

               {currentMediaUrl && !isProcessing && (
                 <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-8">
                    <div className="flex justify-between items-center mb-10">
                       <h4 className="text-rose-500 font-black text-[12px] uppercase tracking-[0.5em] flex items-center gap-4">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shadow-[0_0_10px_rgba(225,29,72,1)]"></span> 
                          Neural Analysis Active
                       </h4>
                       <button onClick={() => { setCurrentMediaUrl(null); setDetections([]); }} className="text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest px-8 py-3 border border-slate-800 rounded-full hover:bg-rose-600 hover:border-rose-600 transition-all">New Scan</button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-16">
                       <div className="w-full lg:w-3/5 aspect-video lg:aspect-square bg-black rounded-[4rem] overflow-hidden border-4 border-slate-900 relative shadow-2xl group">
                          <img src={currentMediaUrl} className="w-full h-full object-contain" />
                          <div className="absolute inset-0">
                             <div className="w-full h-[2px] bg-rose-600 animate-[scan_4s_infinite] absolute shadow-[0_0_20px_rgba(225,29,72,1)]"></div>
                          </div>
                          {/* Visual Overlay Indicators */}
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5"></div>
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5"></div>
                       </div>
                       
                       <div className="flex-1 space-y-8 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
                          {detections.length > 0 ? (
                             detections.map((det, idx) => {
                               const isTarget = det.type === "Target Match";
                               const regTarget = isTarget ? registry.find(t => t.id === det.identifiedSubject?.id) : null;
                               
                               return (
                                 <div key={idx} className={`bg-slate-900/60 border-2 rounded-[3.5rem] p-10 space-y-8 animate-in slide-in-from-right duration-300 ${isTarget ? 'border-rose-600 shadow-[0_0_40px_rgba(225,29,72,0.15)]' : 'border-blue-600/50'}`}>
                                    <div className="flex items-center gap-8">
                                       <div className={`w-24 h-24 rounded-3xl overflow-hidden border-4 shrink-0 shadow-2xl ${isTarget ? 'border-rose-600 animate-pulse' : 'border-blue-600'}`}>
                                          <img src={regTarget?.mugshotUrl || `https://picsum.photos/seed/${det.identifiedSubject?.id}/200`} className={`w-full h-full object-cover ${!isTarget && 'grayscale'}`} />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3 mb-1">
                                             <h4 className="text-3xl font-black text-white uppercase tracking-tighter truncate leading-none">{det.identifiedSubject?.name || "Subject Detected"}</h4>
                                             {isTarget && <i className="fa-solid fa-circle-check text-rose-500"></i>}
                                          </div>
                                          <p className={`text-[12px] font-black uppercase tracking-widest ${isTarget ? 'text-rose-500' : 'text-blue-500'}`}>
                                             {det.identifiedSubject?.id || "N/A"} // {isTarget ? 'REGISTRY MATCH' : 'NON-TARGET'}
                                          </p>
                                       </div>
                                    </div>
                                    
                                    <div className={`p-6 rounded-[2rem] ${isTarget ? 'bg-rose-600/10 border border-rose-600/20' : 'bg-blue-600/10 border border-blue-600/20'}`}>
                                       <div className="flex justify-between items-center mb-3">
                                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Biometric Precision</p>
                                          <span className={`text-2xl font-black ${isTarget ? 'text-rose-500' : 'text-blue-500'}`}>{Math.round(det.confidence * 100)}%</span>
                                       </div>
                                       <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                                          <div className={`h-full transition-all duration-[1500ms] ${isTarget ? 'bg-rose-600' : 'bg-blue-600'}`} style={{ width: `${det.confidence * 100}%` }}></div>
                                       </div>
                                    </div>

                                    {isTarget && !det.autoConfirmed && (
                                       <div className="flex gap-4">
                                          <button onClick={() => confirmManualMatch(det)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95">Lock Target</button>
                                          <button onClick={() => setDetections(prev => prev.filter(d => d.identifiedSubject?.id !== det.identifiedSubject?.id))} className="flex-1 bg-slate-800 hover:bg-rose-600 text-white font-black py-5 rounded-2xl text-[11px] uppercase tracking-widest transition-all active:scale-95">Dismiss</button>
                                       </div>
                                    )}

                                    {isTarget && det.autoConfirmed && (
                                       <div className="bg-emerald-600/20 border border-emerald-600/40 p-8 rounded-[2rem] flex items-center justify-center gap-6 shadow-inner">
                                          <i className="fa-solid fa-shield-check text-emerald-500 text-3xl"></i>
                                          <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Identity Confirmed & Dispatched to Archive</span>
                                       </div>
                                    )}
                                    
                                    {!isTarget && (
                                      <div className="text-center p-4">
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">No Hostile Signature Detected</p>
                                      </div>
                                    )}
                                 </div>
                               );
                             })
                          ) : (
                             <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-slate-900/20 border-4 border-dashed border-slate-900 rounded-[4rem]">
                                <i className="fa-solid fa-face-viewfinder text-8xl text-slate-800 mb-10 opacity-20"></i>
                                <h4 className="text-slate-600 font-black uppercase text-2xl tracking-tighter">Biometric Neutrality</h4>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-4 leading-relaxed max-w-sm mx-auto">Upload a feed to scan for people. If registry targets are detected, the neural scanner will perform a visual cross-match.</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default CriminalID;
