
import React, { useState } from 'react';
import { Incident, IncidentStatus } from '../types';

interface IncidentsProps {
  incidents: Incident[];
  onUpdateStatus: (id: string, status: IncidentStatus) => void;
}

const Incidents: React.FC<IncidentsProps> = ({ incidents, onUpdateStatus }) => {
  const [filter, setFilter] = useState<IncidentStatus | 'All'>('All');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);

  const filtered = filter === 'All' ? incidents : incidents.filter(i => i.status === filter);

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'Needs Review': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Confirmed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'False Alarm': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return '';
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Incident Repository</h1>
          <p className="text-slate-400">Manage and review all system-detected events.</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['All', 'Needs Review', 'Confirmed', 'Resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
          {filtered.map((incident) => (
            <div
              key={incident.id}
              onClick={() => setSelectedIncident(incident)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                selectedIncident?.id === incident.id
                  ? 'bg-slate-800 border-blue-500/50 ring-1 ring-blue-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">#{incident.id}</span>
              </div>
              <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{incident.type}</h4>
              <p className="text-xs text-slate-500 mb-3">{incident.location}</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <i className="fa-solid fa-clock"></i>
                  {new Date(incident.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400">
                  {Math.round(incident.confidence * 100)}% Confidence
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-8 overflow-y-auto">
          {selectedIncident ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{selectedIncident.type}</h2>
                    <span className={`text-xs px-2 py-1 rounded-md border font-bold ${getStatusColor(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                  </div>
                  <p className="text-slate-400 flex items-center gap-2">
                    <i className="fa-solid fa-location-dot text-red-400"></i> {selectedIncident.location}
                    <span className="mx-2 text-slate-700">|</span>
                    <i className="fa-solid fa-video text-slate-500"></i> {selectedIncident.videoRef}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onUpdateStatus(selectedIncident.id, 'Confirmed')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-check"></i> Confirm Incident
                  </button>
                  <button 
                    onClick={() => onUpdateStatus(selectedIncident.id, 'False Alarm')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    False Alarm
                  </button>
                </div>
              </div>

              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black relative group">
                <img 
                  src={selectedIncident.snapshotUrl} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  alt="Incident Snapshot" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                  <div className="flex items-center gap-4 text-xs font-mono text-white/70">
                    <span className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded backdrop-blur">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> REC 00:45:12
                    </span>
                    <span className="bg-black/40 px-2 py-1 rounded backdrop-blur">{selectedIncident.videoRef}</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white">
                    <i className="fa-solid fa-expand"></i>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-300 text-sm uppercase tracking-wider">Detection Logic</h4>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <p className="text-slate-300 leading-relaxed italic">"{selectedIncident.description}"</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedIncident.detectedObjects.map((obj, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-full border border-slate-700">
                        {obj.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-300 text-sm uppercase tracking-wider">Timeline</h4>
                  <div className="space-y-3">
                    {[
                      { t: 'T-10s', msg: 'Normal flow. 4 vehicles, 2 pedestrians detected.' },
                      { t: 'T-2s', msg: 'Erratic trajectory detected (Object: Motorcycle).' },
                      { t: '0s', msg: 'Event Trigger: Impact vector detected.' },
                      { t: '+5s', msg: 'Incident flagged for human review.' }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <span className="text-[10px] font-mono text-blue-400 w-10 text-right shrink-0">{step.t}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 shrink-0"></div>
                        <p className="text-xs text-slate-500">{step.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <i className="fa-solid fa-inbox text-6xl mb-4 opacity-20"></i>
              <p>Select an incident to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Incidents;
