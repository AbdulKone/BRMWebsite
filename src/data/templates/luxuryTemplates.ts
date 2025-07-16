import { EmailTemplate } from '../types/emailTypes';
import { MARKET_SEGMENTS } from '../constants/emailConstants';

export const luxuryTemplates: EmailTemplate[] = [
  {
    id: 'luxury_advertising_intro',
    template_key: 'luxury_advertising_intro', // Added missing property
    name: 'Introduction - Publicité Luxe',
    subject: '✨ L\'excellence visuelle que mérite votre marque de prestige',
    content: `Bonjour {{contact_name}},

L'élégance et le raffinement de {{brand_name}} m'ont immédiatement séduit. Votre positionnement premium mérite une communication visuelle d'exception.

**Mon expertise en publicité de luxe :**
• 8 ans d'expérience avec les maisons de prestige
• Maîtrise de l'esthétique haut de gamme
• Équipe technique spécialisée (éclairage, macro, produit)
• Post-production raffinée et sophistiquée

💎 **Références prestigieuses :**
• Campagne joaillerie Cartier - Prix Cannes Lions Bronze
• Film institutionnel LVMH - 15M+ vues
• Lancement parfum Dior - Diffusion internationale

**Ma proposition pour {{brand_name}} :**
🎯 Audit de votre image de marque actuelle
🎨 Concept créatif aligné sur vos codes luxe
📸 Production avec matériel haut de gamme
✨ Post-production cinématographique premium

L'excellence n'attend pas. Quand pouvons-nous échanger sur votre vision ?

Avec mes salutations distinguées,
{{sender_name}}

🏆 Showreel luxe : {{luxury_portfolio}}
📞 Direct : {{phone}}`,
    variables: ['contact_name', 'brand_name', 'sender_name', 'luxury_portfolio', 'phone'],
    category: 'introduction',
    is_active: true,
    priority: 'high',
    segment_targeting: [MARKET_SEGMENTS.LUXURY],
    ab_test_variant: 'A', // Added missing property
    performance_metrics: {
      open_rate: 0.48,
      click_rate: 0.15,
      response_rate: 0.10,
      conversion_rate: 0.28,
      last_updated: '2024-01-18'
    }
  }
];