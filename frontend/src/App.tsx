import React, { useState } from 'react';
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
import EsusDashboard from './pages/esus/EsusDashboard';
import EsusPatients from './pages/esus/EsusPatients';
import EsusReferrals from './pages/esus/EsusReferrals';
import EsusQueue from './pages/esus/EsusQueue';
import EsusProduction from './pages/esus/EsusProduction';
import EsusIndicators from './pages/esus/EsusIndicators';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  LayoutDashboard, Activity, Wallet, Package, Users, List,
  ClipboardList, HeartPulse, Newspaper, Settings, LogOut,
  ArrowRightLeft, Menu, X, ChevronRight,
} from 'lucide-react';

// ─── Tipos ──────────────────────────────────────────────────────

type NavColor = 'indigo' | 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'cyan' | 'teal' | 'fuchsia';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  color?: NavColor;
  badge?: number;
}

// ─── Paleta de cores por módulo ──────────────────────────────────

const colorMap: Record<NavColor, { active: string; icon: string; glow: string }> = {
  indigo:  { active: 'from-indigo-500 to-violet-600',   icon: 'text-indigo-400',  glow: 'shadow-indigo-500/40' },
  blue:    { active: 'from-blue-500 to-indigo-600',     icon: 'text-blue-400',    glow: 'shadow-blue-500/40' },
  emerald: { active: 'from-emerald-500 to-teal-600',    icon: 'text-emerald-400', glow: 'shadow-emerald-500/40' },
  violet:  { active: 'from-violet-500 to-purple-600',   icon: 'text-violet-400',  glow: 'shadow-violet-500/40' },
  rose:    { active: 'from-rose-500 to-pink-600',       icon: 'text-rose-400',    glow: 'shadow-rose-500/40' },
  amber:   { active: 'from-amber-500 to-orange-600',    icon: 'text-amber-400',   glow: 'shadow-amber-500/40' },
  cyan:    { active: 'from-cyan-500 to-blue-600',       icon: 'text-cyan-400',    glow: 'shadow-cyan-500/40' },
  teal:    { active: 'from-teal-500 to-emerald-600',    icon: 'text-teal-400',    glow: 'shadow-teal-500/40' },
  fuchsia: { active: 'from-fuchsia-500 to-violet-600',  icon: 'text-fuchsia-400', glow: 'shadow-fuchsia-500/40' },
};

// ─── NavItem ─────────────────────────────────────────────────────

function NavItem({ to, icon, label, active = false, color = 'indigo', badge }: NavItemProps) {
  const c = colorMap[color];
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold relative overflow-hidden ${
        active
          ? `bg-gradient-to-r ${c.active} text-white shadow-lg ${c.glow}`
          : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <span className={`shrink-0 transition-colors ${active ? 'text-white' : c.icon}`}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {active && (
        <ChevronRight size={14} className="shrink-0 text-white/60" />
      )}
    </Link>
  );
}

// ─── Section Label ────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-6 pb-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const p = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const initials = usuario?.nome
    ? usuario.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside
      className="sidebar-scroll flex flex-col h-full overflow-y-auto"
      style={{ background: '#060b17' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <HeartPulse size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-base leading-none tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              SisSaúde
            </p>
            <p className="text-indigo-400 font-bold text-[11px] leading-none tracking-widest mt-0.5">
              360
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <SectionLabel>Principal</SectionLabel>

        <NavItem to="/" icon={<LayoutDashboard size={17} />} label="Hub Principal"
          active={p === '/'} color="indigo" />

        <SectionLabel>Módulos</SectionLabel>

        <NavItem to="/aps"         icon={<Activity size={17} />}      label="Atenção Primária"    active={p === '/aps'}         color="blue" />
        <NavItem to="/financeiro"  icon={<Wallet size={17} />}        label="Financeiro"          active={p === '/financeiro'}  color="emerald" />
        <NavItem to="/almoxarifado" icon={<Package size={17} />}      label="Almoxarifado"        active={p.startsWith('/almoxarifado')} color="amber" />
        <NavItem to="/pessoas"     icon={<Users size={17} />}         label="Gestão de Pessoas"   active={p === '/pessoas'}     color="violet" />
        <NavItem to="/fila"        icon={<ArrowRightLeft size={17} />} label="Regulação / Fila"   active={p === '/fila'}        color="rose" />
        <NavItem to="/admin-planejamento" icon={<ClipboardList size={17} />} label="Admin & Planejamento"
          active={p.startsWith('/admin-planejamento')} color="cyan" />
        <NavItem to="/admin-planejamento/diario" icon={<Newspaper size={17} />} label="Diário Oficial"
          active={p === '/admin-planejamento/diario'} color="teal" />

        <SectionLabel>e-SUS PEC</SectionLabel>

        <NavItem to="/esus"             icon={<HeartPulse size={17} />}     label="Dashboard e-SUS"    active={p === '/esus'}             color="fuchsia" />
        <NavItem to="/esus/patients"    icon={<Users size={17} />}          label="Pacientes"           active={p === '/esus/patients'}    color="violet" />
        <NavItem to="/esus/referrals"   icon={<ArrowRightLeft size={17} />} label="Encaminhamentos"    active={p === '/esus/referrals'}   color="blue" />
        <NavItem to="/esus/queue"       icon={<List size={17} />}           label="Fila de Regulação"  active={p === '/esus/queue'}       color="rose" />
        <NavItem to="/esus/production"  icon={<Activity size={17} />}      label="Produção"            active={p === '/esus/production'}  color="emerald" />
        <NavItem to="/esus/indicators"  icon={<ClipboardList size={17} />} label="Indicadores SB360"  active={p === '/esus/indicators'}  color="amber" />

        <SectionLabel>Sistema</SectionLabel>
        <NavItem to="#" icon={<Settings size={17} />} label="Configurações" color="indigo" />
      </nav>

      {/* User card */}
      <div className="shrink-0 mx-3 mb-4 mt-2">
        <div className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {usuario?.nome}
            </p>
            <p className="text-slate-500 text-[10px] truncate">{usuario?.email}</p>
          </div>
          <button onClick={handleLogout}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sair">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── App Content ─────────────────────────────────────────────────

function AppContent() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLogin = location.pathname === '/login';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080d1a' }}>
      {/* Desktop Sidebar */}
      {usuario && !isLogin && (
        <div className="hidden lg:flex flex-col w-60 shrink-0 border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {usuario && !isLogin && mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-60 z-50 lg:hidden border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        {usuario && !isLogin && (
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0"
            style={{ background: '#060b17', borderColor: 'rgba(255,255,255,0.05)' }}>
            <button onClick={() => setMobileOpen(true)}
              className="text-slate-400 hover:text-white transition-colors">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                <HeartPulse size={12} className="text-white" />
              </div>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                SisSaúde 360
              </span>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto page-enter">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/"                                element={<Dashboard />} />
              <Route path="/aps"                             element={<AtencaoPrimaria />} />
              <Route path="/financeiro"                      element={<GestaoFinanceira />} />
              <Route path="/almoxarifado"                    element={<Almoxarifado />} />
              <Route path="/almoxarifado-novo"               element={<Almoxarifado />} />
              <Route path="/pessoas"                         element={<GestaoPessoas />} />
              <Route path="/fila"                            element={<GestaoFila />} />
              <Route path="/admin-planejamento"              element={<AdminPlanejamento />} />
              <Route path="/admin-planejamento/admin"        element={<Administracao />} />
              <Route path="/admin-planejamento/planejamento" element={<Planejamento />} />
              <Route path="/admin-planejamento/diario"       element={<DiarioOficialMonitor />} />
              <Route path="/esus"                            element={<EsusDashboard />} />
              <Route path="/esus/patients"                   element={<EsusPatients />} />
              <Route path="/esus/referrals"                  element={<EsusReferrals />} />
              <Route path="/esus/queue"                      element={<EsusQueue />} />
              <Route path="/esus/production"                 element={<EsusProduction />} />
              <Route path="/esus/indicators"                 element={<EsusIndicators />} />
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────

const queryClient = new QueryClient();

export default function App() {
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
