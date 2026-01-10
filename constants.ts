
import { AlertSeverity } from './types';

export const TEMPLE_LOCATIONS = [
  { id: 'somnath', name: 'Somnath Temple', region: 'Veraval, Gujarat' },
  { id: 'dwarka', name: 'Dwarkadhish Temple', region: 'Dwarka, Gujarat' },
  { id: 'ambaji', name: 'Ambaji Mata Temple', region: 'Banaskantha, Gujarat' },
  { id: 'pavagadh', name: 'Kalika Mata Temple', region: 'Pavagadh, Gujarat' }
];

export const SEVERITY_COLORS = {
  [AlertSeverity.LOW]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  [AlertSeverity.MEDIUM]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  [AlertSeverity.HIGH]: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  [AlertSeverity.CRITICAL]: 'bg-red-500/20 text-red-400 border-red-500/50 pulse-red'
};

export const SEVERITY_TEXT_COLORS = {
  [AlertSeverity.LOW]: 'text-emerald-400',
  [AlertSeverity.MEDIUM]: 'text-yellow-400',
  [AlertSeverity.HIGH]: 'text-orange-400',
  [AlertSeverity.CRITICAL]: 'text-red-400'
};
