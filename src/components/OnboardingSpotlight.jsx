import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useOnboardingTour, TOUR_STEP } from '../context/OnboardingTourContext'
import './OnboardingSpotlight.css'

const PADDING = 10

const STEP_COPY = {
  [TOUR_STEP.ASK_INTRO]: {
    stepLabel: 'Ask',
    body: '这里是 Ask：用自然语言提问、启动文献助手、MD 等功能。下方会推荐示例问题，助你快速上手。',
  },
  [TOUR_STEP.ASK_PROMPT]: {
    stepLabel: '开始文献',
    body: '请点击一条包含「我想研究」的推荐问题，进入文献助手的完整演示流程。',
  },
  [TOUR_STEP.LITERATURE_PICK]: {
    stepLabel: '文献助手',
    body: '在回答卡片下方点击「MU Agent 文献助手」，进入可配置的研究流水线。',
  },
  [TOUR_STEP.LITERATURE_FORM]: {
    stepLabel: '研究配置',
    body: '确认时间范围与侧重点后，点击「开始研究」启动模拟流水线。',
  },
  [TOUR_STEP.LITERATURE_WAIT]: {
    stepLabel: '生成中',
    body: '正在模拟文献检索与综述流水线，请稍候，完成后会出现报告与下一步入口。',
  },
  [TOUR_STEP.LITERATURE_ASSETS_BTN]: {
    stepLabel: '同步 Assets',
    body: '报告就绪后，点击「在 Assets 中查看」跳转到资产管理页，查看任务与报告归类。',
  },
  [TOUR_STEP.ASSETS_INTRO]: {
    stepLabel: 'Assets',
    body: 'Assets 汇总从 Ask、Workbench 产生的任务与分类：Recent Tasks、论文科研、配方等都可在此继续跟进。',
  },
  [TOUR_STEP.WORKBENCH_NAV]: {
    stepLabel: 'Workbench',
    body: '请点击顶部导航中的「Workbench」，打开内置功能与工作流入口。',
  },
  [TOUR_STEP.WORKBENCH_INTRO]: {
    stepLabel: 'Workbench',
    body: 'Workbench 提供寿命预测、配方、日常分析等能力；可从列表进入具体功能或查看近期活动。',
  },
}

function anchorSelector(step, pathname) {
  if (step.startsWith('ask_') && pathname !== '/') return null
  if (
    step.startsWith('literature_') &&
    step !== TOUR_STEP.LITERATURE_ASSETS_BTN &&
    pathname !== '/'
  ) {
    return null
  }
  switch (step) {
    case TOUR_STEP.ASK_INTRO:
      return '[data-onboarding-anchor="ask-welcome"]'
    case TOUR_STEP.ASK_PROMPT:
      return '[data-onboarding-anchor="ask-prompts"]'
    case TOUR_STEP.LITERATURE_PICK:
      return '[data-onboarding-anchor="tour-literature-assistant"]'
    case TOUR_STEP.LITERATURE_FORM:
      return '[data-onboarding-anchor="tour-literature-submit"]'
    case TOUR_STEP.LITERATURE_WAIT:
      return '[data-onboarding-anchor="tour-literature-run"]'
    case TOUR_STEP.LITERATURE_ASSETS_BTN:
      return pathname === '/' ? '[data-onboarding-anchor="tour-literature-view-assets"]' : null
    case TOUR_STEP.ASSETS_INTRO:
      return pathname.startsWith('/tasks-data') ? '[data-onboarding-anchor="assets-intro-header"]' : null
    case TOUR_STEP.WORKBENCH_NAV:
      return '[data-onboarding-anchor="nav-workbench"]'
    case TOUR_STEP.WORKBENCH_INTRO:
      return pathname === '/features-workflows' ? '[data-onboarding-anchor="workbench-intro-header"]' : null
    default:
      return null
  }
}

export default function OnboardingSpotlight() {
  const location = useLocation()
  const { tourActive, step, skipTour, callTourNewChat, goToTourStep, completeTour } = useOnboardingTour()

  const [layoutTick, setLayoutTick] = useState(0)

  const vw = typeof window !== 'undefined' ? window.innerWidth : 0

  useEffect(() => {
    if (!tourActive) return
    const bump = () => setLayoutTick((n) => n + 1)
    window.addEventListener('scroll', bump, true)
    window.addEventListener('resize', bump)
    const id = window.setInterval(bump, 400)
    return () => {
      window.removeEventListener('scroll', bump, true)
      window.removeEventListener('resize', bump)
      window.clearInterval(id)
    }
  }, [tourActive, step, location.pathname])

  useLayoutEffect(() => {
    if (!tourActive) return
    setLayoutTick((n) => n + 1)
  }, [tourActive, step, location.pathname])

  useEffect(() => {
    if (!tourActive || step !== TOUR_STEP.ASK_INTRO) return
    const t = window.setTimeout(() => goToTourStep(TOUR_STEP.ASK_PROMPT), 3200)
    return () => window.clearTimeout(t)
  }, [tourActive, step, goToTourStep])

  useEffect(() => {
    if (!tourActive || step !== TOUR_STEP.ASSETS_INTRO) return
    if (!location.pathname.startsWith('/tasks-data')) return
    const t = window.setTimeout(() => goToTourStep(TOUR_STEP.WORKBENCH_NAV), 4500)
    return () => window.clearTimeout(t)
  }, [tourActive, step, location.pathname, goToTourStep])

  useEffect(() => {
    if (!tourActive || step !== TOUR_STEP.WORKBENCH_INTRO) return
    const t = window.setTimeout(() => completeTour(), 5500)
    return () => window.clearTimeout(t)
  }, [tourActive, step, completeTour])

  useEffect(() => {
    if (!tourActive) return
    if (step !== TOUR_STEP.LITERATURE_ASSETS_BTN) return
    if (location.pathname.startsWith('/tasks-data')) {
      goToTourStep(TOUR_STEP.ASSETS_INTRO)
    }
  }, [tourActive, step, location.pathname, goToTourStep])

  useEffect(() => {
    if (!tourActive) return
    if (step !== TOUR_STEP.WORKBENCH_NAV) return
    if (location.pathname === '/features-workflows') {
      goToTourStep(TOUR_STEP.WORKBENCH_INTRO)
    }
  }, [tourActive, step, location.pathname, goToTourStep])

  const rect = useMemo(() => {
    if (!tourActive) return null
    const sel = anchorSelector(step, location.pathname)
    if (!sel) return null
    const el = document.querySelector(sel)
    if (!el || !(el instanceof HTMLElement)) return null
    const r = el.getBoundingClientRect()
    if (r.width < 2 && r.height < 2) return null
    return {
      top: r.top - PADDING,
      left: r.left - PADDING,
      right: r.right + PADDING,
      bottom: r.bottom + PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    }
  }, [tourActive, step, layoutTick, location.pathname])

  const tooltipStyle = useMemo(() => {
    const w = Math.min(340, Math.max(260, vw - 32))
    const topRight = {
      top: 60,
      right: 16,
      left: 'auto',
      bottom: 'auto',
      transform: 'none',
      width: w,
      maxWidth: 'min(340px, calc(100vw - 32px))',
    }
    const bottomCenter = {
      left: '50%',
      bottom: 20,
      transform: 'translateX(-50%)',
      width: Math.min(400, Math.max(280, vw - 32)),
      top: 'auto',
      right: 'auto',
    }

    const askDockSteps = [
      TOUR_STEP.ASK_INTRO,
      TOUR_STEP.ASK_PROMPT,
      TOUR_STEP.LITERATURE_PICK,
      TOUR_STEP.LITERATURE_FORM,
      TOUR_STEP.LITERATURE_WAIT,
      TOUR_STEP.LITERATURE_ASSETS_BTN,
    ]

    if (location.pathname === '/' && askDockSteps.includes(step)) {
      return topRight
    }
    if (step === TOUR_STEP.WORKBENCH_NAV) {
      return topRight
    }
    if (step === TOUR_STEP.ASSETS_INTRO) {
      return topRight
    }
    if (step === TOUR_STEP.WORKBENCH_INTRO) {
      return topRight
    }
    return bottomCenter
  }, [vw, step, location.pathname])

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') skipTour()
    },
    [skipTour]
  )

  useEffect(() => {
    if (!tourActive) return
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [tourActive, onKeyDown])

  if (!tourActive) return null

  const copy = STEP_COPY[step] || {
    stepLabel: '引导',
    body: '请按提示操作，或跳过引导。',
  }

  const showNewChatHint =
    (step === TOUR_STEP.ASK_PROMPT || step === TOUR_STEP.ASK_INTRO) &&
    !rect &&
    location.pathname === '/'

  return (
    <div className="onb-spotlight-root" role="presentation">
      {rect && (
        <>
          <div
            className="onb-dim onb-dim-top"
            style={{ height: Math.max(0, rect.top) }}
            aria-hidden
          />
          <div
            className="onb-dim onb-dim-left"
            style={{
              top: Math.max(0, rect.top),
              width: Math.max(0, rect.left),
              height: Math.max(0, rect.bottom - rect.top),
            }}
            aria-hidden
          />
          <div
            className="onb-dim onb-dim-right"
            style={{
              top: Math.max(0, rect.top),
              left: Math.max(0, rect.right),
              right: 0,
              height: Math.max(0, rect.bottom - rect.top),
            }}
            aria-hidden
          />
          <div
            className="onb-dim onb-dim-bottom"
            style={{ top: Math.max(0, rect.bottom), bottom: 0 }}
            aria-hidden
          />
          <div
            className="onb-spotlight-ring"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            aria-hidden
          />
        </>
      )}

      {!rect && <div className="onb-dim onb-dim-full" aria-hidden />}

      <div
        className="onb-tooltip onb-tooltip--floating"
        style={tooltipStyle}
        role="dialog"
        aria-labelledby="onb-tooltip-title"
        aria-describedby="onb-tooltip-body"
      >
        <div className="onb-tooltip-step">{copy.stepLabel}</div>
        <h3 id="onb-tooltip-title" className="onb-tooltip-title">
          新手引导
        </h3>
        <p id="onb-tooltip-body" className="onb-tooltip-body">
          {showNewChatHint
            ? '当前对话已有内容。点击「开启新对话」以显示欢迎页与推荐问题，再继续。'
            : copy.body}
        </p>
        <div className="onb-tooltip-actions">
          {showNewChatHint && (
            <button type="button" className="onb-btn onb-btn-secondary" onClick={callTourNewChat}>
              开启新对话
            </button>
          )}
          <button type="button" className="onb-btn onb-btn-ghost" onClick={skipTour}>
            跳过引导
          </button>
        </div>
        <p className="onb-tooltip-hint">按 Esc 退出</p>
      </div>
    </div>
  )
}
