import { render as blog } from './blog'

export const renderers = {
  blog,
} as const

export type RendererType = keyof typeof renderers
