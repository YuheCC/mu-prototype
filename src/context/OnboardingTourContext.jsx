import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/** @typedef {'ask_intro' | 'ask_prompt' | 'literature_pick' | 'literature_form' | 'literature_wait' | 'literature_assets_btn' | 'assets_intro' | 'workbench_nav' | 'workbench_intro'} OnboardingTourStep */

export const TOUR_STEP = {
  ASK_INTRO: 'ask_intro',
  ASK_PROMPT: 'ask_prompt',
  LITERATURE_PICK: 'literature_pick',
  LITERATURE_FORM: 'literature_form',
  LITERATURE_WAIT: 'literature_wait',
  LITERATURE_ASSETS_BTN: 'literature_assets_btn',
  ASSETS_INTRO: 'assets_intro',
  WORKBENCH_NAV: 'workbench_nav',
  WORKBENCH_INTRO: 'workbench_intro',
}

const OnboardingTourContext = createContext(null)

export function OnboardingTourProvider({ children }) {
  const [tourActive, setTourActive] = useState(false)
  /** @type {OnboardingTourStep} */
  const [step, setStep] = useState(TOUR_STEP.ASK_INTRO)
  const newChatHandlerRef = useRef(null)

  const registerTourNewChatHandler = useCallback((fn) => {
    newChatHandlerRef.current = fn
    return () => {
      newChatHandlerRef.current = null
    }
  }, [])

  const callTourNewChat = useCallback(() => {
    newChatHandlerRef.current?.()
  }, [])

  const goToTourStep = useCallback((/** @type {OnboardingTourStep} */ next) => {
    setStep(next)
  }, [])

  const startSpotlightTour = useCallback(() => {
    setStep(TOUR_STEP.ASK_INTRO)
    setTourActive(true)
  }, [])

  const skipTour = useCallback(() => {
    setTourActive(false)
    setStep(TOUR_STEP.ASK_INTRO)
  }, [])

  const completeTour = useCallback(() => {
    setTourActive(false)
    setStep(TOUR_STEP.ASK_INTRO)
  }, [])

  const value = useMemo(
    () => ({
      tourActive,
      step,
      registerTourNewChatHandler,
      callTourNewChat,
      goToTourStep,
      startSpotlightTour,
      skipTour,
      completeTour,
    }),
    [tourActive, step, registerTourNewChatHandler, callTourNewChat, goToTourStep, startSpotlightTour, skipTour, completeTour]
  )

  return <OnboardingTourContext.Provider value={value}>{children}</OnboardingTourContext.Provider>
}

export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext)
  if (!ctx) throw new Error('useOnboardingTour must be used within OnboardingTourProvider')
  return ctx
}
