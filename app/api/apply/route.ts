import { NextRequest, NextResponse } from 'next/server'
import { shopifyGraphQL } from '@/lib/shopify'

interface ApplyItem {
  productId: string
  color: string
}

interface MetafieldInput {
  ownerId: string
  namespace: string
  key: string
  type: string
  value: string
}

interface MetafieldsSetResponse {
  metafieldsSet: {
    metafields: { id: string }[]
    userErrors: { field: string[]; message: string }[]
  }
}

const MUTATION = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

const BATCH_SIZE = 25

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items: ApplyItem[] = body.items || []

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: 0, errors: [] })
    }

    let successCount = 0
    const allErrors: unknown[] = []

    // Process in batches of 25
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)

      const metafields: MetafieldInput[] = batch.map((item) => ({
        ownerId: item.productId,
        namespace: 'custom',
        key: 'color_filter',
        type: 'single_line_text_field',
        value: item.color,
      }))

      try {
        const data = await shopifyGraphQL<MetafieldsSetResponse>(MUTATION, {
          metafields,
        })

        const result = data?.metafieldsSet
        if (result) {
          successCount += result.metafields.length
          if (result.userErrors.length > 0) {
            allErrors.push(...result.userErrors)
          }
        }
      } catch (err) {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, err)
        allErrors.push({ batchIndex: i / BATCH_SIZE, error: String(err) })
      }

      // Small delay between batches to be safe
      if (i + BATCH_SIZE < items.length) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    return NextResponse.json({ success: successCount, errors: allErrors })
  } catch (error) {
    console.error('apply error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
