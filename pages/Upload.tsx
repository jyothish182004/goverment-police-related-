
import React, { useState, useRef, useEffect } from 'react';
import { analyzeVideoFootage } from '../services/geminiService';
import { Incident, IncidentType } from '../types';

interface UploadProps {
  onNewIncident: (incident: Incident) => void;
  isSimulated?: boolean;
}

const timestampToSeconds = (ts: string): number => {
  if (!ts) return 0;
  const parts = ts.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return isNaN(parts[0]) ? 0 : parts[0];
};

const Upload: React.FC<UploadProps> = ({ onNewIncident, isSimulated = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [primaryIncident, setPrimaryIncident] = useState<Incident | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPrimaryIncident(null);
    setVideoUrl(URL.createObjectURL(file));
    setIsProcessing(true);
    setStatus(isSimulated ? 'INITIALIZING HEURISTIC SCAN...' : 'ESTABLISHING SECURE AI UPLINK...');
    setProgress(15);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setStatus(isSimulated ? 'EXTRACTING THREAT VECTORS...' : 'ANALYZING SURVEILLANCE VECTORS...');
        setProgress(45);

        try {
          const detections = await analyzeVideoFootage(base64, file.type, isSimulated);
          setProgress(95);
          
          if (detections && detections.length > 0) {
            const res = detections[0];
            const formattedIncident: Incident = {
              id: `EVD-${Math.floor(Math.random() * 90000 + 10000)}`,
              type: (res.type as IncidentType) || 'Vehicle Collision',
              status: 'Needs Review',
              timestamp: res.timestamp || '0:00',
              location: res.location || 'SECURED SECTOR',
              confidence: res.confidence || 0.95,
              videoRef: file.name,
              snapshotUrl: '',
              description: res.description || 'Neural analysis complete.',
              detectedObjects: res.detectedObjects || ['Unknown Entity']
            };

            setPrimaryIncident(formattedIncident);
            onNewIncident(formattedIncident);
            setStatus('ANALYSIS COMPLETE');
          }
          setProgress(100);
        } catch (error) {
          console.error(error);
          setStatus('SYSTEM ERROR');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-16 pb-32">
      {/* INITIAL LANDING STATE: DOCUMENTATION & BRIEFING */}
      {!primaryIncident && !isProcessing && (
        <div className="space-y-24 animate-in fade-in duration-500">
          
          {/* 1. TITLE & HEADER */}
          <div className="text-center space-y-6 max-w-4xl mx-auto pt-8">
            <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-sm ${isSimulated ? 'bg-amber-900/10 border border-amber-800/30 text-amber-500' : 'bg-blue-900/10 border border-blue-800/30 text-blue-500'} text-[10px] font-black uppercase tracking-[0.5em]`}>
              <span className={`w-2 h-2 ${isSimulated ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'} rounded-full`}></span> 
              Sentinel Neural Hub v4.0.2 // Strategic Surveillance Node
            </div>
            <h1 className="text-8xl font-black text-white tracking-tighter uppercase leading-none">
              Neural <span className={isSimulated ? 'text-amber-600' : 'text-blue-600'}>Scan</span>
            </h1>
            <p className="text-slate-500 text-lg font-bold tracking-widest uppercase">
              Autonomous Threat Evaluation & Forensic Evidence Generation
            </p>
          </div>

          {/* 2. SYSTEM CAPABILITIES */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-slate-900"></div>
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">System Capabilities</h2>
              <div className="h-[1px] flex-1 bg-slate-900"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { title: 'Accident Detection', icon: 'fa-car-burst', desc: 'Kinetic impact analysis and debris mapping.' },
                { title: 'Women Safety', icon: 'fa-person-dress', desc: 'Predictive behavioral tracking in isolated zones.', highlight: true },
                { title: 'Weapon Detection', icon: 'fa-gun', desc: 'Visual recognition of tactical and concealed threats.' },
                { title: 'Suspicious Behavior', icon: 'fa-user-secret', desc: 'Erratic movement and lingering pattern recognition.' },
                { title: 'Traffic Congestion', icon: 'fa-traffic-light', desc: 'Flow-rate monitoring and blockage identification.' },
              ].map((cap, i) => (
                <div key={i} className={`p-6 bg-slate-950 border ${cap.highlight ? 'border-purple-900/40 bg-purple-950/5' : 'border-slate-900'} rounded-2xl space-y-4 hover:border-slate-700 transition-colors`}>
                  <i className={`fa-solid ${cap.icon} ${cap.highlight ? 'text-purple-500' : 'text-blue-500'} text-xl`}></i>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest leading-tight">{cap.title}</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-tighter">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. HOW THE SYSTEM WORKS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Operational Logic</h2>
              <div className="space-y-6">
                {[
                  { title: 'Object Detection', desc: 'Sub-millisecond identification of persons, vehicles, and specialized objects.' },
                  { title: 'Temporal Behavior Tracking', desc: 'Analyzes movement vectors over time to identify anomalies versus baseline behavior.' },
                  { title: 'Rule-Based Incident Logic', desc: 'Context-aware evaluation based on municipal safety protocols and jurisdictional rules.' },
                  { title: 'Human-in-the-loop', desc: 'The AI provides evidence frames and reasoning; final categorization is reserved for the duty officer.' },
                ].map((logic, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <span className="text-xs font-mono text-blue-600 font-bold">0{i+1}</span>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{logic.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{logic.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 4. WOMEN SAFETY MONITORING (HIGHLIGHTED) */}
            <div className="bg-slate-950 border-2 border-purple-900/20 p-12 rounded-[3rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fa-solid fa-person-dress text-9xl text-purple-500"></i>
              </div>
              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em]">High Priority Module</span>
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Women Safety <br/>Monitoring</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   {[
                     { label: 'Isolated Persistence', desc: 'Detection of lone subjects in low-traffic nocturnal zones.' },
                     { label: 'Tracking Vectors', desc: 'Identifies if a subject is being persistently followed for 8+ seconds.' },
                     { label: 'Aggressive Proximity', desc: 'Alerts on sudden, non-linear approach vectors toward a subject.' },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 bg-purple-900/5 p-4 rounded-xl border border-purple-900/10">
                        <i className="fa-solid fa-circle-check text-purple-500 text-xs"></i>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <p className="text-[10px] text-purple-400/60 font-black uppercase tracking-widest text-center pt-4 border-t border-purple-900/20">
                   Generate Preventive Alerts with Evidence Frames
                </p>
              </div>
            </div>
          </div>

          {/* 5. OPERATIONAL PROTOCOL (4-STEP FLOW) */}
          <div className="bg-slate-900/30 p-12 rounded-[3rem] border border-slate-900">
            <div className="text-center mb-12">
               <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Operational Protocol</h2>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
               {[
                 { step: '01', title: 'Upload Footage', icon: 'fa-upload' },
                 { step: '02', title: 'AI Analysis', icon: 'fa-microchip' },
                 { step: '03', title: 'Incident Flagging', icon: 'fa-flag' },
                 { step: '04', title: 'Officer Review', icon: 'fa-user-tie' },
               ].map((protocol, i) => (
                 <React.Fragment key={i}>
                    <div className="flex-1 text-center space-y-4">
                       <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-blue-500">
                          <i className={`fa-solid ${protocol.icon} text-xl`}></i>
                       </div>
                       <div>
                         <span className="block text-[10px] font-mono text-slate-600 mb-1">{protocol.step}</span>
                         <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{protocol.title}</h4>
                       </div>
                    </div>
                    {i < 3 && <div className="hidden md:block text-slate-800"><i className="fa-solid fa-chevron-right"></i></div>}
                 </React.Fragment>
               ))}
            </div>
          </div>

          {/* 6. UPLOAD CALL TO ACTION */}
          <div className="max-w-4xl mx-auto pt-12">
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} disabled={isProcessing} />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`group relative bg-slate-950 border-2 border-slate-900 rounded-[3rem] p-24 text-center ${isSimulated ? 'hover:border-amber-500/50' : 'hover:border-blue-500/50'} transition-all cursor-pointer overflow-hidden shadow-2xl`}
            >
              <div className="relative z-10 space-y-8">
                <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <i className={`fa-solid ${isSimulated ? 'fa-vial' : 'fa-plus'} text-4xl text-slate-700 group-hover:text-blue-500`}></i>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-[0.4em]">Initiate Scan</h3>
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-4">Import evidence footage for neural evaluation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROCESSING STATE */}
      {isProcessing && (
        <div className="max-w-4xl mx-auto bg-slate-950 border border-slate-800 rounded-[3rem] p-24 text-center animate-pulse mt-20">
          <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] mb-10">{status}</h3>
          <div className="w-full max-w-sm h-1.5 bg-slate-900 rounded-full mx-auto overflow-hidden">
             <div className={`${isSimulated ? 'bg-amber-500' : 'bg-blue-500'} h-full transition-all duration-700`} style={{ width: `${progress}%` }}></div>
          </div>
          <p className="mt-8 text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Federal Decryption Protocol Active</p>
        </div>
      )}

      {/* RESULT STATE */}
      {primaryIncident && !isProcessing && (
        <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1000 max-w-6xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-8">
             <div className="space-y-1">
               <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Primary Threat Identification</h2>
               <p className={`text-xs ${isSimulated ? 'text-amber-500' : 'text-blue-500'} font-bold uppercase tracking-widest`}>
                  {isSimulated ? 'Simulated Logic Trace' : 'Neural Core: Processing Success'}
               </p>
             </div>
             <button 
               onClick={() => { setPrimaryIncident(null); setVideoUrl(null); }} 
               className="h-10 px-6 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all tracking-widest"
             >
               Discard & Scan New
             </button>
          </div>

          <EvidenceCard incident={primaryIncident} videoUrl={videoUrl} />
        </div>
      )}
    </div>
  );
};

const EvidenceCard: React.FC<{ incident: Incident, videoUrl: string | null }> = ({ incident, videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.currentTime = timestampToSeconds(incident.timestamp);
    }
  }, [videoUrl, incident.timestamp]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      <div className="lg:col-span-7 space-y-12">
        <div className="relative aspect-video w-full bg-black rounded-[3rem] overflow-hidden border border-slate-800 shadow-2xl group">
          <video ref={videoRef} src={videoUrl || ''} className="w-full h-full object-contain" playsInline />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
               onClick={() => {
                 if (videoRef.current?.paused) videoRef.current.play();
                 else videoRef.current?.pause();
                 setIsPlaying(!isPlaying);
               }}
               className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl shadow-2xl hover:scale-110 transition-transform"
             >
               <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1'}`}></i>
             </button>
          </div>
          <div className="absolute top-8 left-8 flex items-center gap-3">
             <span className="bg-rose-600 text-[10px] font-black text-white px-4 py-1.5 rounded-sm uppercase tracking-widest">Live Evidence Playback</span>
             <span className="bg-black/80 backdrop-blur px-4 py-1.5 rounded-sm text-[10px] font-mono text-white/90 tracking-widest border border-white/10">MARKER: {incident.timestamp}</span>
          </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Forensic Behavioral Log</h3>
           <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[2.5rem] relative overflow-hidden">
              <i className="fa-solid fa-quote-left absolute top-8 left-8 text-6xl opacity-5 text-blue-500"></i>
              <p className="text-2xl text-slate-100 font-bold italic leading-relaxed relative z-10 pl-4">
                 "{incident.description}"
              </p>
           </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-12">
         <div className="space-y-2">
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Threat Vector</h4>
            <h3 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{incident.type}</h3>
            <div className="flex items-center gap-2 text-slate-400 mt-4">
               <i className="fa-solid fa-location-dot text-rose-500"></i>
               <span className="text-sm font-black uppercase tracking-[0.2em]">{incident.location}</span>
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] space-y-6">
            <div>
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Confidence Index</span>
              <div className="flex items-baseline gap-2">
                 <span className="text-7xl font-black text-white tracking-tighter">{Math.round(incident.confidence * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full mt-6 overflow-hidden">
                 <div className="bg-blue-600 h-full shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-1000" style={{ width: `${incident.confidence * 100}%` }}></div>
              </div>
            </div>

            <div className="pt-6 space-y-4">
               <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Tracked Entities</span>
               <div className="flex flex-wrap gap-2">
                  {incident.detectedObjects.map((obj, i) => (
                    <span key={i} className="px-5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:border-blue-500 transition-colors">
                       {obj}
                    </span>
                  ))}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white font-black py-5 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all">Confirm Threat</button>
            <button className="bg-slate-900 text-slate-400 border border-slate-800 font-black py-5 rounded-2xl text-[11px] uppercase tracking-widest hover:text-white transition-all">Flag False Alert</button>
         </div>
      </div>
    </div>
  );
};

export default Upload;
