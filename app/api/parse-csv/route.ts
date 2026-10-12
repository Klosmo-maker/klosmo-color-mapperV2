import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { mapColor } from '@/lib/colorMap'

export interface ParsedRow {
  sku: string
  rawColor: string
  mappedColor: string | null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      delimiter: '',
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parsed.errors.length > 0) {
      const fatalErrors = parsed.errors.filter((e) => e.type === 'Delimiter')
      if (fatalErrors.length > 0) {
        return NextResponse.json(
          { error: 'CSV parsing failed', details: fatalErrors },
          { status: 400 }
        )
      }
    }

    const seenSkus = new Set<string>()
    const results: ParsedRow[] = []

    for (const row of parsed.data) {
      const sku = (row['Combinations Reference Code'] || '').trim()
      const rawColor = (row['Attribute Group Color'] || '').trim()

      if (!sku) continue
      if (seenSkus.has(sku)) continue
      seenSkus.add(sku)

      const mappedColor = rawColor ? mapColor(rawColor) : null
      results.push({ sku, rawColor, mappedColor })
    }

    return NextResponse.json({ rows: results, total: results.length })
  } catch (error) {
    console.error('parse-csv error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
