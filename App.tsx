
import React, { useState } from 'react';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import LiveFeed from './pages/LiveFeed';
import { Incident, NavigationTab, IncidentStatus } from './types';

const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.Upload);
  const [isSimulated, setIsSimulated] = useState<boolean>(!process.env.API_KEY);

  const handleNewIncident = (incident: Incident) => {
    setIncidents(prev => [incident, ...prev]);
  };

  const handleUpdateStatus = (id: string, status: IncidentStatus) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
  };

  const renderContent = () => {
    switch (activeTab) {
      case NavigationTab.Dashboard:
        return <Dashboard incidents={incidents} />;
      case NavigationTab.Incidents:
        return <Incidents incidents={incidents} onUpdateStatus={handleUpdateStatus} />;
      case NavigationTab.LiveFeed:
        return <LiveFeed />;
      case NavigationTab.Upload:
      default:
        return <Upload onNewIncident={handleNewIncident} isSimulated={isSimulated} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30 font-sans">
      {/* HUD Header */}
      <header className="h-20 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-900 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <i className="fa-solid fa-shield-halved text-lg"></i>
          </div>
          <div className="h-6 w-[1px] bg-slate-800"></div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white">
              Sentinel <span className="text-blue-600">Command</span>
            </h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Autonomous Defense Node v4.0.2</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-slate-800/50">
          {[
            { id: NavigationTab.Upload, label: 'Neural Scan', icon: 'fa-microchip' },
            { id: NavigationTab.Dashboard, label: 'Strategic Hub', icon: 'fa-chart-line' },
            { id: NavigationTab.Incidents, label: 'Evidence', icon: 'fa-folder-open' },
            { id: NavigationTab.LiveFeed, label: 'Live Feeds', icon: 'fa-tower-broadcast' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
             <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isSimulated ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className={isSimulated ? 'text-amber-500' : 'text-emerald-500'}>
                  {isSimulated ? 'SIMULATION MODE' : 'AI ACTIVE'}
                </span>
             </div>
          </div>
          <button 
            onClick={() => setIsSimulated(!isSimulated)}
            className={`h-10 px-4 rounded-xl border ${isSimulated ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' : 'border-slate-800 bg-slate-900 text-slate-500'} flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:text-white transition-all`}
            title="Toggle Neural Simulation"
          >
            <i className={`fa-solid ${isSimulated ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2`}></i>
            Sim Mode
          </button>
        </div>
      </header>

      <main className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <footer className="py-12 text-center border-t border-slate-900/30">
        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.8em]">Classified Federal Data Access Only</p>
      </footer>
    </div>
  );
};

export default App;
