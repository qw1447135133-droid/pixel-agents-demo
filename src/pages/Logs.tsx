import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 加载初始日志
    window.openclaw?.gateway.getLogs().then((initialLogs) => {
      setLogs(initialLogs);
    });

    // 监听新日志
    const unsubscribe = window.openclaw?.gateway.onLog((log) => {
      setLogs((prev) => [...prev, log]);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    // 自动滚动到底部
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const clearLogs = async () => {
    await window.openclaw?.gateway.clearLogs();
    setLogs([]);
  };

  const filteredLogs = logs.filter((log) => {
    if (levelFilter === 'all') return true;
    return log.level === levelFilter;
  });

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>日志</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">全部级别</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <button className="btn-secondary" onClick={() => setAutoScroll(!autoScroll)}>
            {autoScroll ? '暂停滚动' : '自动滚动'}
          </button>
          <button className="btn-danger" onClick={clearLogs}>
            清空日志
          </button>
        </div>
      </div>

      <div className="log-container" ref={logContainerRef}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            暂无日志
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="log-entry">
              <span className="log-timestamp">[{formatTime(log.timestamp)}]</span>
              <span className={`log-level-${log.level}`}>[{log.level.toUpperCase()}]</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        共 {logs.length} 条日志，显示 {filteredLogs.length} 条
      </div>
    </div>
  );
}

export default Logs;