import { Link, useNavigate } from 'react-router-dom'
import { useOnboardingTour } from '../context/OnboardingTourContext'
import './HelpPages.css'

export default function HelpOnboarding() {
  const navigate = useNavigate()
  const { startSpotlightTour } = useOnboardingTour()

  return (
    <div className="help-page">
      <header className="help-page-header">
        <Link to="/" className="help-page-back">
          ← 返回 Ask
        </Link>
        <h1>新手引导</h1>
        <p className="help-page-lead">按步骤熟悉 Molecular Universe 的核心流程。</p>
        <p className="help-onboarding-cta-wrap">
          <button
            type="button"
            className="help-onboarding-cta"
            onClick={() => {
              navigate('/')
              startSpotlightTour()
            }}
          >
            开始互动引导
          </button>
        </p>
      </header>
      <ol className="help-onboarding-steps">
        <li>
          <strong>开始对话</strong>：在 Ask 输入问题，或使用欢迎页的推荐问题快速体验。
        </li>
        <li>
          <strong>选择能力</strong>：根据提示进入文献助手、行业快讯、MD 模拟等分步表单。
        </li>
        <li>
          <strong>查看结果</strong>：在对话中阅读报告，并通过链接跳转到 Assets 查看任务。
        </li>
        <li>
          <strong>管理会话</strong>：使用左侧历史记录切换、置顶或重命名对话。
        </li>
      </ol>
    </div>
  )
}
