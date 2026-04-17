import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import Spinner from '../ui/Spinner'
import {
  parseProductFile,
  processRows,
  collectUnresolvedCategories,
  findCategoryMatch,
  normalize,
} from '../../utils/productImport'
import {
  getCategories,
  addCategory,
  bulkAddProducts,
  getAllProductBarcodes,
} from '../../lib/firestore'

const PHASES = {
  idle: 'idle',
  loading: 'loading',
  preview: 'preview',
  importing: 'importing',
  done: 'done',
}

export default function BulkImportModal({ open, onClose }) {
  const [phase, setPhase] = useState(PHASES.idle)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryDecisions, setCategoryDecisions] = useState([])
  const [duplicatePolicy, setDuplicatePolicy] = useState('skip')
  const [progress, setProgress] = useState({ written: 0, total: 0 })
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!open) {
      setPhase(PHASES.idle)
      setError('')
      setRows([])
      setCategoryDecisions([])
      setProgress({ written: 0, total: 0 })
      setSummary(null)
    }
  }, [open])

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setPhase(PHASES.loading)
    try {
      const [rawRows, cats, barcodes] = await Promise.all([
        parseProductFile(file),
        getCategories(),
        getAllProductBarcodes(),
      ])
      if (!rawRows.length) {
        setError('El archivo no tiene filas')
        setPhase(PHASES.idle)
        return
      }
      setCategories(cats)
      const processed = processRows(rawRows, cats, barcodes)
      setRows(processed)
      setCategoryDecisions(collectUnresolvedCategories(processed))
      setPhase(PHASES.preview)
    } catch (err) {
      console.error(err)
      setError('No se pudo leer el archivo. Verifica que sea .xlsx o .csv valido.')
      setPhase(PHASES.idle)
    }
  }

  function toggleSkip(rowIndex) {
    setRows((prev) =>
      prev.map((r) =>
        r.rowIndex === rowIndex && r.errors.length === 0 ? { ...r, skip: !r.skip } : r
      )
    )
  }

  function updateCategoryDecision(key, patch) {
    setCategoryDecisions((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  }

  async function handleImport() {
    setError('')
    setPhase(PHASES.importing)

    const catMap = new Map(categoryDecisions.map((c) => [c.key, c]))
    const workingCategories = [...categories]
    const createdCategories = []

    const resolveCategoryName = async (input) => {
      if (!input) return ''
      const key = normalize(input)
      const decision = catMap.get(key)

      if (!decision) {
        const match = findCategoryMatch(input, workingCategories)
        return match.type === 'exact' ? match.category.name : input
      }
      if (decision.decision === 'use-existing' && decision.suggestion) {
        return decision.suggestion.name
      }
      if (decision.decision === 'skip') return ''
      const exists = workingCategories.find((c) => normalize(c.name) === key)
      if (exists) return exists.name
      try {
        const created = await addCategory(input)
        workingCategories.push(created)
        createdCategories.push(created.name)
        return created.name
      } catch (err) {
        console.error('addCategory failed', err)
        return input
      }
    }

    try {
      const toImport = []
      let updatedCount = 0
      let skippedDup = 0
      for (const row of rows) {
        if (row.skip || row.errors.length) continue
        if (row.duplicateBarcode && duplicatePolicy === 'skip') {
          skippedDup++
          continue
        }
        const category = await resolveCategoryName(row.normalized.categoryInput)
        toImport.push({
          name: row.normalized.name,
          price: row.normalized.price,
          costPrice: row.normalized.costPrice,
          stock: row.normalized.stock,
          unit: row.normalized.unit,
          barcode: row.normalized.barcode,
          category,
          active: row.normalized.active,
        })
      }

      setProgress({ written: 0, total: toImport.length })
      await bulkAddProducts(toImport, {
        onProgress: (written, total) => setProgress({ written, total }),
      })

      setSummary({
        imported: toImport.length,
        skippedErrors: rows.filter((r) => r.errors.length).length,
        skippedManual: rows.filter((r) => r.skip && !r.errors.length).length,
        skippedDup,
        updated: updatedCount,
        createdCategories,
      })
      setPhase(PHASES.done)
    } catch (err) {
      console.error(err)
      setError('Error al importar. Revisa la consola.')
      setPhase(PHASES.preview)
    }
  }

  if (!open) return null

  const importable = rows.filter((r) => !r.skip && !r.errors.length)
  const errorCount = rows.filter((r) => r.errors.length).length

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex w-full max-w-5xl flex-col bg-white shadow-xl sm:my-4 sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Importar productos</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-800"
            aria-label="Cerrar"
          >×</button>
        </header>

        <div className="flex-1 overflow-auto px-6 py-4">
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

          {phase === PHASES.idle && (
            <div className="flex flex-col gap-4 py-8 text-center">
              <p className="text-sm text-gray-600">
                Subi un archivo <strong>.xlsx</strong> o <strong>.csv</strong> con la plantilla del sistema.
                Columnas obligatorias: <strong>nombre, precio, stock</strong>.
              </p>
              <label className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFile}
                />
                Elegir archivo
              </label>
            </div>
          )}

          {phase === PHASES.loading && (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          )}

          {phase === PHASES.preview && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <span><strong>{rows.length}</strong> filas leidas</span>
                <span className="text-emerald-700"><strong>{importable.length}</strong> a importar</span>
                {errorCount > 0 && (
                  <span className="text-red-700"><strong>{errorCount}</strong> con errores (se descartan)</span>
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm">
                <label className="font-medium text-gray-700">Si un codigo de barras ya existe:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={duplicatePolicy === 'skip'}
                      onChange={() => setDuplicatePolicy('skip')}
                    />
                    Saltar
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={duplicatePolicy === 'create'}
                      onChange={() => setDuplicatePolicy('create')}
                    />
                    Crear igual (duplicar)
                  </label>
                </div>
              </div>

              {categoryDecisions.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-amber-900">Categorias a resolver</h3>
                  <ul className="flex flex-col gap-3">
                    {categoryDecisions.map((cd) => (
                      <li key={cd.key} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className="font-medium">"{cd.input}"</span>
                          <span className="text-gray-500"> - {cd.rows.length} fila{cd.rows.length !== 1 ? 's' : ''}</span>
                          {cd.suggestion && (
                            <span className="ml-2 text-amber-800">
                              ¿parecida a <strong>{cd.suggestion.name}</strong>?
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cd.suggestion && (
                            <button
                              onClick={() => updateCategoryDecision(cd.key, { decision: 'use-existing' })}
                              className={`rounded border px-3 py-1 text-xs ${cd.decision === 'use-existing' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-700'}`}
                            >
                              Usar "{cd.suggestion.name}"
                            </button>
                          )}
                          <button
                            onClick={() => updateCategoryDecision(cd.key, { decision: 'create' })}
                            className={`rounded border px-3 py-1 text-xs ${cd.decision === 'create' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-700'}`}
                          >
                            Crear nueva
                          </button>
                          <button
                            onClick={() => updateCategoryDecision(cd.key, { decision: 'skip' })}
                            className={`rounded border px-3 py-1 text-xs ${cd.decision === 'skip' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-700'}`}
                          >
                            Dejar vacia
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Incluir</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Precio</th>
                      <th className="px-3 py-2">Costo</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Categoria</th>
                      <th className="px-3 py-2">Codigo</th>
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const hasError = row.errors.length > 0
                      const dup = row.duplicateBarcode
                      return (
                        <tr
                          key={row.rowIndex}
                          className={hasError ? 'bg-red-50' : row.skip ? 'bg-gray-50 text-gray-400' : ''}
                        >
                          <td className="px-3 py-2 text-xs text-gray-500">{row.rowIndex}</td>
                          <td className="px-3 py-2">
                            {hasError ? (
                              <span className="text-xs text-red-700">—</span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={!row.skip}
                                onChange={() => toggleSkip(row.rowIndex)}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2">{row.normalized.name || <em className="text-red-600">faltante</em>}</td>
                          <td className="px-3 py-2">{Number.isFinite(row.normalized.price) ? row.normalized.price : '—'}</td>
                          <td className="px-3 py-2">{row.normalized.costPrice}</td>
                          <td className="px-3 py-2">{row.normalized.stock}</td>
                          <td className="px-3 py-2">
                            {row.normalized.categoryInput || <span className="text-xs text-gray-400">sin categoria</span>}
                          </td>
                          <td className="px-3 py-2">{row.normalized.barcode || '—'}</td>
                          <td className="px-3 py-2 text-xs">
                            {hasError && <span className="text-red-700">{row.errors.join(', ')}</span>}
                            {!hasError && dup && <span className="text-amber-700">codigo duplicado · </span>}
                            {!hasError && row.warnings.length > 0 && (
                              <span className="text-amber-700">{row.warnings.join(', ')}</span>
                            )}
                            {!hasError && row.autofilled.length > 0 && (
                              <span className="text-gray-500"> ({row.autofilled.join(', ')})</span>
                            )}
                            {!hasError && !dup && !row.warnings.length && !row.autofilled.length && (
                              <span className="text-emerald-700">OK</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {phase === PHASES.importing && (
            <div className="flex flex-col items-center gap-4 py-16">
              <Spinner />
              <p className="text-sm text-gray-600">
                Importando {progress.written} / {progress.total}
              </p>
            </div>
          )}

          {phase === PHASES.done && summary && (
            <div className="flex flex-col gap-3 py-6 text-sm">
              <h3 className="text-base font-semibold text-emerald-700">Importacion completa</h3>
              <ul className="flex flex-col gap-1 text-gray-700">
                <li>✓ {summary.imported} productos creados</li>
                {summary.skippedDup > 0 && <li>• {summary.skippedDup} saltados por codigo de barras duplicado</li>}
                {summary.skippedManual > 0 && <li>• {summary.skippedManual} descartados manualmente</li>}
                {summary.skippedErrors > 0 && <li>• {summary.skippedErrors} filas con errores ignoradas</li>}
                {summary.createdCategories.length > 0 && (
                  <li>• Categorias nuevas: {summary.createdCategories.join(', ')}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {phase === PHASES.preview && (
            <>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleImport} disabled={importable.length === 0}>
                Importar {importable.length}
              </Button>
            </>
          )}
          {phase === PHASES.done && <Button onClick={onClose}>Cerrar</Button>}
          {(phase === PHASES.idle || phase === PHASES.loading || phase === PHASES.importing) && (
            <Button variant="ghost" onClick={onClose} disabled={phase === PHASES.importing}>
              {phase === PHASES.importing ? 'Importando...' : 'Cerrar'}
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}
