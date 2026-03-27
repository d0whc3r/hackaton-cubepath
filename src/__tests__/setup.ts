afterEach(async () => {
  const { resetStore } = await vi.importActual<typeof import('@/lib/stores/chat-store')>('@/lib/stores/chat-store')
  resetStore()
})
