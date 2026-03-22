import { server } from './server'

// Module-level side-effects — Vitest setupFiles executes this automatically before each test file.
// Do NOT export these; they must run as side-effects to take effect.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
