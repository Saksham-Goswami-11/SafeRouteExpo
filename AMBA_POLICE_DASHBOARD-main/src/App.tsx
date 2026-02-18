import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useAlerts } from './hooks/useAlerts';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import IncidentDetails from './components/IncidentDetails';
import './App.css';

function Dashboard() {
  const { officer, signOut, session } = useAuth();
  const { alerts, newAlertId, resolveAlert, error } = useAlerts();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || null;



  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar
        alerts={alerts}
        selectedAlertId={selectedAlertId}
        onSelectAlert={setSelectedAlertId}
        officer={officer}
        onSignOut={signOut}
        newAlertId={newAlertId}
        error={error}
        userId={session?.user.id}
      />

      <Map alerts={alerts} selectedAlert={selectedAlert} />

      {selectedAlert && (
        <IncidentDetails
          alert={selectedAlert}
          onClose={() => setSelectedAlertId(null)}
          onResolve={resolveAlert}
        />
      )}
    </div>
  );
}

function App() {
  const { session } = useAuth();



  if (!session) return <Login />;

  return <Dashboard />;
}

export default App;
