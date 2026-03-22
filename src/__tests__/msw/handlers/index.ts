import { appHandlers } from './app'
import { ollamaHandlers } from './ollama'

export const handlers = [...ollamaHandlers, ...appHandlers]
