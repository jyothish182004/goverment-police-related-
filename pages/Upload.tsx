
import React, { useState, useRef } from 'react';
import { analyzeVisualMedia } from '../services/geminiService';
import { Incident, IncidentType } from '../types';

interface UploadProps {
  onNewIncident: (incident: Incident) => void;
  isSimulated?: boolean;
}

const Upload: React.FC<UploadProps> = ({ onNewIncident, isSimulated = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [primaryIncident, setPrimaryIncident] = useState<Incident | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaMimeType, setMediaMimeType] = useState<string>('');
  const [isEmergencyDetected, setIsEmergencyDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPrimaryIncident(null);
    setIsEmergencyDetected(false);
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setMediaMimeType(file.type);
    setIsProcessing(true);
    setStatus('AWAKENING NEURAL CORE...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setStatus('DECRYPTING VISUAL VECTORS...');

        try {
          const detections = await analyzeVisualMedia(base64, file.type, isSimulated, [], file.name);
          
          if (detections && detections.length > 0) {
            const highRiskKeywords = ['collision', 'accident', 'weapon', 'women', 'violence', 'fall'];
            const res = detections.find(d => 
              highRiskKeywords.some(t => d.type.toLowerCase().includes(t))
            ) || detections[0];

            const incident: Incident = {
              id: `ID-${Math.floor(Math.random() * 99999)}`,
              type: (res.type as IncidentType) || 'Suspicious Behavior',
              timestamp: res.timestamp || '00:01',
              location: res.location || 'ACTIVE SECTOR',
              confidence: res.confidence || 0.95,
              videoRef: file.name,
              snapshotUrl: url,
              description: res.description,
              detectedObjects: res.detectedObjects,
              localVideoUrl: url,
              licensePlate: res.licensePlate
            };

            setPrimaryIncident(incident);
            const isEmergency = highRiskKeywords.some(t => incident.type.toLowerCase().includes(t));
            setIsEmergencyDetected(isEmergency);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const getAlertConfig = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('weapon')) return { color: 'bg-amber-600', icon: 'fa-gun', label: 'WEAPON THREAT' };
    if (t.includes('women')) return { color: 'bg-purple-600', icon: 'fa-person-dress-burst', label: 'SAFETY SOS' };
    if (t.includes('fall')) return { color: 'bg-blue-600', icon: 'fa-user-injured', label: 'MEDICAL ALERT' };
    return { color: 'bg-red-600', icon: 'fa-car-burst', label: 'ACCIDENT ALERT' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {!primaryIncident && !isProcessing && (
        <div className="text-center py-32 space-y-12">
           <h1 className="text-[12vw] font-black text-white/10 uppercase leading-none select-none">SCAN FEED</h1>
           <div className="max-w-md mx-auto">
             <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={handleFileChange} />
             <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-12 rounded-[3rem] text-xl uppercase tracking-widest shadow-2xl transition-all">
               Initialize Neural Link
             </button>
           </div>
        </div>
      )}

      {isProcessing && (
        <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-20 h-20 border-8 border-blue-600/20 border-t-blue-500 rounded-full animate-spin"></div>
          <h3 className="text-2xl font-black text-blue-500 uppercase tracking-widest">{status}</h3>
        </div>
      )}

      {primaryIncident && !isProcessing && (
        <div className="space-y-10 animate-in slide-in-from-bottom-10">
          {/* TOP SECTION: VIDEO & ALERT SIDE-BY-SIDE */}
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-[2] bg-black rounded-[3rem] overflow-hidden border-4 border-slate-900 aspect-video relative">
              {mediaMimeType.startsWith('image') ? (
                <img src={mediaUrl!} className="w-full h-full object-contain" />
              ) : (
                <video src={mediaUrl!} className="w-full h-full object-contain" autoPlay muted loop controls />
              )}
            </div>

            <div className="flex-1 space-y-6">
              {isEmergencyDetected ? (
                <div className={`${getAlertConfig(primaryIncident.type).color} p-10 rounded-[3rem] text-white space-y-6 animate-pulse border-4 border-white/20`}>
                  <div className="flex items-center gap-6">
                    <i className={`fa-solid ${getAlertConfig(primaryIncident.type).icon} text-6xl`}></i>
                    <h4 className="text-4xl font-black uppercase tracking-tighter">{getAlertConfig(primaryIncident.type).label}</h4>
                  </div>
                  <p className="text-xl font-bold italic">"{primaryIncident.description}"</p>
                  <button onClick={() => { onNewIncident({...primaryIncident, savedAt: new Date().toLocaleString()}); setPrimaryIncident(null); }} className="w-full bg-white text-black font-black py-6 rounded-2xl uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">Confirm & Archive</button>
                </div>
              ) : (
                <div className="bg-slate-900 p-10 rounded-[3rem] space-y-6 border border-slate-800">
                  <h4 className="text-slate-500 font-black text-xs uppercase tracking-widest">Normal Scene Analysis</h4>
                  <p className="text-white text-lg font-bold">"{primaryIncident.description}"</p>
                  <button onClick={() => { onNewIncident({...primaryIncident, savedAt: new Date().toLocaleString()}); setPrimaryIncident(null); }} className="w-full bg-blue-600 text-white font-black py-6 rounded-2xl uppercase tracking-widest">Archive Evidence</button>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SECTION: DETAILED INFO BELOW */}
          <div className="bg-slate-950 border-4 border-slate-900 rounded-[4rem] p-12 grid grid-cols-1 md:grid-cols-3 gap-10">
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incident Profile</p>
                <h3 className="text-3xl font-black text-white uppercase">{primaryIncident.type}</h3>
                <p className="text-blue-500 font-bold">Confidence: {Math.round(primaryIncident.confidence * 100)}%</p>
             </div>
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactical Location</p>
                <p className="text-2xl font-bold text-white"><i className="fa-solid fa-location-dot text-rose-500 mr-3"></i>{primaryIncident.location}</p>
             </div>
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Identifiers</p>
                <div className="flex flex-wrap gap-2">
                   {primaryIncident.detectedObjects.map((obj, i) => (
                     <span key={i} className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-lg">{obj}</span>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
