import { OSStatus, UserRole } from './types';

export interface OSTransition {
  from: OSStatus;
  to: OSStatus;
  label: string;
  roles: UserRole[];
  requiresConfirmation: boolean;
  confirmMessage?: string;
  blocked?: (context: OSWorkflowContext) => string | null;
}

export interface OSWorkflowContext {
  status: OSStatus;
  hasOverduePayments: boolean;
  allPaymentsPaid: boolean;
  userRole: UserRole;
}

export const OS_TRANSITIONS: OSTransition[] = [
  {
    from: 'recebida',
    to: 'producao',
    label: 'Iniciar Producao',
    roles: ['admin', 'operador'],
    requiresConfirmation: true,
    confirmMessage: 'Confirma o inicio da producao desta OS?',
  },
  {
    from: 'recebida',
    to: 'cancelada',
    label: 'Cancelar OS',
    roles: ['admin', 'gestor'],
    requiresConfirmation: true,
    confirmMessage: 'Esta acao nao pode ser desfeita. Confirma o cancelamento?',
  },
  {
    from: 'producao',
    to: 'pendencia',
    label: 'Registrar Pendencia',
    roles: ['admin', 'operador'],
    requiresConfirmation: true,
    confirmMessage: 'Registrar pendencia nesta OS? Informe o motivo nas observacoes.',
  },
  {
    from: 'producao',
    to: 'pronta',
    label: 'Concluir Producao',
    roles: ['admin', 'operador'],
    requiresConfirmation: true,
    confirmMessage: 'Confirma que a producao foi concluida e passou pelo controle de qualidade?',
  },
  {
    from: 'pendencia',
    to: 'producao',
    label: 'Retomar Producao',
    roles: ['admin', 'operador'],
    requiresConfirmation: true,
    confirmMessage: 'A pendencia foi resolvida? Confirma o retorno para producao?',
  },
  {
    from: 'pendencia',
    to: 'cancelada',
    label: 'Cancelar OS',
    roles: ['admin', 'gestor'],
    requiresConfirmation: true,
    confirmMessage: 'Esta acao nao pode ser desfeita. Confirma o cancelamento?',
  },
  {
    from: 'pronta',
    to: 'enviada',
    label: 'Enviar para Unidade',
    roles: ['admin', 'operador'],
    requiresConfirmation: true,
    confirmMessage: 'Confirma o envio desta OS para a unidade de origem?',
  },
  {
    from: 'enviada',
    to: 'entregue',
    label: 'Registrar Entrega',
    roles: ['admin', 'gestor', 'vendedor'],
    requiresConfirmation: true,
    confirmMessage: 'Confirma a entrega ao cliente?',
    blocked: (ctx) => {
      if (ctx.hasOverduePayments) {
        return 'Entrega bloqueada: existem parcelas vencidas. Regularize o financeiro antes de entregar.';
      }
      return null;
    },
  },
];

export function getAvailableTransitions(
  currentStatus: OSStatus,
  userRole: UserRole,
  context: Omit<OSWorkflowContext, 'status' | 'userRole'>
): (OSTransition & { blockReason: string | null })[] {
  return OS_TRANSITIONS
    .filter(t => t.from === currentStatus && t.roles.includes(userRole))
    .map(t => ({
      ...t,
      blockReason: t.blocked?.({ ...context, status: currentStatus, userRole }) || null,
    }));
}

export const STATUS_ORDER: OSStatus[] = [
  'recebida', 'producao', 'pendencia', 'pronta', 'enviada', 'entregue', 'cancelada'
];

export function getStatusStep(status: OSStatus): number {
  const map: Record<OSStatus, number> = {
    recebida: 0,
    producao: 1,
    pendencia: 1,
    pronta: 2,
    enviada: 3,
    entregue: 4,
    cancelada: -1,
  };
  return map[status];
}

export function canEditOS(status: OSStatus, role: UserRole): { allowed: boolean; reason?: string } {
  if (status === 'cancelada') return { allowed: false, reason: 'OS cancelada nao pode ser editada.' };
  if (status === 'entregue') return { allowed: false, reason: 'OS entregue nao pode ser editada.' };
  if (['pronta', 'enviada'].includes(status) && !['admin'].includes(role)) {
    return { allowed: false, reason: 'Edicao bloqueada apos producao concluida. Apenas administradores podem editar.' };
  }
  if (['producao', 'pendencia'].includes(status) && !['admin', 'operador'].includes(role)) {
    return { allowed: false, reason: 'Edicao bloqueada durante producao. Apenas operadores e administradores podem editar.' };
  }
  if (!['admin', 'gestor', 'vendedor', 'operador'].includes(role)) {
    return { allowed: false, reason: 'Voce nao tem permissao para editar esta OS.' };
  }
  return { allowed: true };
}
