import { useState, useEffect } from 'react';

interface Settings {
  gateway: {
    port: number;
    verbose: boolean;
    autoStart: boolean;
  };
  providers: Record<string, { apiKey?: string }>;
  channels: Record<string, unknown>;
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    minimizeToTray: boolean;
  };
  update: {
    channel: 'stable' | 'beta' | 'dev';
    autoUpdate: boolean;
  };
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await window.openclaw?.settings.get();
    setSettings(data as Settings);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await window.openclaw?.settings.update(settings);
    setSaving(false);
  };

  const updateGateway = (key: keyof Settings['gateway'], value: unknown) => {
    if (!settings) return;
    setSettings({
      ...settings,
      gateway: { ...settings.gateway, [key]: value },
    });
  };

  const updateUI = (key: keyof Settings['ui'], value: unknown) => {
    if (!settings) return;
    setSettings({
      ...settings,
      ui: { ...settings.ui, [key]: value },
    });
  };

  const updateProvider = (provider: string, apiKey: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      providers: {
        ...settings.providers,
        [provider]: { apiKey },
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        加载中...
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--error)' }}>
        加载设置失败
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>设置</h2>

      {/* Gateway 设置 */}
      <div className="settings-group">
        <h3 className="settings-group-title">Gateway 设置</h3>
        
        <div className="setting-item">
          <div>
            <div className="setting-label">端口</div>
            <div className="setting-description">Gateway 监听的端口号</div>
          </div>
          <input
            type="number"
            value={settings.gateway.port}
            onChange={(e) => updateGateway('port', parseInt(e.target.value) || 18789)}
            style={{ width: '100px' }}
          />
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">详细日志</div>
            <div className="setting-description">启用更详细的日志输出</div>
          </div>
          <div
            className={`toggle ${settings.gateway.verbose ? 'active' : ''}`}
            onClick={() => updateGateway('verbose', !settings.gateway.verbose)}
          />
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">自动启动</div>
            <div className="setting-description">应用启动时自动启动 Gateway</div>
          </div>
          <div
            className={`toggle ${settings.gateway.autoStart ? 'active' : ''}`}
            onClick={() => updateGateway('autoStart', !settings.gateway.autoStart)}
          />
        </div>
      </div>

      {/* 提供商设置 */}
      <div className="settings-group">
        <h3 className="settings-group-title">API 提供商</h3>

        <div className="setting-item">
          <div>
            <div className="setting-label">OpenAI API Key</div>
          </div>
          <input
            type="password"
            placeholder="sk-..."
            value={settings.providers.openai?.apiKey || ''}
            onChange={(e) => updateProvider('openai', e.target.value)}
          />
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">Anthropic API Key</div>
          </div>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={settings.providers.anthropic?.apiKey || ''}
            onChange={(e) => updateProvider('anthropic', e.target.value)}
          />
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">Google API Key</div>
          </div>
          <input
            type="password"
            placeholder="AIza..."
            value={settings.providers.google?.apiKey || ''}
            onChange={(e) => updateProvider('google', e.target.value)}
          />
        </div>
      </div>

      {/* UI 设置 */}
      <div className="settings-group">
        <h3 className="settings-group-title">界面设置</h3>

        <div className="setting-item">
          <div>
            <div className="setting-label">主题</div>
          </div>
          <select
            value={settings.ui.theme}
            onChange={(e) => updateUI('theme', e.target.value)}
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">语言</div>
          </div>
          <select
            value={settings.ui.language}
            onChange={(e) => updateUI('language', e.target.value)}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">最小化到托盘</div>
            <div className="setting-description">关闭窗口时最小化到系统托盘而不是退出</div>
          </div>
          <div
            className={`toggle ${settings.ui.minimizeToTray ? 'active' : ''}`}
            onClick={() => updateUI('minimizeToTray', !settings.ui.minimizeToTray)}
          />
        </div>
      </div>

      {/* 更新设置 */}
      <div className="settings-group">
        <h3 className="settings-group-title">更新设置</h3>

        <div className="setting-item">
          <div>
            <div className="setting-label">自动更新</div>
            <div className="setting-description">自动检查并下载应用更新</div>
          </div>
          <div
            className={`toggle ${settings.update?.autoUpdate ? 'active' : ''}`}
            onClick={() => {
              if (settings.update) {
                setSettings({
                  ...settings,
                  update: { ...settings.update, autoUpdate: !settings.update.autoUpdate },
                });
              }
            }}
          />
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">更新通道</div>
            <div className="setting-description">选择接收更新的通道</div>
          </div>
          <select
            value={settings.update?.channel || 'stable'}
            onChange={(e) => {
              if (settings.update) {
                setSettings({
                  ...settings,
                  update: { ...settings.update, channel: e.target.value as 'stable' | 'beta' | 'dev' },
                });
              }
            }}
          >
            <option value="stable">稳定版 (推荐)</option>
            <option value="beta">测试版</option>
            <option value="dev">开发版</option>
          </select>
        </div>

        <div className="setting-item">
          <div>
            <div className="setting-label">检查更新</div>
            <div className="setting-description">立即检查是否有新版本</div>
          </div>
          <button
            className="btn-secondary"
            onClick={async () => {
              const result = await window.openclaw?.update.check();
              if (result?.success) {
                alert('正在检查更新...');
              } else {
                alert('检查更新失败: ' + (result?.error || '未知错误'));
              }
            }}
          >
            检查更新
          </button>
        </div>
      </div>

      {/* 保存按钮 */}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;