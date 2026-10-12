'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MASTER_COLORS } from '@/lib/colorMap'

interface MergedRow {
  sku: string
  rawColor: string
  mappedColor: string | null
  productId: string | null
  productTitle: string | null
}

interface RowState {
  sku: string
  rawColor: string
  mappedColor: string | null
  override: string | null
  productId: string | null
  productTitle: string | null
}

const COLOR_DOTS: Record<string, string> = {
  Black: '#111111',
  White: '#f5f5f5',
  Blue: '#2563eb',
  'Red/Bordeaux': '#9f1239',
  Green: '#16a34a',
  Brown: '#92400e',
  Beige: '#d4a96a',
  Grey: '#6b7280',
  Gold: '#ca8a04',
  Silver: '#94a3b8',
  Pink: '#ec4899',
  Purple: '#9333ea',
  Orange: '#ea580c',
  Yellow: '#eab308',
  Multicolor: 'linear-gradient(135deg, #ef4444, #3b82f6, #22c55e)',
  Camo: '#4d7c0f',
  Crinkle: '#a78bfa',
  Animalier: '#d97706',
}

function ColorDot({ color }: { color: string }) {
  const bg = COLOR_DOTS[color]
  if (bg?.startsWith('linear')) {
    return (
      <span
        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: bg, border: '1px solid rgba(0,0,0,0.1)' }}
      />
    )
  }
  return (
    <span
      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
      style={{
        backgroundColor: bg || '#ccc',
        border: color === 'White' ? '1px solid #d1d5db' : '1px solid rgba(0,0,0,0.1)',
      }}
    />
  )
}

type FilterTab = 'tutti' | 'da-assegnare' | 'mappati'

export default function ReviewPage() {
  const router = useRouter()
  const [rows, setRows] = useState<RowState[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('tutti')
  const [applyStage, setApplyStage] = useState<'idle' | 'applying' | 'done' | 'error' | 'none'>('idle')
  const [applyResult, setApplyResult] = useState<{ success: number; errors: unknown[] } | null>(null)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('colorMapperData')
      if (!raw) {
        router.push('/')
        return
      }
      const data: MergedRow[] = JSON.parse(raw)
      setRows(
        data.map((d) => ({
          sku: d.sku,
          rawColor: d.rawColor,
          mappedColor: d.mappedColor,
          override: null,
          productId: d.productId,
          productTitle: d.productTitle,
        }))
      )
    } catch {
      router.push('/')
    } finally {
      setLoaded(true)
    }
  }, [router])

  const stats = useMemo(() => {
    const automapped = rows.filter((r) => r.mappedColor !== null).length
    const unrecognized = rows.filter((r) => r.mappedColor === null).length
    return { automapped, unrecognized }
  }, [rows])

  const effectiveColor = (row: RowState) => row.override ?? row.mappedColor

  const allHaveColor = useMemo(
    () => rows.length > 0 && rows.every((r) => effectiveColor(r) !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  )

  const actionableRows = useMemo(
    () => rows.filter((r) => r.productId !== null),
    [rows]
  )

  const filteredRows = useMemo(() => {
    if (filter === 'da-assegnare') return rows.filter((r) => r.mappedColor === null)
    if (filter === 'mappati') return rows.filter((r) => r.mappedColor !== null)
    return rows
  }, [rows, filter])

  const setOverride = (sku: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.sku === sku ? { ...r, override: value || null } : r))
    )
  }

  const handleApply = async () => {
    const items = actionableRows
      .map((r) => ({
        productId: r.productId!,
        color: effectiveColor(r) ?? '',
      }))
      .filter((i) => i.color !== '')

    if (items.length === 0) {
      setApplyError('Nessun prodotto con ID Shopify trovato.')
      return
    }

    setApplyStage('applying')
    setApplyError('')

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Errore durante l\'applicazione')
      }

      const result = await res.json()
      setApplyResult(result)
      setApplyStage('done')
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : String(err))
      setApplyStage('error')
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (applyStage === 'done' && applyResult) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Applicazione completata</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-1">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {applyResult.success}
          </span>{' '}
          metafield aggiornati con successo.
        </p>
        {applyResult.errors.length > 0 && (
          <p className="text-red-500 text-sm">
            {applyResult.errors.length} errori durante l&apos;applicazione.
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => {
              localStorage.removeItem('colorMapperData')
              router.push('/')
            }}
            className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
          >
            Nuovo import
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">
            Revisione mappatura colori
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="text-green-600 dark:text-green-400 font-medium">
              {stats.automapped} mappati automaticamente
            </span>
            {stats.unrecognized > 0 && (
              <>
                {' '}·{' '}
                <span className="text-red-500 font-medium">
                  {stats.unrecognized} da assegnare
                </span>
              </>
            )}
            {' '}· {rows.length} SKU totali
          </p>
        </div>

        <div className="flex-shrink-0">
          {applyStage === 'applying' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-500">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-700 rounded-full animate-spin" />
              Applicazione…
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={!allHaveColor || (applyStage as string) === 'applying'}
              className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
            >
              Applica a Shopify
            </button>
          )}
        </div>
      </div>

      {applyStage === 'error' && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {applyError}
        </div>
      )}

      {!allHaveColor && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
          Assegna un colore a tutte le righe per abilitare il pulsante &ldquo;Applica a Shopify&rdquo;.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        {(
          [
            { key: 'tutti', label: `Tutti (${rows.length})` },
            { key: 'da-assegnare', label: `Da assegnare (${stats.unrecognized})` },
            { key: 'mappati', label: `Mappati (${stats.automapped})` },
          ] as { key: FilterTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={[
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              filter === tab.key
                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                  Prodotto
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                  SKU
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                  Colore CSV
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                  Colore mappato
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                  Override
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredRows.map((row) => {
                const effective = effectiveColor(row)
                const isUnmapped = row.mappedColor === null
                return (
                  <tr
                    key={row.sku}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    {/* Product */}
                    <td className="px-4 py-3">
                      {row.productTitle ? (
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate max-w-[200px] block">
                          {row.productTitle}
                        </span>
                      ) : row.productId === null ? (
                        <span className="text-neutral-400 text-xs italic">Non trovato</span>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {row.sku}
                      </code>
                    </td>

                    {/* Raw color */}
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                      {row.rawColor || <span className="italic text-neutral-400">vuoto</span>}
                    </td>

                    {/* Mapped color */}
                    <td className="px-4 py-3">
                      {row.mappedColor ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium">
                          <ColorDot color={row.mappedColor} />
                          {row.mappedColor}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          Non riconosciuto
                        </span>
                      )}
                    </td>

                    {/* Override */}
                    <td className="px-4 py-3">
                      {isUnmapped ? (
                        <select
                          value={row.override ?? ''}
                          onChange={(e) => setOverride(row.sku, e.target.value)}
                          className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                        >
                          <option value="">— Seleziona colore —</option>
                          {MASTER_COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={row.override ?? ''}
                          onChange={(e) => setOverride(row.sku, e.target.value)}
                          className="text-xs border border-neutral-100 dark:border-neutral-800 rounded-md px-2 py-1.5 bg-transparent text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-neutral-200 dark:focus:border-neutral-700"
                        >
                          <option value="">— Nessun override —</option>
                          {MASTER_COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div className="py-12 text-center text-neutral-400 text-sm">
              Nessuna riga in questa categoria.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-neutral-400 text-right">
        {actionableRows.length} di {rows.length} SKU trovati su Shopify
      </div>
    </div>
  )
}
