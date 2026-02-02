
import React, { useState } from 'react';
import { Incident } from '../types';

interface IncidentsProps {
  incidents: Incident[];
}

const Incidents: React.FC<IncidentsProps> = ({ incidents }) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-900 pb-10">
        <div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">Evidence <span className="text-blue-500">Vault</span></h1>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Confederated archive of confirmed neural detections</p>
        </div>
        <div className="bg-slate-900 px-10 py-5 rounded-3xl border border-slate-800 text-center shadow-2xl">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Records</span>
          <span className="text-3xl font-black text-white">{incidents.length}</span>
        </div>
      </div>

      {incidents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-slate-950 border border-slate-900 rounded-[3.5rem] overflow-hidden group hover:border-blue-600/50 transition-all shadow-2xl flex flex-col">
              
              {/* IMAGE/SNAPSHOT PART */}
              <div className="relative aspect-video bg-black overflow-hidden group/image">
                <img src={inc.snapshotUrl} className="w-full h-full object-cover opacity-60 group-hover/image:opacity-100 transition-all duration-500 scale-105 group-hover/image:scale-100" alt="Incident Snapshot" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-white shadow-xl ${inc.type.includes('Collision') || inc.type.includes('Weapon') ? 'bg-red-600' : 'bg-blue-600'}`}>
                      {inc.type}
                   </div>
                </div>

                {/* Play Button Overlay */}
                <button 
                  onClick={() => setSelectedIncident(inc)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity"
                >
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white text-xl hover:scale-110 transition-transform">
                     <i className="fa-solid fa-circle-play"></i>
                  </div>
                </button>
              </div>

              {/* DATA PART */}
              <div className="p-10 space-y-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{inc.id}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{inc.savedAt}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-500 font-black text-xl">{Math.round(inc.confidence * 100)}%</span>
                    <span className="block text-[8px] font-black text-slate-700 uppercase">Match</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-900">
                  <p className="text-xs text-slate-300 italic line-clamp-2">"{inc.description}"</p>
                </div>

                <div className="pt-4 border-t border-slate-900 mt-auto flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-location-dot text-rose-600 text-[10px]"></i>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{inc.location}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedIncident(inc)}
                    className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    View Video Feed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center opacity-20">
          <i className="fa-solid fa-box-open text-9xl mb-10"></i>
          <h2 className="text-3xl font-black uppercase tracking-[0.6em]">No Evidence Logs</h2>
        </div>
      )}

      {/* VIDEO MODAL (ENSURE VIDEO IS VISIBLE) */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-[#020617]/98 backdrop-blur-md" onClick={() => setSelectedIncident(null)}></div>
          <div className="relative w-full max-w-6xl bg-black rounded-[4rem] overflow-hidden border-8 border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95">
            
            {/* VIDEO PLAYER */}
            <div className="aspect-video bg-black relative">
              <video 
                src={selectedIncident.localVideoUrl} 
                className="w-full h-full object-contain"
                autoPlay 
                controls
              />
              
              {/* HUD OVERLAY */}
              <div className="absolute top-10 left-10 pointer-events-none">
                 <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-xl">
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Evidence Archive // {selectedIncident.id}</p>
                    <h2 className="text-2xl font-black text-white uppercase">{selectedIncident.type}</h2>
                 </div>
              </div>
            </div>

            {/* DETAILS DRAWER */}
            <div className="bg-slate-950 p-10 flex items-center justify-between border-t border-slate-900">
               <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Grid Coordinates</p>
                  <p className="text-white text-lg font-bold">{selectedIncident.location}</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setSelectedIncident(null)} className="px-10 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all">
                    Dismiss Evidence
                  </button>
               </div>
            </div>

            <button 
              onClick={() => setSelectedIncident(null)}
              className="absolute top-10 right-10 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl border border-white/20 transition-all"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;
