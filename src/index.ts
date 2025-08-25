import { WorkerEntrypoint } from 'cloudflare:workers'
import { type RendererType, renderers } from './renderers'
import { validateSignature } from './signature'
import { validateQueries } from './validator'

export default class OGPWorker extends WorkerEntrypoint<Cloudflare.Env> {
  public async fetch(request: Request): Promise<Response> {
    try {
      const requestUrl = new URL(request.url)
      const queries = {
        site: requestUrl.searchParams.get('site')?.toLowerCase() ?? void 0,
        title: requestUrl.searchParams.get('title') ?? void 0,
        categories: requestUrl.searchParams.getAll('categories'),
        signature: requestUrl.searchParams.get('signature') ?? void 0,
      }

      try {
        validateQueries(queries)
      } catch (error: unknown) {
        if (error instanceof TypeError) {
          return new Response(error.message, { status: 400 })
        }

        throw error
      }

      const isVerified = await validateSignature(
        queries.signature,
        {
          site: queries.site,
          title: queries.title,
          categories: queries.categories,
        },
        this.env.SIGNATURE_KEY
      )

      if (!isVerified) {
        return new Response('Invalid signature.', { status: 400 })
      }

      for (const rendererType of Object.keys(
        renderers
      ) as ReadonlyArray<RendererType>) {
        if (queries.site !== rendererType) continue

        const cache = await caches.open(`ogp-${rendererType}`)
        const cacheKey = new Request(requestUrl, request)
        let response = await cache.match(cacheKey)

        if (!response) {
          const render = renderers[rendererType]
          response = await render(queries.title, queries.categories)
          response.headers.set(
            'Cache-Control',
            'public, immutable, no-transform, max-age=31536000'
          )
          await cache.put(cacheKey, response.clone())
        }

        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET')

        return response
      }

      return new Response('site parameter is invalid.', { status: 400 })
    } catch (error: unknown) {
      console.error(error)

      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
