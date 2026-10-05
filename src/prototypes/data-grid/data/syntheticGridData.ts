// Entirely invented review records; values are presentation examples, not clinical guidance.
type SyntheticRecord = {
  id: string; name: string
  phq9: { score: number; severity: string; trend: string; trendTone: 'improving' | 'worsening' } | 'Awaiting' | 'Restricted'
  risk: string; disengagement: string; nextContact: string
  disengagementTone: 'normal' | 'attention' | 'critical'; isToday: boolean
}

// Tones and isToday are explicit synthetic visual states, not clinical thresholds or date logic.

export const syntheticGridData = [
  { id: 'DEMO-001', name: 'Avery Example', phq9: { score: 11, severity: 'moderate', trend: '▼2', trendTone: 'improving' }, risk: 'Passive ideation', disengagement: '0.52', disengagementTone: 'attention', nextContact: 'Thu 16:00', isToday: false },
  { id: 'DEMO-002', name: 'Morgan Sample', phq9: { score: 22, severity: 'severe', trend: '▲5', trendTone: 'worsening' }, risk: 'Ideation with plan', disengagement: '0.82', disengagementTone: 'critical', nextContact: 'Today 14:00', isToday: true },
  { id: 'DEMO-003', name: 'Taylor Fiction', phq9: { score: 7, severity: 'mild', trend: '▼4', trendTone: 'improving' }, risk: 'None reported', disengagement: '0.41', disengagementTone: 'normal', nextContact: 'Fri 18:20', isToday: false },
  { id: 'DEMO-004', name: 'Jordan Preview', phq9: { score: 18, severity: 'mod-severe', trend: '▲3', trendTone: 'worsening' }, risk: 'Ideation, no plan', disengagement: '0.68', disengagementTone: 'attention', nextContact: 'Today 15:30', isToday: true },
  { id: 'DEMO-005', name: 'Riley Placeholder', phq9: 'Awaiting', risk: 'Ideation, no plan', disengagement: '0.39', disengagementTone: 'normal', nextContact: 'Today 17:10', isToday: true },
  { id: 'DEMO-006', name: 'Casey Demo', phq9: 'Restricted', risk: 'Restricted', disengagement: '0.19', disengagementTone: 'normal', nextContact: 'Mon 19:00', isToday: false },
] satisfies SyntheticRecord[]

export const additionalSyntheticGridData = [
  { id: 'DEMO-007', name: 'Alex Example', phq9: { score: 9, severity: 'mild', trend: '▼1', trendTone: 'improving' }, risk: 'None reported', disengagement: '0.28', disengagementTone: 'normal', nextContact: 'Fri 10:00', isToday: false },
  { id: 'DEMO-008', name: 'Quinn Sample', phq9: 'Awaiting', risk: 'Passive ideation', disengagement: '0.47', disengagementTone: 'normal', nextContact: 'Thu 11:30', isToday: false },
  { id: 'DEMO-009', name: 'Robin Fiction', phq9: { score: 15, severity: 'mod-severe', trend: '▲2', trendTone: 'worsening' }, risk: 'Ideation, no plan', disengagement: '0.61', disengagementTone: 'attention', nextContact: 'Today 16:20', isToday: true },
  { id: 'DEMO-010', name: 'Jamie Preview', phq9: 'Restricted', risk: 'Restricted', disengagement: '0.33', disengagementTone: 'normal', nextContact: 'Mon 09:15', isToday: false },
  { id: 'DEMO-011', name: 'Drew Placeholder', phq9: { score: 21, severity: 'severe', trend: '▲1', trendTone: 'worsening' }, risk: 'Ideation with plan', disengagement: '0.74', disengagementTone: 'critical', nextContact: 'Today 13:45', isToday: true },
] satisfies SyntheticRecord[]
