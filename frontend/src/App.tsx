import React from 'react';
import Dashboard from './pages/Dashboard';
import { LayoutDashboard, FileUp, Settings, LogOut } from 'lucide-react';

function App() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 p-6 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SB</span>
          </div>
          <span className="font-bold text-white text-xl tracking-tight">Brasil 360</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<FileUp size={20} />} label="Importar Dados" />
          <NavItem icon={<Settings size={20} />} label="Configurações" />
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <NavItem icon={<LogOut size={20} />} label="Sair" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <Dashboard />
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <a 
    href="#" 
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
        : 'hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </a>
);

export default App;
