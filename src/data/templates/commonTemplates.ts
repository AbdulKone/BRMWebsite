import { EmailTemplate } from '../types/emailTypes';
import { MARKET_SEGMENTS } from '../constants/emailConstants';

export const commonTemplates: EmailTemplate[] = [
  {
    id: 'detailed_video_proposal',
    template_key: 'detailed_video_proposal', // Added missing property
    name: 'Proposition Commerciale Vidéo Complète',
    subject: '📋 Votre projet {{project_type}} - Proposition détaillée et timeline',
    content: `Bonjour {{contact_name}},

Suite à notre échange passionnant, voici ma proposition détaillée pour votre projet {{project_type}}.

**🎯 OBJECTIFS CONFIRMÉS :**
• {{objective_1}}
• {{objective_2}}
• {{objective_3}}

**📦 SOLUTION CRÉATIVE PROPOSÉE :**

**PHASE 1 : PRÉ-PRODUCTION ({{phase1_duration}})**
✓ Développement concept créatif
✓ Storyboard détaillé et moodboard
✓ Casting et repérages
✓ Planning de tournage optimisé
✓ Préparation technique complète

**PHASE 2 : PRODUCTION ({{phase2_duration}})**
✓ Tournage avec équipe experte
✓ Direction artistique personnalisée
✓ Matériel professionnel 4K/6K
✓ Éclairage cinématographique
✓ Prises de vue aériennes (drone)

**PHASE 3 : POST-PRODUCTION ({{phase3_duration}})**
✓ Montage professionnel
✓ Étalonnage colorimétrique avancé
✓ Sound design et mixage audio
✓ Effets visuels sur-mesure
✓ Formats multiples (web, TV, cinéma)

**💰 INVESTISSEMENT TOTAL :**
• Package complet : {{total_price}}€ HT
• Acompte 40% à la signature
• Solde à la livraison
• Paiement en 3x possible

**🎁 INCLUS DANS L'OFFRE :**
✅ 3 révisions majeures incluses
✅ Fichiers sources haute définition
✅ Droits d'exploitation illimités
✅ Support technique 12 mois
✅ Formation de votre équipe

**⏰ PLANNING PRÉVISIONNEL :**
📅 Signature contrat : {{contract_date}}
🎬 Début tournage : {{shooting_start}}
🎞️ Livraison finale : {{delivery_date}}

**👥 ÉQUIPE DÉDIÉE :**
• Réalisateur : {{director_name}}
• Chef opérateur : {{dop_name}}
• Monteur : {{editor_name}}
• Chef de projet : {{project_manager}}

Je suis convaincu que ce projet sera un succès retentissant. Validons ensemble les derniers détails !

Cordialement,
{{sender_name}}

📞 {{phone}}
📧 {{email}}
🌐 {{website}}`,
    variables: ['contact_name', 'project_type', 'objective_1', 'objective_2', 'objective_3', 'phase1_duration', 'phase2_duration', 'phase3_duration', 'total_price', 'contract_date', 'shooting_start', 'delivery_date', 'director_name', 'dop_name', 'editor_name', 'project_manager', 'sender_name', 'phone', 'email', 'website'],
    category: 'proposal',
    is_active: true, // Fixed: was 'is_Active'
    priority: 'high',
    segment_targeting: [MARKET_SEGMENTS.MUSIC, MARKET_SEGMENTS.LUXURY, MARKET_SEGMENTS.SPORTS, MARKET_SEGMENTS.WEDDING],
    ab_test_variant: 'A', // Added missing property
    performance_metrics: { // Added missing property
      open_rate: 0.45,
      click_rate: 0.12,
      response_rate: 0.08,
      conversion_rate: 0.20,
      last_updated: '2024-01-15'
    }
  }
];