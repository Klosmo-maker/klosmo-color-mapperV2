'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { mapColor } from '@/lib/colorMap'

interface ParsedRow {
  sku: string
  rawColor: string
  mappedColor: string | null
}

interface ProductResult {
  sku: string
  productId: string
  productTitle: string
}

type Stage = 'idle' | 'parsing' | 'fetching' | 'done' | 'error'

export default function UploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [errorMsg, setErrorMsg] = useState('')

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.csv')) {
        setErrorMsg('Il file deve essere un CSV.')
        setStage('error')
        return
      }

      try {
        // Step 1: Parse CSV in the browser (no upload to server)
        setStage('parsing')

        const rows = await new Promise<ParsedRow[]>((resolve, reject) => {
          Papa.parse<Record<string, string>>(file, {
            header: true,
            delimiter: '', // auto-detect: comma or semicolon
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
            complete: (results) => {
              const seenSkus = new Set<string>()
              const parsed: ParsedRow[] = []
              for (const row of results.data) {
                const sku = (row['Combinations Reference Code'] || '').trim()
                const rawColor = (row['Attribute Group Color'] || '').trim()
                if (!sku) continue
                if (seenSkus.has(sku)) continue
                seenSkus.add(sku)
                parsed.push({ sku, rawColor, mappedColor: rawColor ? mapColor(rawColor) : null })
              }
              resolve(parsed)
            },
            error: (err) => reject(new Error(err.message)),
          })
        })

        // Step 2: Fetch all peppela products from Shopify in one go
        setStage('fetching')
        setProgress({ current: 0, total: 0 })

        const fetchRes = await fetch('/api/fetch-products')
        if (!fetchRes.ok) {
          const err = await fetchRes.json()
          throw new Error(err.error || 'Errore nel recupero dei prodotti')
        }
        const fetchData: { skuMap: Record<string, ProductResult>; total: number } = await fetchRes.json()
        const skuMap = fetchData.skuMap
        setProgress({ current: fetchData.total, total: fetchData.total })

        // Build merged data
        const merged = rows.map((row) => {
          const prod = skuMap[row.sku]
          return {
            sku: row.sku,
            rawColor: row.rawColor,
            mappedColor: row.mappedColor,
            productId: prod?.productId ?? null,
            productTitle: prod?.productTitle ?? null,
          }
        })

        try {
          localStorage.setItem('colorMapperData', JSON.stringify(merged))
        } catch {
          localStorage.setItem('colorMapperData', JSON.stringify(merged.map(m => ({ ...m, productTitle: null }))))
        }

        setStage('done')
        router.push('/review')
      } catch (err) {
        console.error(err)
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setStage('error')
      }
    },
    [router]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const isLoading = stage === 'parsing' || stage === 'fetching'

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Importa feed colori
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Carica il CSV nokinstyle per mappare i colori sui prodotti Shopify.
        </p>
      </div>

      {stage === 'idle' || stage === 'error' ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={[
              'w-full border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500',
            ].join(' ')}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">
                  Trascina il CSV qui, o{' '}
                  <span className="text-neutral-900 dark:text-neutral-100 underline underline-offset-2">
                    clicca per selezionare
                  </span>
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Separatore punto e virgola (;), qualsiasi dimensione
                </p>
              </div>
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleChange}
          />
          {stage === 'error' && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {errorMsg}
            </div>
          )}
        </>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
            <div className="text-center">
              <p className="font-medium text-sm">
                {stage === 'parsing'
                  ? 'Analisi del CSV in corso…'
                  : 'Recupero prodotti da Shopify…'}
              </p>
              {stage === 'fetching' && (
                <p className="text-xs text-neutral-400 mt-1">
                  {progress.total > 0
                    ? `${progress.total} prodotti trovati su Shopify`
                    : 'Download catalogo peppela…'}
                </p>
              )}
            </div>
            {stage === 'fetching' && progress.total === 0 && (
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
                <div className="bg-neutral-900 dark:bg-neutral-100 h-1.5 rounded-full animate-pulse w-1/2" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
          Colonne richieste nel CSV
        </p>
        <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
          <li>
            <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
              Combinations Reference Code
            </code>{' '}
            — SKU prodotto
          </li>
          <li>
            <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
              Attribute Group Color
            </code>{' '}
            — Colore grezzo dal feed
          </li>
        </ul>
      </div>
    </div>
  )
}
