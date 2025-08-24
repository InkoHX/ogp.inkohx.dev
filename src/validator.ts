import { type RendererType, renderers } from './renderers'

export type RequestSearchParams<Site = string> = {
  site: Site
  title: string
  categories: string[]
  signature: string
}

export function validateQueries(
  queries: Partial<RequestSearchParams<string>>
): asserts queries is RequestSearchParams<RendererType> {
  const sites = Object.keys(renderers)

  if (!queries.site || !sites.includes(queries.site))
    throw new TypeError(
      `Invalid site parameter. Expected one of: ${sites.join(', ')}.`
    )
  if (!queries.title || typeof queries.title !== 'string')
    throw new TypeError('Invalid title parameter. Expected a string.')
  if (!queries.categories || !Array.isArray(queries.categories))
    throw new TypeError(
      'Invalid categories parameter. Expected an array of strings.'
    )
  if (!queries.signature || typeof queries.signature !== 'string')
    throw new TypeError('Invalid signature parameter. Expected a string.')
}
