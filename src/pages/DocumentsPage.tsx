import { type ChangeEvent, type DragEvent, type FormEvent, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle2, CloudUpload, FileText, Loader2, Upload, X } from 'lucide-react'
import { ApiError, api } from '@/api/client'
import { Chip } from '@/components/Chip'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, LoadingState, Section } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseLocalDate } from '@/lib/date'
import { plural } from '@/lib/utils'
import { db, type LocalDocument } from '@/offline/db'
import { usePlacement } from '@/offline/hooks/usePlacement'

type DocumentKind = 'AGREEMENT' | 'INSURANCE' | 'REPORT' | 'EVIDENCE'

// Espejo de REQUIRED_DOCS en el backend (placement.service.ts): estos dos son
// los únicos que bloquean la activación de la práctica.
const REQUIRED_KINDS: DocumentKind[] = ['AGREEMENT', 'INSURANCE']

const KIND_LABEL: Record<DocumentKind, string> = {
  AGREEMENT: 'Convenio',
  INSURANCE: 'Seguro',
  REPORT: 'Informe',
  EVIDENCE: 'Evidencia',
}

const DOC_ROW_CLASS = 'flex min-h-row items-center justify-between gap-4 px-[18px] py-2.5'

function formatDate(dateValue: string): string {
  const parsed = parseLocalDate(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Último estado conocido de un tipo de documento, o `null` si no se subió. */
function latestStatus(documents: LocalDocument[], kind: DocumentKind): string | null {
  return (
    documents
      .filter((doc) => doc.kind === kind)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]?.status ?? null
  )
}

function RequiredStatus({ documents, kind }: { documents: LocalDocument[] | undefined; kind: DocumentKind }) {
  if (documents === undefined) return <span className="text-12 text-inkSoft">Cargando…</span>
  const status = latestStatus(documents, kind)
  if (status) return <StatusBadge status={status} />
  return <Chip tone="void">Falta subir</Chip>
}

function RequiredDocuments({ documents }: { documents: LocalDocument[] | undefined }) {
  return (
    <Section title="Obligatorios para activar la práctica">
      <div className="divide-y divide-paperRule">
        {REQUIRED_KINDS.map((kind) => (
          <div key={kind} className={DOC_ROW_CLASS}>
            <span className="text-14 font-semibold text-ink">{KIND_LABEL[kind]}</span>
            <RequiredStatus documents={documents} kind={kind} />
          </div>
        ))}
      </div>
    </Section>
  )
}

function DocumentsList({ documents }: { documents: LocalDocument[] | undefined }) {
  if (documents === undefined) {
    return (
      <Section title="Todos tus documentos">
        <LoadingState>Cargando documentos…</LoadingState>
      </Section>
    )
  }

  if (documents.length === 0) {
    return (
      <Section title="Todos tus documentos">
        <EmptyState
          title="Todavía no has subido documentos"
          description="Empieza por el convenio y el seguro."
        />
      </Section>
    )
  }

  return (
    <Section
      title="Todos tus documentos"
      aside={
        <span className="font-data text-12 text-inkSoft">
          {plural(documents.length, 'documento', 'documentos')}
        </span>
      }
    >
      <div className="divide-y divide-paperRule">
        {documents.map((doc, index) => (
          <div key={index} className={DOC_ROW_CLASS}>
            <div className="min-w-0">
              <div className="truncate text-14 font-semibold text-ink">{doc.filename}</div>
              <div className="mt-0.5 text-12 text-inkSoft">
                {KIND_LABEL[doc.kind as DocumentKind] ?? doc.kind} ·{' '}
                <span className="font-data">{formatDate(doc.updatedAt)}</span>
              </div>
            </div>
            <StatusBadge status={doc.status} />
          </div>
        ))}
      </div>
    </Section>
  )
}

export function DocumentsPage() {
  const placement = usePlacement()
  const documents = useLiveQuery<LocalDocument[] | undefined>(async () => {
    if (!placement) return undefined
    return db.documents.where('placementId').equals(placement.id).toArray()
  }, [placement?.id])

  const [kind, setKind] = useState<DocumentKind>('AGREEMENT')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (placement === undefined) {
    return <LoadingState>Cargando tu práctica…</LoadingState>
  }

  if (placement === null) {
    return (
      <EmptyState
        title="No tienes una práctica activa todavía"
        description="Cuando la coordinación active tu plaza, vas a poder subir documentos."
      />
    )
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUploadError(null)

    if (!file) {
      setUploadError('Por favor selecciona o arrastra un archivo para continuar')
      return
    }

    setUploading(true)
    try {
      const created = await api<LocalDocument>(`/placements/${placement!.id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          kind,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          // No hay almacenamiento de archivos real en este template: es un
          // identificador de referencia, no una URL donde recuperar el
          // archivo. Cada equipo conecta su propio storage sobre este campo.
          storageKey: crypto.randomUUID(),
        }),
      })
      await db.documents.put(created)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'No se pudo subir el documento')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    if (selected) setUploadError(null)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setUploadError(null)
      if (fileInputRef.current) {
        try {
          const dt = new DataTransfer()
          dt.items.add(droppedFile)
          fileInputRef.current.files = dt.files
        } catch {
          // ignore if DataTransfer constructor is unsupported
        }
      }
    }
  }

  function handleRemoveFile() {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="A diferencia del libro de horas, subir un documento necesita conexión."
      />

      <RequiredDocuments documents={documents} />

      <Section title="Subir documento">
        <form className="flex flex-col gap-5 px-[18px] py-4" onSubmit={handleUpload} noValidate>
          <div className="flex flex-col gap-1.5 sm:max-w-xs">
            <Label htmlFor="document-kind" className="font-semibold text-ink">
              Tipo de documento
            </Label>
            <Select value={kind} onValueChange={(value) => setKind(value as DocumentKind)}>
              <SelectTrigger id="document-kind" className="bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABEL) as DocumentKind[]).map((kindOption) => (
                  <SelectItem key={kindOption} value={kindOption}>
                    <div className="flex items-center gap-2">
                      <span>{KIND_LABEL[kindOption]}</span>
                      {REQUIRED_KINDS.includes(kindOption) && (
                        <span className="text-11 text-inkSoft font-normal">
                          (Requisito obligatorio)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="document-file" className="font-semibold text-ink">
                Archivo o documento
              </Label>
              <span className="text-11 text-inkSoft">Máximo 15 MB</span>
            </div>

            <input
              id="document-file"
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="sr-only"
              tabIndex={-1}
            />

            {!file ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-7 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-stamp ${
                  isDragging
                    ? 'border-stamp bg-stamp/10 ring-4 ring-stamp/20 scale-[1.01]'
                    : 'border-line bg-surface/50 hover:border-stamp/60 hover:bg-soft/50 shadow-sm'
                }`}
              >
                <div
                  className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                    isDragging
                      ? 'scale-125 bg-stamp text-white shadow-md'
                      : 'bg-stamp/10 text-stamp group-hover:scale-110 group-hover:bg-stamp/15 shadow-sm'
                  }`}
                >
                  <CloudUpload className="h-7 w-7" />
                </div>

                {isDragging ? (
                  <>
                    <p className="text-15 font-bold text-stamp animate-pulse">
                      ¡Suelta tu archivo aquí para cargarlo!
                    </p>
                    <p className="mt-1 text-12 text-stamp/80">
                      El documento quedará preparado para la subida
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-14 font-semibold text-ink">
                      Arrastra y suelta tu archivo aquí
                    </p>
                    <p className="mt-1 text-13 text-inkSoft">
                      o{' '}
                      <span className="font-semibold text-stamp underline decoration-stamp/40 underline-offset-2 group-hover:decoration-stamp">
                        haz clic para explorar
                      </span>{' '}
                      desde tus carpetas
                    </p>
                    <p className="mt-2.5 text-11 text-inkMute">
                      Formatos compatibles: PDF, Word (DOCX), imágenes (PNG, JPG)
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl border border-stamp/30 bg-stamp/5 p-4 transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stamp text-white shadow-sm">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-14 font-semibold text-ink" title={file.name}>
                          {file.name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-11 font-medium text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Archivo listo
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-12 text-inkSoft">
                        <span className="font-data font-medium">{formatFileSize(file.size)}</span>
                        <span>·</span>
                        <span>
                          Listo para subir como <strong>{KIND_LABEL[kind]}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-12 font-medium"
                    >
                      Cambiar
                    </Button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-inkSoft transition-colors hover:bg-void/10 hover:text-void"
                      title="Quitar archivo"
                      aria-label="Quitar archivo seleccionado"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {uploadError ? (
            <p role="alert" className="rounded-md bg-chipVoid px-3 py-2.5 text-13 font-medium text-void">
              {uploadError}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 font-semibold !text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Subiendo documento…</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Subir documento</span>
                </>
              )}
            </Button>
            {file && (
              <span className="text-12 text-inkSoft">
                Se guardará y enviará para revisión
              </span>
            )}
          </div>
        </form>
      </Section>

      <DocumentsList documents={documents} />
    </>
  )
}

