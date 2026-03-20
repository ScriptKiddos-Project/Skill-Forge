import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function scoreToColor(score) {
  if (score >= 0.7) return '#00ff88'
  if (score >= 0.4) return '#fbbf24'
  return '#f87171'
}

export function scoreToLabel(score) {
  if (score >= 0.7) return 'PASS'
  if (score >= 0.4) return 'REVISE'
  return 'RETRY'
}

export function gapToColor(gap) {
  if (gap >= 0.7) return '#f87171'
  if (gap >= 0.5) return '#fbbf24'
  return '#00ff88'
}

export function statusToColor(status) {
  const map = {
    complete: '#00ff88',
    active: '#60a5fa',
    revise: '#fbbf24',
    retry: '#f87171',
    locked: '#374151',
  }
  return map[status] || '#374151'
}

export function hexId() {
  return `0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}`
}

export function normalizeSkill(skill) {
  const map = { 'ML': 'Machine Learning', 'k8s': 'Kubernetes', 'TS': 'TypeScript', 'JS': 'JavaScript' }
  return map[skill] || skill
}

export function formatHours(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}min`
  return `${hours}h`
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
