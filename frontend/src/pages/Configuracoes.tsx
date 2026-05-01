import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi, type Usuario } from '../services/usuariosApi';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Pencil, Trash2, KeyRound, X, Eye, EyeOff,
  Users, ShieldCheck, AlertTriangle, Check,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const GRADIENT_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-purple-600',
];

function avatarGradient(nome: string) {
  const idx = nome.charCodeAt(0) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[idx];
}

// ─── Componentes de UI ───────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border shadow-2xl"
        style={{ background: '#0e1525', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-white text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 border outline-none transition-colors focus:border-indigo-500 ${props.className ?? ''}`}
      style={{ background: '#161e30', borderColor: 'rgba(255,255,255,0.1)', ...props.style }}
    />
  );
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Mínimo 6 caracteres'}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function Btn({ children, variant = 'primary', onClick, disabled, type = 'button' }: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25',
    ghost:   'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10',
    danger:  'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/25',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]}`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {children}
    </button>
  );
}

function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl
      ${ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {ok ? <Check size={15} /> : <AlertTriangle size={15} />}
      {message}
    </div>
  );
}

// ─── Modal Criar / Editar ────────────────────────────────────────

function ModalUsuario({ usuario, onClose }: { usuario: Usuario | null; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!usuario;
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? usuariosApi.atualizar(usuario!.id, { nome, email })
        : usuariosApi.criar({ nome, email, senha }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); onClose(); },
    onError: (e: any) => setErro(e.response?.data?.error ?? 'Erro inesperado.'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    mutation.mutate();
  };

  return (
    <Modal title={isEdit ? 'Editar Usuário' : 'Novo Usuário'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle size={14} /> {erro}
          </div>
        )}
        <Field label="Nome completo">
          <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" required />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@municipio.gov.br" required />
        </Field>
        {!isEdit && (
          <Field label="Senha inicial">
            <PasswordInput value={senha} onChange={setSenha} />
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Reset de Senha ─────────────────────────────────────────

function ModalResetSenha({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const qc = useQueryClient();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');

  const mutation = useMutation({
    mutationFn: () => usuariosApi.resetarSenha(usuario.id, novaSenha),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); onClose(); },
    onError: (e: any) => setErro(e.response?.data?.error ?? 'Erro inesperado.'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    if (novaSenha.length < 6) { setErro('Senha deve ter ao menos 6 caracteres.'); return; }
    mutation.mutate();
  };

  return (
    <Modal title="Redefinir Senha" onClose={onClose}>
      <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient(usuario.nome)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {initials(usuario.nome)}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{usuario.nome}</p>
          <p className="text-slate-500 text-xs">{usuario.email}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle size={14} /> {erro}
          </div>
        )}
        <Field label="Nova senha">
          <PasswordInput value={novaSenha} onChange={setNovaSenha} />
        </Field>
        <Field label="Confirmar nova senha">
          <PasswordInput value={confirmar} onChange={setConfirmar} placeholder="Repita a nova senha" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Redefinir senha'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Confirmar Exclusão ────────────────────────────────────

function ModalExcluir({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => usuariosApi.excluir(usuario.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); onClose(); },
  });

  return (
    <Modal title="Excluir Usuário" onClose={onClose}>
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
          <Trash2 size={24} className="text-red-400" />
        </div>
        <div>
          <p className="text-white font-semibold">{usuario.nome}</p>
          <p className="text-slate-400 text-sm mt-1">
            Esta ação é permanente e não pode ser desfeita.<br />
            O usuário perderá acesso imediatamente.
          </p>
        </div>
        <div className="flex justify-center gap-2 pt-1">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Excluindo...' : 'Sim, excluir'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tab: Usuários ───────────────────────────────────────────────

function TabUsuarios() {
  const { usuario: eu } = useAuth();
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.listar().then(r => r.data),
  });

  const [modalCriar, setModalCriar] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [resetando, setResetando] = useState<Usuario | null>(null);
  const [excluindo, setExcluindo] = useState<Usuario | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const showToast = (message: string, ok = true) => {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleModalClose = (type: 'criar' | 'editar' | 'reset' | 'excluir', success = false) => {
    if (type === 'criar') setModalCriar(false);
    if (type === 'editar') setEditando(null);
    if (type === 'reset') setResetando(null);
    if (type === 'excluir') setExcluindo(null);
    if (success) {
      const msgs: Record<string, string> = {
        criar: 'Usuário criado com sucesso.',
        editar: 'Usuário atualizado.',
        reset: 'Senha redefinida com sucesso.',
        excluir: 'Usuário excluído.',
      };
      showToast(msgs[type]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header da tab */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Users size={18} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-none"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Usuários do Sistema
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setModalCriar(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Plus size={15} /> Novo usuário
        </button>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: '#0b1220', borderColor: 'rgba(255,255,255,0.07)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">Usuário</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">E-mail</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">Perfil</th>
              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    Carregando usuários...
                  </div>
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-500">Nenhum usuário cadastrado.</td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const isMe = String(u.id) === String(eu?.id);
                return (
                  <tr key={u.id} className="border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {/* Avatar + nome */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient(u.nome)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {initials(u.nome)}
                        </div>
                        <div>
                          <p className="text-white font-semibold leading-tight">{u.nome}</p>
                          {isMe && (
                            <span className="text-[10px] text-indigo-400 font-semibold">Você</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-5 py-3.5 text-slate-400">{u.email}</td>
                    {/* Perfil */}
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <ShieldCheck size={11} /> Administrador
                      </span>
                    </td>
                    {/* Ações */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn
                          icon={<Pencil size={13} />}
                          label="Editar"
                          onClick={() => setEditando(u)}
                          color="indigo"
                        />
                        <ActionBtn
                          icon={<KeyRound size={13} />}
                          label="Resetar senha"
                          onClick={() => setResetando(u)}
                          color="amber"
                        />
                        <ActionBtn
                          icon={<Trash2 size={13} />}
                          label="Excluir"
                          onClick={() => setExcluindo(u)}
                          color="red"
                          disabled={isMe}
                          title={isMe ? 'Não é possível excluir sua própria conta' : undefined}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modais */}
      {modalCriar && (
        <ModalUsuario usuario={null} onClose={() => handleModalClose('criar')} />
      )}
      {editando && (
        <ModalUsuario usuario={editando} onClose={() => handleModalClose('editar')} />
      )}
      {resetando && (
        <ModalResetSenha usuario={resetando} onClose={() => handleModalClose('reset')} />
      )}
      {excluindo && (
        <ModalExcluir usuario={excluindo} onClose={() => handleModalClose('excluir')} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} ok={toast.ok} />}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, color, disabled, title }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  color: 'indigo' | 'amber' | 'red'; disabled?: boolean; title?: string;
}) {
  const colors = {
    indigo: 'hover:bg-indigo-500/15 hover:text-indigo-300 text-slate-500',
    amber:  'hover:bg-amber-500/15 hover:text-amber-300 text-slate-500',
    red:    'hover:bg-red-500/15 hover:text-red-300 text-slate-500',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${colors[color]} disabled:opacity-30 disabled:cursor-not-allowed`}>
      {icon}
    </button>
  );
}

// ─── Página Principal ─────────────────────────────────────────────

const TABS = [
  { id: 'usuarios', label: 'Usuários', icon: <Users size={15} /> },
];

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('usuarios');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Configurações
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie usuários e preferências do sistema.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="page-enter">
        {activeTab === 'usuarios' && <TabUsuarios />}
      </div>
    </div>
  );
}
