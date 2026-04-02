/** Options shown in the new-user demo modal */
export const DEMO_ROLES = [
  { id: 'researcher', label: '科研人员' },
  { id: 'engineer', label: '研发工程师' },
  { id: 'student', label: '高校学生' },
]

export const DEMO_INTERESTS = [
  { id: 'sse', label: '固态电池与电解质' },
  { id: 'md', label: '分子动力学（MD）模拟' },
  { id: 'life', label: '电池寿命预测' },
  { id: 'formulation', label: '电解液配方设计' },
  { id: 'literature', label: '文献调研与综述' },
]

const BASE_CARDS = [
  {
    title: 'Life Prediction',
    descDefault: 'Run battery life prediction workflow.',
    descByInterest: {
      life: 'Prioritize cycle-life forecasting and calibration for your cells.',
      engineer: 'Build life-prediction workflows from cycling and load profiles.',
    },
    tone: 'blue',
    icon: '⏱',
  },
  {
    title: 'Formulation',
    descDefault: 'Build electrolyte formulation and analyze results.',
    descByInterest: {
      formulation: 'Iterate electrolyte recipes and compare property targets.',
      sse: 'Explore sulfide SSE and electrolyte compatibility in formulations.',
      md: 'Pair formulation choices with MD-style evaluation prompts.',
    },
    tone: 'green',
    icon: '🧪',
  },
  {
    title: 'Design',
    descDefault: 'Design electrolyte/electrode and compare candidates.',
    descByInterest: {
      md: 'Stress-test candidate structures and interfaces before lab work.',
      sse: 'Compare solid-electrolyte and coating design trade-offs.',
    },
    tone: 'purple',
    icon: '⚡',
  },
  {
    title: 'Recent Tasks',
    descDefault: 'Open your recent tasks and assets.',
    descByInterest: {},
    tone: 'orange',
    icon: '📋',
  },
]

const ROLE_CARD_SCORE = {
  researcher: { 'Life Prediction': 1, Formulation: 3, Design: 2, 'Recent Tasks': 0 },
  engineer: { 'Life Prediction': 3, Formulation: 3, Design: 2, 'Recent Tasks': 1 },
  student: { 'Life Prediction': 1, Formulation: 2, Design: 2, 'Recent Tasks': 1 },
}

const INTEREST_CARD_SCORE = {
  sse: { Formulation: 3, Design: 2, 'Life Prediction': 1, 'Recent Tasks': 0 },
  md: { Formulation: 2, Design: 3, 'Life Prediction': 0, 'Recent Tasks': 0 },
  life: { 'Life Prediction': 4, Formulation: 1, Design: 0, 'Recent Tasks': 1 },
  formulation: { Formulation: 4, Design: 2, 'Life Prediction': 1, 'Recent Tasks': 0 },
  literature: { Formulation: 1, Design: 1, 'Life Prediction': 0, 'Recent Tasks': 1 },
}

/** 文献助手演示示例（命中 Ask 中文献意图） */
export const LITERATURE_DEMO_PROMPTS = [
  '我想研究硫化物固态电解质在全固态电池中的最新方向',
  '文献研究：请帮我梳理近五年固态电解质界面稳定性相关进展',
  '我想研究卤化物固态电解质与高电压正极的相容性',
  '我想研究全固态电池干法制膜与叠片工艺的可产业化文献证据',
]

/**
 * 首页「推荐问题」：固定 6 条——指定 demo 文案 + 额外模拟问题（均命中 Ask 对应分支）
 */
export const WELCOME_DEMO_PROMPTS = [
  '锂离子电池的电解质溶剂选择有哪些关键考虑因素？',
  '我想研究硫化物固态电解质在全固态电池中的最新方向',
  '我想预测电池寿命（life prediction），应该怎么开始？',
  '我有一个新配方，通过MD模拟评估一下这个配方',
  '帮我设计一下电解液配方',
  '我想预测 1M LiPF6 电解液在室温下的性质。溶剂使用摩尔比为 3:7 的 EC 和 DMC。',
]

const DEFAULT_TITLE = 'Welcome to Molecular Universe'
const DEFAULT_SUBTITLE =
  'Your intelligent assistant for accelerating scientific discovery. How can I assist with your research today?'

function cardScore(title, role, interests) {
  let s = 0
  if (role && ROLE_CARD_SCORE[role]) {
    s += ROLE_CARD_SCORE[role][title] ?? 0
  }
  for (const id of interests || []) {
    const m = INTEREST_CARD_SCORE[id]
    if (m) s += m[title] ?? 0
  }
  return s
}

function pickDesc(card, interests) {
  let best = null
  let bestRank = -1
  const order = interests || []
  for (let i = 0; i < order.length; i++) {
    const id = order[i]
    const d = card.descByInterest[id]
    if (d && i > bestRank) {
      best = d
      bestRank = i
    }
  }
  return best || card.descDefault
}

/**
 * @param {{ role: string, interests: string[] } | null | undefined} profile
 */
export function getPersonalizedWelcome(profile) {
  if (!profile?.role || !Array.isArray(profile.interests) || profile.interests.length === 0) {
    return {
      toolCards: BASE_CARDS.map((c) => ({
        title: c.title,
        desc: c.descDefault,
        tone: c.tone,
        icon: c.icon,
      })),
      prompts: [...WELCOME_DEMO_PROMPTS],
      welcomeTitle: DEFAULT_TITLE,
      welcomeSubtitle: DEFAULT_SUBTITLE,
    }
  }

  const { interests } = profile
  const role = profile.role === 'pm' ? 'researcher' : profile.role

  const scored = BASE_CARDS.map((c) => ({
    card: c,
    score: cardScore(c.title, role, interests),
  }))
  scored.sort((a, b) => b.score - a.score)

  const toolCards = scored.map(({ card }) => ({
    title: card.title,
    desc: pickDesc(card, interests),
    tone: card.tone,
    icon: card.icon,
  }))

  const prompts = [...WELCOME_DEMO_PROMPTS]

  const welcomeTitle = DEFAULT_TITLE
  const welcomeSubtitle = DEFAULT_SUBTITLE

  return { toolCards, prompts, welcomeTitle, welcomeSubtitle }
}
