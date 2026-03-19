import { useApp } from '../store/AppContext'

const ROLE_NAMES: Record<string, string> = {
  designer: '设计师',
  accountant: '会计',
  marketer: '营销专员',
  customer_service: '客服',
  data_analyst: '数据分析员'
}

const STATE_BADGE_CLASSES: Record<string, string> = {
  idle: 'badge badge-green',
  working: 'badge badge-blue',
  offline: 'badge badge-gray'
}

const STATE_NAMES: Record<string, string> = {
  idle: '空闲',
  working: '工作中',
  offline: '离线'
}

export function AgentPanel() {
  const { agents, addAgent, selectedAgentId, setSelectedAgentId } = useApp()

  const handleAddTestAgent = () => {
    addAgent({
      name: '测试员工',
      role: 'designer'
    })
  }

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <h2>员工管理</h2>
        <button
          onClick={handleAddTestAgent}
          className="btn-success"
          style={{ padding: '6px 12px', fontSize: 14 }}
        >
          + 测试员工
        </button>
      </div>

      <div className="space-y-3">
        {agents.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            暂无员工，点击上方按钮添加测试员工
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`card ${selectedAgentId === agent.id ? 'selected' : ''}`}
              style={selectedAgentId === agent.id ? { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{agent.name}</span>
                <span className={STATE_BADGE_CLASSES[agent.state]}>
                  {STATE_NAMES[agent.state]}
                </span>
              </div>
              
              <div className="text-gray-400 text-sm">
                {ROLE_NAMES[agent.role] || agent.role}
              </div>
              
              {agent.currentTask && (
                <div className="mt-2 pt-2 border-t">
                  <div className="text-gray-400 text-xs">
                    当前任务: {agent.currentTask.type}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
