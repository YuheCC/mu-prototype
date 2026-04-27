import { Link } from 'react-router-dom'
import './HelpPages.css'

export default function HelpUserCenter() {
  return (
    <div className="help-page">
      <header className="help-page-header">
        <Link to="/" className="help-page-back">
          ← 返回 Ask
        </Link>
        <h1>用户帮助中心</h1>
        <p className="help-page-lead">查阅 MU Agent Ask、Workbench 与 Assets 的使用说明与常见问题。</p>
      </header>
      <section className="help-page-section">
        <h2>快速入口</h2>
        <ul>
          <li>在 Ask 中通过自然语言触发文献助手、MD 模拟、寿命预测等能力。</li>
          <li>在 Assets 中查看任务状态与收藏分子。</li>
          <li>在 Workbench 中管理功能与工作流。</li>
        </ul>
      </section>
      <section className="help-page-section">
        <h2>更多文档</h2>
        <p>
          工具与能力说明见{' '}
          <Link to="/tools">Tools 文档</Link>。
        </p>
      </section>
    </div>
  )
}
