/**
 * App Mode Configuration
 * 
 * NEXT_PUBLIC_APP_MODE determines which features are available:
 * - 'school': School app with classroom features (for teachers AND students)
 * - 'standard': Standard FairShare app with voting/sessions features (no classroom)
 * - undefined: All features enabled (development mode)
 */

export type AppMode = 'school' | 'standard' | 'all'

export function getAppMode(): AppMode {
  const envMode = process.env.NEXT_PUBLIC_APP_MODE
  
  if (envMode === 'school') {
    return 'school'
  }
  if (envMode === 'all') {
    return 'all'
  }
  return 'standard' // Default: standard app (no classroom features)
}

export function isSchoolApp(): boolean {
  return getAppMode() === 'school'
}

export function isStandardApp(): boolean {
  return getAppMode() === 'standard'
}

export function hasFeature(feature: 'voting' | 'classroom' | 'join-classroom'): boolean {
  const mode = getAppMode()
  
  switch (feature) {
    case 'voting':
      // Voting/Sessions is available in standard app and all mode
      return mode !== 'school'
    case 'classroom':
      // Classroom management is available in school app and all mode
      return mode !== 'standard'
    case 'join-classroom':
      // Join classroom is available in school app and all mode
      return mode !== 'standard'
    default:
      return true
  }
}

export function getAppName(): string {
  const mode = getAppMode()
  switch (mode) {
    case 'school':
      return 'TeamPayer School'
    case 'standard':
    default:
      return 'TeamPayer'
  }
}
