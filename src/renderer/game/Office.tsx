import { useApp, initialDesks } from '../store/AppContext'

const DESK_COLORS: Record<string, string> = {
  ceo: '#8B5CF6',
  meeting: '#EC4899',
  design: '#3B82F6',
  finance: '#10B981',
  operations: '#F59E0B',
  customer_service: '#EF4444'
}

const DEPARTMENT_NAMES: Record<string, string> = {
  ceo: 'CEO 办公室',
  meeting: '会议室',
  design: '设计部',
  finance: '财务部',
  operations: '运营部',
  customer_service: '客服部'
}

export function Office() {
  const { viewOffset, viewScale, setViewScale, selectedDeskId, setSelectedDeskId, agents } = useApp()

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const scaleBy = 1.1
    const newScale = e.deltaY > 0 ? viewScale / scaleBy : viewScale * scaleBy
    setViewScale(newScale)
  }

  const handleDeskClick = (deskId: string) => {
    setSelectedDeskId(deskId)
  }

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{ backgroundColor: '#1f2937' }}
      onWheel={handleWheel}
    >
      {/* 背景网格 */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          transform: `scale(${viewScale})`,
          transformOrigin: 'top left'
        }}
      >
        {/* 工位 */}
        {initialDesks.map((desk) => {
          const agent = agents.find(a => desk.id.includes(a.role))
          const isSelected = selectedDeskId === desk.id
          
          return (
            <div
              key={desk.id}
              onClick={() => handleDeskClick(desk.id)}
              style={{
                position: 'absolute',
                left: desk.x,
                top: desk.y,
                width: desk.width,
                height: desk.height,
                backgroundColor: DESK_COLORS[desk.department] || '#6B7280',
                border: `2px solid ${isSelected ? 'white' : '#1F2937'}`,
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 0 2px #1f2937, 0 0 0 4px white' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ padding: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* 部门名称 */}
                <div style={{ color: 'white', fontSize: 11, fontWeight: 500 }}>
                  {DEPARTMENT_NAMES[desk.department] || desk.department}
                </div>
                
                {/* 员工名字（如果有分配） */}
                {agent && (
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                    {agent.name}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* 提示信息 */}
      <div className="hint">
        滚轮缩放 · 点击工位选中
      </div>
    </div>
  )
}
