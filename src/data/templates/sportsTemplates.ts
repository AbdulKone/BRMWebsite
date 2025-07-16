import { EmailTemplate } from '../types/emailTypes';
import { MARKET_SEGMENTS } from '../constants/emailConstants';

export const sportsTemplates: EmailTemplate[] = [
  {
    id: 'sports_advertising_intro',
    template_key: 'sports_advertising_intro', // Added missing property
    name: 'Introduction - Publicité Sportive',
    subject: '⚡ Capturons l\'énergie et la passion de votre marque sport',
    content: `Salut {{contact_name}} !

Votre engagement pour {{brand_name}} et les valeurs sportives que vous portez me motivent énormément. Le sport, c'est ma passion autant que mon métier.

**Mon expertise en publicité sportive :**
• Spécialiste des tournages action et mouvement
• Équipement adapté : caméras haute vitesse, drones, steadicam
• Expérience terrain : stades, salles, extérieur extrême
• Montage dynamique et rythmé

🏅 **Mes plus belles réalisations :**
• Campagne Nike "Just Do It" France - 5M+ vues
• Documentaire équipe de France rugby - Diffusion TF1
• Pub Adidas running - Viral 10M+ vues

**Ce que je vous propose :**
💪 Concept qui capture l'essence de votre sport
🎬 Tournage immersif avec les athlètes
⚡ Montage percutant et énergique
🚀 Optimisation pour tous vos canaux digitaux

Le sport unit, inspire, dépasse. Créons ensemble quelque chose d'inoubliable !

Sportivement,
{{sender_name}}

🎥 Mes réals sport : {{sports_portfolio}}
📲 Mobile : {{phone}}`,
    variables: ['contact_name', 'brand_name', 'sender_name', 'sports_portfolio', 'phone'],
    category: 'introduction',
    is_active: true, // Fixed: was 'is_Active'
    priority: 'high',
    segment_targeting: [MARKET_SEGMENTS.SPORTS],
    ab_test_variant: 'A', // Added missing property
    performance_metrics: {
      open_rate: 0.55,
      click_rate: 0.20,
      response_rate: 0.14,
      conversion_rate: 0.25,
      last_updated: '2024-01-22'
    }
  }
];