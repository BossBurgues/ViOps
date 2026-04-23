import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, FileText, Factory, DollarSign,
  Shield, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, Menu, Eye,
  Bell, ChevronDown, Check, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp, availableProfiles } from '@/contexts/AppContext';
import { unidades } from '@/data/mockData';
import { roleLabels } from '@/data/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole } from '@/data/types';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'gestor', 'vendedor', 'operador', 'financeiro'] as UserRole[] },
      { label: 'Ordens de Servico', icon: FileText, path: '/ordens', roles: ['admin', 'gestor', 'vendedor'] as UserRole[] },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { label: 'Clientes', icon: Users, path: '/clientes', roles: ['admin', 'gestor', 'vendedor'] as UserRole[] },
      { label: 'Unidades', icon: Building2, path: '/unidades', roles: ['admin', 'gestor'] as UserRole[] },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { label: 'Central / Fabrica', icon: Factory, path: '/central', roles: ['admin', 'gestor', 'operador'] as UserRole[] },
      { label: 'Financeiro', icon: DollarSign, path: '/financeiro', roles: ['admin', 'gestor', 'financeiro'] as UserRole[] },
    ],
  },
  {
    label: 'Administracao',
    items: [
      { label: 'Usuarios', icon: Shield, path: '/usuarios', roles: ['admin'] as UserRole[] },
      { label: 'Relatorios', icon: BarChart3, path: '/relatorios', roles: ['admin', 'gestor'] as UserRole[] },
      { label: 'Auditoria', icon: Activity, path: '/auditoria', roles: ['admin'] as UserRole[] },
      { label: 'Configuracoes', icon: Settings, path: '/configuracoes', roles: ['admin'] as UserRole[] },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { currentUser, setCurrentUser, selectedUnidadeId, setSelectedUnidadeId, redeNome } = useApp();

  const selectedUnidade = unidades.find(u => u.id === selectedUnidadeId);
  const activeUnidades = unidades.filter(u => u.ativa);

  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(currentUser.role)),
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 lg:relative',
          collapsed ? 'w-[72px]' : 'w-[248px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-16 items-center shrink-0',
          collapsed ? 'justify-center px-3' : 'px-5'
        )}>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/15">
              <Eye className="h-[18px] w-[18px] text-sidebar-primary" />
            </div>
            {!collapsed && (
              <span className="text-[17px] font-bold tracking-tight text-sidebar-primary-foreground">
                Vi<span className="text-sidebar-primary">Ops</span>
              </span>
            )}
          </Link>
        </div>

        {/* Profile switcher (demo) */}
        {!collapsed && (
          <div className="mx-3 mb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-lg bg-sidebar-accent/60 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/20 text-[10px] font-bold text-sidebar-primary">
                    {currentUser.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[12px] font-semibold text-sidebar-primary-foreground">{currentUser.nome}</p>
                    <p className="truncate text-[10px] text-sidebar-foreground">{roleLabels[currentUser.role]}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Alternar Perfil (Demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableProfiles.map(p => (
                  <DropdownMenuItem
                    key={p.user.id}
                    onClick={() => setCurrentUser(p.user)}
                    className="text-[13px]"
                  >
                    <span className="flex-1">{p.user.nome}</span>
                    <span className="text-[11px] text-muted-foreground">{p.label}</span>
                    {currentUser.id === p.user.id && <Check className="ml-2 h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <p className="mb-1 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="my-3 mx-2 h-px bg-sidebar-border" />}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                          active
                            ? 'bg-sidebar-accent text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-sidebar-primary' : ''
                        )} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-muted lg:hidden">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div className="hidden items-center gap-3 lg:flex">
              <div>
                <p className="text-[13px] font-semibold text-foreground leading-tight">{redeNome}</p>
              </div>
              <div className="h-5 w-px bg-border" />
              {/* Unit selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedUnidadeId === 'todas' ? 'Todas as unidades' : selectedUnidade?.nome.replace('Visual Premium - ', '') || 'Unidade'}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Filtrar por Unidade</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedUnidadeId('todas')} className="text-[13px]">
                    <span className="flex-1">Todas as unidades</span>
                    {selectedUnidadeId === 'todas' && <Check className="ml-2 h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                  {activeUnidades.map(u => (
                    <DropdownMenuItem key={u.id} onClick={() => setSelectedUnidadeId(u.id)} className="text-[13px]">
                      <span className="flex-1">{u.nome.replace('Visual Premium - ', '')}</span>
                      {selectedUnidadeId === u.id && <Check className="ml-2 h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {currentUser.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-[13px] font-medium text-foreground leading-tight">{currentUser.nome}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabels[currentUser.role]}</p>
              </div>
            </div>
            <Link to="/" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
