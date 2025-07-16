import { EmailTemplate } from '../types/emailTypes';
import { MARKET_SEGMENTS } from '../constants/emailConstants';

export const musicTemplates: EmailTemplate[] = [
  {
    id: 'music_video_intro',
    template_key: 'music_video_intro', // Added missing property
    name: 'Introduction - Clips Musicaux',
    subject: '🎵 Créons ensemble le clip qui propulsera votre carrière',
    content: `Bonjour {{contact_name}},

Votre univers musical m'inspire profondément. En écoutant {{artist_name}}, j'ai immédiatement visualisé le potentiel visuel de votre art.

**Mon expertise en clips musicaux :**
• 150+ clips réalisés (rap, pop, électro, rock)
• Collaborations avec des labels comme {{label_examples}}
• Spécialiste des effets visuels et de la post-production créative
• Maîtrise complète : concept → tournage → diffusion

🏆 **Succès récents :**
• Clip "Neon Dreams" - 2.5M vues en 3 mois
• "Urban Poetry" - Sélection officielle Festival de Cannes
• "Electric Soul" - #1 trending YouTube France

**Ce que je vous propose :**
✓ Concept créatif sur-mesure pour votre univers
✓ Tournage professionnel (4K, drones, steadicam)
✓ Post-production cinématographique
✓ Stratégie de diffusion optimisée

Votre musique mérite un écrin visuel à sa hauteur. Parlons-en autour d'un café ?

Musicalement vôtre,
{{sender_name}}

🎬 Portfolio clips : {{portfolio_link}}
📱 WhatsApp : {{phone}}`,
    variables: ['contact_name', 'artist_name', 'label_examples', 'sender_name', 'portfolio_link', 'phone'],
    category: 'introduction',
    is_active: true,
    priority: 'high',
    segment_targeting: [MARKET_SEGMENTS.MUSIC],
    ab_test_variant: 'A', // Added missing property
    performance_metrics: {
      open_rate: 0.52,
      click_rate: 0.18,
      response_rate: 0.12,
      conversion_rate: 0.22,
      last_updated: '2024-01-20'
    }
  }
];