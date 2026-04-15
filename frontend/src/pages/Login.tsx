import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Loader2, AlertCircle, Lock, Mail } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { login, usuario } = useAuth();
    const navigate = useNavigate();

    // Se já estiver logado, redireciona para o dashboard
    if (usuario) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setIsSubmitting(true);

        try {
            await login(email, senha);
            navigate('/');
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20">
                        <span className="text-white font-bold text-2xl">MS</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Monitora Saúde</h1>
                    <p className="text-slate-500 mt-2 font-medium">Gestão Inteligente para Saúde Pública</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {erro && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium animate-shake">
                                <AlertCircle size={18} />
                                <span>{erro}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-80 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Entrando...</span>
                                </>
                            ) : (
                                <span>Entrar no Sistema</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <p className="text-slate-400 text-sm">
                            Esqueceu sua senha? <span className="text-blue-600 font-bold hover:underline cursor-pointer">Recuperar</span>
                        </p>
                    </div>
                </div>
                
                <p className="text-center mt-8 text-slate-400 text-[11px] font-medium uppercase tracking-[0.2em]">
                    HealthTech Solutions © 2026
                </p>
            </div>
        </div>
    );
};

export default Login;
