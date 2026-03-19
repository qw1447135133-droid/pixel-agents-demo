import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { taskQueue, TaskQueueEvent, Task } from '../core/TaskQueue'

// 简单的 uuid 生成
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 直接定义类型，避免导入问题
interface Agent {
  id: string
  name: string
  role: 'designer' | 'accountant' | 'marketer' | 'customer_service' | 'data_analyst'
  state: 'idle' | 'working' | 'offline'
  currentTask: Task | null
  skills?: string[]
  stats?: Record<string, number>
  metadata?: Record<string, any>
}

interface AppContextType {
  agents: Agent[]
  addAgent: (agent: Omit<Agent, 'id' | 'state' | 'currentTask'>) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  tasks: Task[]
  createTask: (task: Omit<Task, 'id' | 'status' | 'progress' | 'logs' | 'createdAt'>) => Task
  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  viewOffset: { x: number; y: number }
  setViewOffset: (x: number, y: number) => void
  viewScale: number
  setViewScale: (scale: number) => void
  selectedDeskId: string | null
  setSelectedDeskId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// 初始工位布局
const initialDesks = [
  { id: 'desk-ceo-1', x: 50, y: 50, width: 120, height: 80, department: 'ceo' },
  { id: 'desk-meeting-1', x: 250, y: 50, width: 180, height: 80, department: 'meeting' },
  { id: 'desk-design-1', x: 50, y: 200, width: 100, height: 80, department: 'design' },
  { id: 'desk-design-2', x: 180, y: 200, width: 100, height: 80, department: 'design' },
  { id: 'desk-finance-1', x: 350, y: 200, width: 100, height: 80, department: 'finance' },
  { id: 'desk-finance-2', x: 480, y: 200, width: 100, height: 80, department: 'finance' },
  { id: 'desk-ops-1', x: 50, y: 350, width: 100, height: 80, department: 'operations' },
  { id: 'desk-ops-2', x: 180, y: 350, width: 100, height: 80, department: 'operations' },
  { id: 'desk-cs-1', x: 350, y: 350, width: 100, height: 80, department: 'customer_service' },
  { id: 'desk-cs-2', x: 480, y: 350, width: 100, height: 80, department: 'customer_service' }
]

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [agents, setAgents] = useState<Agent[]>([
    { id: generateId(), name: '小明', role: 'designer', state: 'idle', currentTask: null },
    { id: generateId(), name: '小红', role: 'marketer', state: 'idle', currentTask: null }
  ])

  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })
  const [viewScale, setViewScale] = useState(1)
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = taskQueue.addListener((event: TaskQueueEvent) => {
      setTasks(prev => updateTaskInList(prev, event.task))
    })
    return unsubscribe
  }, [])

  const addAgent = (agent: Omit<Agent, 'id' | 'state' | 'currentTask'>) => {
    setAgents(prev => [...prev, { ...agent, id: generateId(), state: 'idle', currentTask: null }])
  }

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => agent.id === id ? { ...agent, ...updates } : agent))
  }

  const createTask = (task: Omit<Task, 'id' | 'status' | 'progress' | 'logs' | 'createdAt'>) => {
    const newTask = taskQueue.enqueue(task)
    setTasks(prev => [...prev, newTask])
    return newTask
  }

  const handleSetViewScale = (scale: number) => {
    setViewScale(Math.max(0.5, Math.min(2, scale)))
  }

  return (
    <AppContext.Provider value={{
      agents,
      addAgent,
      updateAgent,
      tasks,
      createTask,
      selectedAgentId,
      setSelectedAgentId,
      selectedTaskId,
      setSelectedTaskId,
      viewOffset,
      setViewOffset,
      viewScale,
      setViewScale: handleSetViewScale,
      selectedDeskId,
      setSelectedDeskId
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

function updateTaskInList(tasks: Task[], updatedTask: Task): Task[] {
  const index = tasks.findIndex(t => t.id === updatedTask.id)
  if (index === -1) {
    return [...tasks, updatedTask]
  }
  return [
    ...tasks.slice(0, index),
    { ...tasks[index], ...updatedTask },
    ...tasks.slice(index + 1)
  ]
}

export { initialDesks }
