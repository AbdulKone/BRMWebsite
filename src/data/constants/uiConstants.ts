// Créer un fichier pour centraliser les constantes UI
export const STATUS_COLORS = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  interested: 'bg-green-500',
  qualified: 'bg-purple-500',
  proposal_sent: 'bg-orange-500',
  negotiation: 'bg-red-500',
  closed_won: 'bg-emerald-500',
  closed_lost: 'bg-gray-500'
} as const;

export const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  interested: 'Intéressé',
  qualified: 'Qualifié',
  proposal_sent: 'Proposition envoyée',
  negotiation: 'Négociation',
  closed_won: 'Gagné',
  closed_lost: 'Perdu'
} as const;