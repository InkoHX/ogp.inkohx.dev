import { decodeBase64Url } from '@std/encoding'
import type { RequestSearchParams } from './validator'

export async function validateSignature(
  signature: string,
  params: Pick<RequestSearchParams, 'site' | 'categories' | 'title'>,
  secretKey: string
): Promise<boolean> {
  const textEncoder = new TextEncoder()

  const data = textEncoder.encode(
    params.site + params.title + params.categories.sort().join('')
  )
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  return crypto.subtle.verify(
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    key,
    decodeBase64Url(signature),
    data
  )
}
