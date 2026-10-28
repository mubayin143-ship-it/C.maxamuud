/**
 * SmartEducate Canonical Navigation & Onboarding Step Types
 */

export type OnboardingStepNumber = 1 | 2 | 3 | 4 | 5;

export type OnboardingStepId =
  | 'role'
  | 'university_details'
  | 'academic_profile'
  | 'courses'
  | 'confirmation';

export interface StepDefinition {
  stepNumber: OnboardingStepNumber;
  id: OnboardingStepId;
  titleKey: string;
  descriptionKey: string;
}

export const ONBOARDING_STEPS: readonly StepDefinition[] = [
  {
    stepNumber: 1,
    id: 'role',
    titleKey: 'nav.step1Title',
    descriptionKey: 'nav.step1Desc',
  },
  {
    stepNumber: 2,
    id: 'university_details',
    titleKey: 'nav.step2Title',
    descriptionKey: 'nav.step2Desc',
  },
  {
    stepNumber: 3,
    id: 'academic_profile',
    titleKey: 'nav.step3Title',
    descriptionKey: 'nav.step3Desc',
  },
  {
    stepNumber: 4,
    id: 'courses',
    titleKey: 'nav.step4Title',
    descriptionKey: 'nav.step4Desc',
  },
  {
    stepNumber: 5,
    id: 'confirmation',
    titleKey: 'nav.step5Title',
    descriptionKey: 'nav.step5Desc',
  },
] as const;
