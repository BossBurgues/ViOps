import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Upload, FileText, Image, Trash2, Download, Eye, X,
  FileCheck, AlertCircle, FolderOpen, Paperclip
} from 'lucide-react';
import { toast } from 'sonner';

export type DocCategoria = 'receita' | 'guia_medica' | 'laudo' | 'complementar' | 'comprovante';

const CATEGORIAS: { value: DocCategoria; label: string; icon: React.ElementType }[] = [
  { value: 'receita', label: 'Receita / Prescricao', icon: FileCheck },
  { value: 'guia_medica', label: 'Guia Medica', icon: FileText },
  { value: 'laudo', label: 'Laudo / Exame', icon: FileText },
  { value: 'complementar', label: 'Documento Complementar', icon: FolderOpen },
  { value: 'comprovante', label: 'Comprovante / Outro', icon: Paperclip },
];

const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg,.webp';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface OSDocumento {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  categoria: DocCategoria;
  dataUpload: string;
  usuario: string;
  previewUrl?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(tipo: string) {
  if (tipo.startsWith('image/')) return Image;
  return FileText;
}

function getCategoriaLabel(cat: DocCategoria) {
  return CATEGORIAS.find(c => c.value === cat)?.label || cat;
}

// ---- Upload component for OS creation wizard ----
interface OSDocUploadProps {
  documentos: OSDocumento[];
  onAdd: (docs: OSDocumento[]) => void;
  onRemove: (id: string) => void;
  onCategoriaChange: (id: string, cat: DocCategoria) => void;
  disabled?: boolean;
}

export function OSDocUpload({ documentos, onAdd, onRemove, onCategoriaChange, disabled }: OSDocUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newDocs: OSDocumento[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: excede 10MB`);
        return;
      }
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      if (!isImage && !isPdf) {
        errors.push(`${file.name}: formato nao suportado`);
        return;
      }

      newDocs.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        categoria: 'receita',
        dataUpload: new Date().toISOString(),
        usuario: '',
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      });
    });

    if (errors.length) {
      toast.error('Alguns arquivos nao foram aceitos', { description: errors.join('; ') });
    }
    if (newDocs.length) {
      onAdd(newDocs);
      toast.success(`${newDocs.length} documento(s) adicionado(s)`);
    }
  }, [onAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) processFiles(e.dataTransfer.files);
  }, [disabled, processFiles]);

  const grouped = CATEGORIAS.map(cat => ({
    ...cat,
    docs: documentos.filter(d => d.categoria === cat.value),
  })).filter(g => g.docs.length > 0);

  const missingRequired = !documentos.some(d => d.categoria === 'receita');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Documentos e Anexos</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Anexe receitas, laudos, guias medicas e comprovantes.</p>
        </div>
        <span className="text-[11px] text-muted-foreground">{documentos.length} arquivo(s)</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors py-10 px-6 ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
        } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 mb-3">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <p className="text-[13px] font-medium text-foreground">
          {dragOver ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">PDF, PNG, JPG/JPEG — maximo 10MB por arquivo</p>
      </div>

      {/* Missing required alert */}
      {missingRequired && documentos.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg bg-warning/5 border border-warning/15 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-[12px] font-medium text-foreground">Receita/Prescricao nao anexada</p>
            <p className="text-[11px] text-muted-foreground">Recomendamos anexar a receita medica para rastreabilidade completa.</p>
          </div>
        </div>
      )}

      {/* Grouped documents */}
      {grouped.length > 0 ? (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-2">
                <group.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{group.label}</span>
                <span className="text-[10px] text-muted-foreground/60">({group.docs.length})</span>
              </div>
              <div className="space-y-2">
                {group.docs.map(doc => {
                  const Icon = getFileIcon(doc.tipo);
                  const isImage = doc.tipo.startsWith('image/');
                  return (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors group">
                      {isImage && doc.previewUrl ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img src={doc.previewUrl} alt={doc.nome} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{doc.nome}</p>
                        <p className="text-[11px] text-muted-foreground">{formatFileSize(doc.tamanho)}</p>
                      </div>
                      <Select value={doc.categoria} onValueChange={(v) => onCategoriaChange(doc.id, v as DocCategoria)}>
                        <SelectTrigger className="h-8 w-[180px] text-[11px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map(c => (
                            <SelectItem key={c.value} value={c.value} className="text-[12px]">{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isImage && doc.previewUrl && (
                          <button onClick={(e) => { e.stopPropagation(); setPreviewUrl(doc.previewUrl!); }} className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setRemoveId(doc.id); }} className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Paperclip className="h-5 w-5 text-muted-foreground/40 mb-2" />
          <p className="text-[12px] text-muted-foreground">Nenhum documento anexado</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Receitas, guias e laudos aparecerao aqui</p>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-h-[85vh] max-w-[85vw]">
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-3 -right-3 z-10 rounded-full bg-card p-1.5 shadow-lg border border-border hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
            <img src={previewUrl} alt="Preview" className="max-h-[85vh] max-w-[85vw] rounded-xl shadow-2xl" />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Remover documento"
        description="Deseja remover este documento? Esta acao nao pode ser desfeita."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => { if (removeId) { onRemove(removeId); setRemoveId(null); toast.success('Documento removido'); } }}
      />
    </div>
  );
}

// ---- Read-only display for OS detail page ----
interface OSDocDisplayProps {
  documentos: OSDocumento[];
}

export function OSDocDisplay({ documentos }: OSDocDisplayProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const grouped = CATEGORIAS.map(cat => ({
    ...cat,
    docs: documentos.filter(d => d.categoria === cat.value),
  })).filter(g => g.docs.length > 0);

  const hasReceita = documentos.some(d => d.categoria === 'receita');

  if (documentos.length === 0) {
    return (
      <div className="page-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="section-title">Documentos</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10">
          <Paperclip className="h-6 w-6 text-muted-foreground/40 mb-2" />
          <p className="text-[13px] text-muted-foreground">Nenhum documento anexado</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Receitas, laudos e documentos aparecerao aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <h2 className="section-title">Documentos ({documentos.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          {!hasReceita && (
            <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
              <AlertCircle className="h-3 w-3" />Sem receita
            </span>
          )}
          {hasReceita && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <FileCheck className="h-3 w-3" />Receita anexada
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {grouped.map(group => (
          <div key={group.value} className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <group.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{group.label}</span>
            </div>
            <div className="space-y-2">
              {group.docs.map(doc => {
                const Icon = getFileIcon(doc.tipo);
                const isImage = doc.tipo.startsWith('image/');
                return (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 group">
                    {isImage && doc.previewUrl ? (
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img src={doc.previewUrl} alt={doc.nome} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{doc.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatFileSize(doc.tamanho)} — {doc.usuario || 'Sistema'} — {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isImage && doc.previewUrl && (
                        <button onClick={() => setPreviewUrl(doc.previewUrl!)} className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground" title="Visualizar">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground" title="Baixar"
                        onClick={() => toast.info('Download iniciado', { description: doc.nome })}>
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-h-[85vh] max-w-[85vw]">
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-3 -right-3 z-10 rounded-full bg-card p-1.5 shadow-lg border border-border hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
            <img src={previewUrl} alt="Preview" className="max-h-[85vh] max-w-[85vw] rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
