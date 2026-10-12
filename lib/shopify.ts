const SHOPIFY_ENDPOINT =
  'https://klosmo-store.myshopify.com/admin/api/2024-10/graphql.json'

export async function shopifyGraphQL<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = process.env.SHOPIFY_TOKEN
  if (!token) {
    throw new Error('SHOPIFY_TOKEN environment variable is not set')
  }

  const response = await fetch(SHOPIFY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Shopify API error ${response.status}: ${text}`
    )
  }

  const json = await response.json()

  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `GraphQL errors: ${json.errors.map((e: { message: string }) => e.message).join(', ')}`
    )
  }

  return json.data as T
}
