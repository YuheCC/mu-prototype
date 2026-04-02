import { createContext, useContext, useState, useCallback } from 'react'

const TasksContext = createContext(null)

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([])

  const addTask = useCallback((task) => {
    setTasks((prev) => [...prev, task])
  }, [])

  const getTaskById = useCallback((id) => {
    return tasks.find((t) => t.id === id)
  }, [tasks])

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <TasksContext.Provider value={{ tasks, addTask, getTaskById, removeTask }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used within TasksProvider')
  return ctx
}
