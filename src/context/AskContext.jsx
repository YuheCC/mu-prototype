import { createContext, useContext, useState, useCallback } from 'react'

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content:
      'Hi, I\'m MU\'s AI assistant. Ask me anything about batteries and electrochemistry. You can also use tools like molecular analysis, battery life prediction, and formulation optimization to speed up your analysis and decisions.'
  }
]

function createNewConversation() {
  return {
    id: `conv-${Date.now()}`,
    title: '新对话',
    messages: [...initialMessages]
  }
}

const first = createNewConversation()

const AskContext = createContext(null)

export function AskProvider({ children }) {
  const [conversations, setConversations] = useState(() => [first])
  const [currentId, setCurrentId] = useState(first.id)

  const updateConversation = useCallback((id, updater) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
  }, [])

  return (
    <AskContext.Provider
      value={{
        conversations,
        setConversations,
        currentId,
        setCurrentId,
        updateConversation,
        createNewConversation,
        initialMessages
      }}
    >
      {children}
    </AskContext.Provider>
  )
}

export function useAskConversations() {
  const ctx = useContext(AskContext)
  if (!ctx) throw new Error('useAskConversations must be used within AskProvider')
  return ctx
}

export { initialMessages }
