import { EmailTemplate } from '../types/emailTypes';
import { MARKET_SEGMENTS } from '../constants/emailConstants';

export const weddingTemplates: EmailTemplate[] = [
  {
    id: 'wedding_videography_intro',
    name: 'Introduction - Vidéographie de Mariage',
    subject: '💕 Immortalisons la magie de votre plus beau jour',
    content: `Bonjour {{bride_name}} et {{groom_name}},

Félicitations pour vos fiançailles ! Votre histoire d'amour mérite d'être racontée avec toute la beauté et l'émotion qu'elle porte.

**Mon approche de la vidéographie de mariage :**
• Style cinématographique et intemporel
• Discrétion absolue pendant la cérémonie
• Captation des émotions authentiques
• Montage artistique sur musique personnalisée

💒 **Mes prestations mariage :**
✨ Film de mariage complet (15-20 min)
🎬 Teaser émotionnel (2-3 min)
📱 Extraits optimisés réseaux sociaux
💝 Interviews des proches (optionnel)

🏆 **Témoignages couples :**
"Un film magnifique qui nous fait revivre notre mariage à chaque visionnage" - Sarah & Thomas
"Professionnel, discret et d'un talent fou !" - Emma & Julien

**Votre mariage le {{wedding_date}} :**
📍 Lieu : {{venue}}
👥 Invités : {{guest_count}} personnes
💰 Forfait sur-mesure : à partir de {{starting_price}}€

J'aimerais beaucoup vous rencontrer pour comprendre votre vision et vous présenter mon travail.

Avec toute mon affection,
{{sender_name}}

💕 Portfolio mariages : {{wedding_portfolio}}
📞 {{phone}} (disponible 7j/7)`,
    variables: ['bride_name', 'groom_name', 'wedding_date', 'venue', 'guest_count', 'starting_price', 'sender_name', 'wedding_portfolio', 'phone'],
    category: 'introduction',
    isActive: true,
    priority: 'high',
    segment_targeting: [MARKET_SEGMENTS.WEDDING],
    performance_metrics: {
      open_rate: 0.62,
      click_rate: 0.25,
      response_rate: 0.18,
      conversion_rate: 0.35,
      last_updated: '2024-01-25'
    }
  }
];