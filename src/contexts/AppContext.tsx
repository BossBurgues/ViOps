import { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/data/types';
import { unidades, rede, usuarios } from '@/data/mockData';

interface AppUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  unidadeId: string;
  avatar?: string;
}

interface AppContextType {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  selectedUnidadeId: string;
  setSelectedUnidadeId: (id: string) => void;
  redeNome: string;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  isRole: (role: UserRole) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUser: AppUser = {
  id: 'usr1',
  nome: 'Ricardo Almeida',
  email: 'ricardo@viops.com',
  role: 'admin',
  unidadeId: 'u1',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser>(defaultUser);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>('todas');

  const hasPermission = (requiredRoles: UserRole[]) => requiredRoles.includes(currentUser.role);
  const isRole = (role: UserRole) => currentUser.role === role;

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      selectedUnidadeId,
      setSelectedUnidadeId,
      redeNome: rede.nome,
      hasPermission,
      isRole,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export const availableProfiles: { user: AppUser; label: string }[] = [
  { user: { id: 'usr1', nome: 'Ricardo Almeida', email: 'ricardo@viops.com', role: 'admin', unidadeId: 'u1' }, label: 'Administrador' },
  { user: { id: 'usr2', nome: 'Carla Mendes', email: 'carla@viops.com', role: 'gestor', unidadeId: 'u1' }, label: 'Gestor de Unidade' },
  { user: { id: 'usr3', nome: 'Fernando Costa', email: 'fernando@viops.com', role: 'vendedor', unidadeId: 'u1' }, label: 'Vendedor/Atendente' },
  { user: { id: 'usr5', nome: 'Marcos Silva', email: 'marcos@viops.com', role: 'operador', unidadeId: 'u1' }, label: 'Operador Central' },
  { user: { id: 'usr6', nome: 'Patricia Nunes', email: 'patricia@viops.com', role: 'financeiro', unidadeId: 'u1' }, label: 'Financeiro' },
];
