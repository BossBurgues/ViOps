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
  // --- Loja → Central ---
  {
    from: 'aberta',
    to: 'enviada_central',
    label: 'Enviar para Central',
    roles: ['admin', 'gestor', 'vendedor'],
    requiresConfirmation: true,
    confirmMessage: 'Confirma o envio desta OS para a central de producao?',
  },
  {
    from: 'aberta',
    to: 'cancelada',
    label: 'Cancelar OS',
    roles: ['admin', 'gestor'],
    requiresConfirmation: true,
    confirmMessage: 'Esta acao nao pode ser desfeita. Confirma o cancelamento?',
  },
  // --- Central: receber ---
  {
    from: 'enviada_central',
    to: 'recebida',
    label: 'Confirmar Recebimento',
    roles: ['admin', 'operador'],
    requiresConfirmation: false,
  },
  // --- Central: produzir (from legacy 'recebida' or new 'recebida') ---
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
  // --- Central → Unidade — canonical forward path uses semantic alias ---
  {
    from: 'pronta',
    to: 'enviada_unidade',
    label: 'Enviar para Unidade',
    roles: ['admin', 'operador'],
    requiresConfirmation: true,
    confirmMessage: 'Confirma o envio desta OS para a unidade de origem?',
  },
  // --- Legacy compat: 'enviada' → 'entregue' (for OSs persisted with the old status) ---
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
  // --- enviada_unidade alias (semantic duplicate of 'enviada') ---
  {
    from: 'enviada_unidade',
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
  'aberta', 'enviada_central', 'recebida', 'producao', 'pendencia',
  'pronta', 'enviada', 'enviada_unidade', 'entregue', 'cancelada',
];

export function getStatusStep(status: OSStatus): number {
  const map: Record<OSStatus, number> = {
    aberta: 0,
    enviada_central: 0,
    recebida: 0,
    producao: 1,
    pendencia: 1,
    pronta: 2,
    enviada: 3,
    enviada_unidade: 3,
    entregue: 4,
    cancelada: -1,
  };
  return map[status];
}

export function canEditOS(status: OSStatus, role: UserRole): { allowed: boolean; reason?: string } {
  if (status === 'cancelada') return { allowed: false, reason: 'OS cancelada nao pode ser editada.' };
  if (status === 'entregue') return { allowed: false, reason: 'OS entregue nao pode ser editada.' };
  if (['pronta', 'enviada', 'enviada_unidade'].includes(status) && !['admin'].includes(role)) {
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
