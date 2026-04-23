import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp, availableProfiles } from '@/contexts/AppContext';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();
  const [email, setEmail] = useState('ricardo@viops.com');
  const [password, setPassword] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('usr1');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const profile = availableProfiles.find(p => p.user.id === selectedProfile);
    if (profile) {
      setCurrentUser(profile.user);
    }
    setTimeout(() => {
      toast.success(`Bem-vindo, ${profile?.user.nome || 'Usuario'}`, {
        description: `Perfil: ${profile?.label || 'Administrador'}`,
      });
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-[52%] flex-col justify-between bg-sidebar p-14 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/15">
            <Eye className="h-5 w-5 text-sidebar-primary" />
          </div>
          <span className="text-[22px] font-bold tracking-tight text-sidebar-primary-foreground">
            Vi<span className="text-sidebar-primary">Ops</span>
          </span>
        </div>

        <div className="max-w-lg space-y-6">
          <h1 className="text-[32px] font-bold leading-[1.15] tracking-tight text-sidebar-primary-foreground">
            Gestao operacional<br />inteligente para<br />redes de oticas
          </h1>
          <p className="max-w-sm text-[15px] leading-relaxed text-sidebar-foreground">
            Centralize ordens de servico, producao, financeiro e atendimento em uma unica plataforma.
            Rastreabilidade completa do pedido a entrega.
          </p>
          <div className="flex gap-8 pt-2">
            <div>
              <p className="text-2xl font-bold text-sidebar-primary-foreground">100%</p>
              <p className="text-[11px] uppercase tracking-widest text-sidebar-foreground/60">Digital</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sidebar-primary-foreground">360°</p>
              <p className="text-[11px] uppercase tracking-widest text-sidebar-foreground/60">Visao completa</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sidebar-primary-foreground">SaaS</p>
              <p className="text-[11px] uppercase tracking-widest text-sidebar-foreground/60">Multi-unidade</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-sidebar-foreground/40">ViOps v1.0 — Todos os direitos reservados</p>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-8 lg:w-[48%]">
        <div className="w-full max-w-[380px] space-y-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-[18px] w-[18px] text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Vi<span className="text-primary">Ops</span>
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-[22px] font-bold text-foreground">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground">Informe suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Demo profile selector */}
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Perfil de Demonstracao</p>
              <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map(p => (
                    <SelectItem key={p.user.id} value={p.user.id}>
                      {p.user.nome} — {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Selecione um perfil para simular diferentes niveis de acesso ao sistema.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-medium text-foreground">Senha</Label>
                <button type="button" className="text-[12px] font-medium text-primary hover:underline">Esqueceu?</button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full text-[13px] font-semibold" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-[12px] text-muted-foreground">
            Acesso restrito a usuarios autorizados da rede.
          </p>
        </div>
      </div>
    </div>
  );
}
