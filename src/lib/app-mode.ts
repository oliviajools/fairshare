/**
 * App Mode Configuration
 * 
 * NEXT_PUBLIC_APP_MODE determines which features are available:
 * - 'student': Standard FairShare app without teacher/classroom features
 * - 'teacher': Teacher app with only classroom management features
 * - undefined: All features enabled (development mode)
 */

export type AppMode = 'student' | 'teacher' | 'all'

export function getAppMode(): AppMode {
  const mode = process.env.NEXT_PUBLIC_APP_MODE as AppMode
  if (mode === 'student' || mode === 'teacher') {
    return mode
  }
  return 'all' // Default: all features enabled
}

export function isStudentApp(): boolean {
  return getAppMode() === 'student'
}

export function isTeacherApp(): boolean {
  return getAppMode() === 'teacher'
}

export function hasFeature(feature: 'voting' | 'classroom' | 'join-classroom'): boolean {
  const mode = getAppMode()
  
  switch (feature) {
    case 'voting':
      // Voting is available in student app and all mode, not in teacher-only
      return mode !== 'teacher'
    case 'classroom':
      // Classroom management is available in teacher app and all mode
      return mode !== 'student'
    case 'join-classroom':
      // Join classroom is available in student app and all mode
      return mode !== 'teacher'
    default:
      return true
  }
}

export function getAppName(): string {
  const mode = getAppMode()
  switch (mode) {
    case 'teacher':
      return 'TeamPayer Teacher'
    case 'student':
    default:
      return 'TeamPayer'
  }
}
