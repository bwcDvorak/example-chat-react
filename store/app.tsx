import { Client, Conversation, DecodedMessage } from '@xmtp/xmtp-js'
import create from 'zustand'
import getUniqueMessages from '../helpers/getUniqueMessages'

interface AppState {
  client: Client | undefined | null
  setClient: (client: Client | undefined | null) => void
  conversations: Map<string, Conversation>
  setConversations: (conversations: Map<string, Conversation>) => void
  loadingConversations: boolean
  setLoadingConversations: (loadingConversations: boolean) => void
  convoMessages: Map<string, DecodedMessage[]>
  previewMessages: Map<string, DecodedMessage>
  setPreviewMessage: (key: string, message: DecodedMessage) => void
  setPreviewMessages: (previewMessages: Map<string, DecodedMessage>) => void
  addMessages: (key: string, newMessages: DecodedMessage[]) => number
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  client: undefined,
  setClient: (client: Client | undefined | null) => set(() => ({ client })),
  conversations: new Map(),
  setConversations: (conversations: Map<string, Conversation>) =>
    set(() => ({ conversations })),
  loadingConversations: false,
  setLoadingConversations: (loadingConversations: boolean) =>
    set(() => ({ loadingConversations })),
  convoMessages: new Map(),
  previewMessages: new Map(),
  setPreviewMessage: (key: string, message: DecodedMessage) =>
    set((state) => {
      const newPreviewMessages = new Map(state.previewMessages)
      newPreviewMessages.set(key, message)
      return { previewMessages: newPreviewMessages }
    }),
  setPreviewMessages: (previewMessages) => set(() => ({ previewMessages })),
  addMessages: (key: string, newMessages: DecodedMessage[]) => {
    let numAdded = 0
    set((state) => {
      const convoMessages = new Map(state.convoMessages)
      const existing = state.convoMessages.get(key) || []
      const updated = getUniqueMessages([...existing, ...newMessages])
      numAdded = updated.length - existing.length
      // If nothing has been added, return the old item to avoid unnecessary refresh
      if (!numAdded) {
        return { convoMessages: state.convoMessages }
      }
      convoMessages.set(key, updated)
      return { convoMessages }
    })
    return numAdded
  },
  reset: () =>
    set((state) => {
      return {
        ...state,
        conversations: new Map(),
        convoMessages: new Map(),
      }
    }),
}))
