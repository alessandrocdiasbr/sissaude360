import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AtencaoPrimaria from './pages/AtencaoPrimaria';
import GestaoFinanceira from './pages/GestaoFinanceira';
import GestaoPessoas from './pages/GestaoPessoas';
import GestaoFila from './pages/GestaoFila';
import AdminPlanejamento from './pages/AdminPlanejamento';
import Administracao from './pages/Administracao';
import Planejamento from './pages/Planejamento';
import Almoxarifado from './pages/Almoxarifado';
import DiarioOficialMonitor from './pages/DiarioOficialMonitor';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LayoutDashboard, FileUp, Settings, LogOut, Activity, Wallet, Package, Users, List, ClipboardList, User } from 'lucide-react';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Só aparece se estiver logado */}
      {usuario && (
        <aside className="w-64 bg-slate-900 text-slate-300 p-6 flex flex-col hidden lg:flex border-r border-slate-800">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-bold text-lg">MS</span>
            </div>
            <span className="font-bold text-white text-xl tracking-tight">Monitora Saúde</span>
          </div>

          <nav className="flex-1 space-y-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3 mb-4">Menu Principal</div>

            <NavItem
              to="/"
              icon={<LayoutDashboard size={20} />}
              label="Hub Principal"
              active={location.pathname === '/'}
            />

            <div className="pt-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3">Módulos</div>

            <NavItem
              to="/aps"
              icon={<Activity size={20} />}
              label="Atenção Primária"
              active={location.pathname === '/aps'}
            />
            <NavItem
              to="/financeiro"
              icon={<Wallet size={20} />}
              label="Financeiro"
              active={location.pathname === '/financeiro'}
            />
            <NavItem
              to="/almoxarifado"
              icon={<Package size={20} />}
              label="Almoxarifado"
              active={location.pathname === '/almoxarifado'}
            />
            <NavItem
              to="/pessoas"
              icon={<Users size={20} />}
              label="Gestão de Pessoas"
              active={location.pathname === '/pessoas'}
            />
            <NavItem
              to="/fila"
              icon={<List size={20} />}
              label="Regulação / Fila"
              active={location.pathname === '/fila'}
            />
            <NavItem
              to="/admin-planejamento"
              icon={<ClipboardList size={20} />}
              label="Admin & Planejamento"
              active={location.pathname.startsWith('/admin-planejamento')}
            />

            <div className="pt-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3">Sistema</div>
            <NavItem to="#" icon={<FileUp size={20} />} label="Importar Dados" />
            <NavItem to="#" icon={<Settings size={20} />} label="Configurações" />
          </nav>

          <div className="pt-6 border-t border-slate-800 space-y-4">
            {/* Perfil do Usuário na Sidebar */}
            <div className="px-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{usuario.nome}</p>
                  <p className="text-[10px] text-slate-500 truncate">{usuario.email}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm w-full hover:bg-red-500/10 hover:text-red-500 text-slate-400"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-slate-50 relative">
        {/* Decorative Background for Main Content */}
        {!['/login'].includes(location.pathname) && (
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
        )}

        <div className="relative h-full overflow-y-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rotas Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/aps" element={<AtencaoPrimaria />} />
              <Route path="/financeiro" element={<GestaoFinanceira />} />
              <Route path="/almoxarifado" element={<Almoxarifado />} />
              <Route path="/almoxarifado-novo" element={<Almoxarifado />} />
              <Route path="/pessoas" element={<GestaoPessoas />} />
              <Route path="/fila" element={<GestaoFila />} />
              <Route path="/admin-planejamento" element={<AdminPlanejamento />} />
              <Route path="/admin-planejamento/admin" element={<Administracao />} />
              <Route path="/admin-planejamento/planejamento" element={<Planejamento />} />
              <Route path="/admin-planejamento/diario" element={<DiarioOficialMonitor />} />
            </Route>
          </Routes>
        </div>
      </main>
    </div>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const NavItem = ({ to, icon, label, active = false }: { to: string, icon: React.ReactNode, label: string, active?: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
      : 'hover:bg-slate-800 hover:text-white text-slate-400'
      }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default App;
