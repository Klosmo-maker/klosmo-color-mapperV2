import { NextResponse } from 'next/server'
import { shopifyGraphQL } from '@/lib/shopify'

export const runtime = 'edge'
export const maxDuration = 300

export interface ProductResult {
  sku: string
  productId: string
  productTitle: string
}

interface VariantNode {
  sku: string
  product: {
    id: string
    title: string
  }
}

interface ProductsResponse {
  products: {
    edges: {
      node: {
        id: string
        title: string
        variants: {
          edges: {
            node: {
              sku: string
            }
          }[]
        }
      }
    }[]
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

const QUERY = `
  query GetPeppelaProducts($after: String) {
    products(first: 250, query: "tag:peppela", after: $after) {
      edges {
        node {
          id
          title
          variants(first: 100) {
            edges {
              node {
                sku
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export async function GET() {
  try {
    const skuMap: Record<string, ProductResult> = {}
    let cursor: string | null = null
    let page = 0

    while (true) {
      page++
      const data: ProductsResponse = await shopifyGraphQL<ProductsResponse>(QUERY, {
        after: cursor,
      })

      const products = data?.products?.edges || []

      for (const { node: product } of products) {
        for (const { node: variant } of product.variants.edges) {
          if (variant.sku) {
            skuMap[variant.sku] = {
              sku: variant.sku,
              productId: product.id,
              productTitle: product.title,
            }
          }
        }
      }

      const pageInfo = data?.products?.pageInfo
      if (!pageInfo?.hasNextPage) break
      cursor = pageInfo.endCursor

      // Safety limit
      if (page >= 100) break
    }

    return NextResponse.json({ skuMap, total: Object.keys(skuMap).length })
  } catch (error) {
    console.error('fetch-products error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
