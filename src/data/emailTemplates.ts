export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'introduction' | 'follow_up' | 'proposal' | 'nurturing' | 'closing' | 'reactivation';
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  segment_targeting?: string[];
  ab_test_variant?: 'A' | 'B' | 'C';
  performance_metrics?: {
    open_rate: number;
    click_rate: number;
    response_rate: number;
    conversion_rate: number;
    last_updated: string;
  };
}

// Templates de base (renommé pour éviter la redéclaration)
export const baseEmailTemplates: EmailTemplate[] = [
  {
    id: 'visual_intro_advertising',
    name: 'Introduction Spécialisée - Publicité Visuelle',
    subject: '🎬 Transformez vos campagnes avec des visuels qui marquent les esprits',
    content: `Bonjour {{contact_name}},

J'ai remarqué les campagnes innovantes de {{company_name}} et je pense que nous pourrions créer quelque chose d'exceptionnel ensemble.

En tant que spécialiste en production visuelle, j'aide les marques comme la vôtre à :
• Créer des contenus publicitaires qui génèrent +40% d'engagement
• Développer une identité visuelle mémorable et différenciante
• Optimiser le ROI de vos campagnes grâce à des visuels performants

🎯 **Résultats récents :**
- Campagne pour [Client A] : +65% de taux de clic
- Série visuelle pour [Client B] : 2M+ de vues organiques
- Rebranding complet : +30% de reconnaissance de marque

J'aimerais vous montrer comment nous pourrions amplifier l'impact visuel de {{company_name}}.

Seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Cordialement,
{{sender_name}}

P.S. : Je peux vous envoyer notre portfolio spécialisé en publicité si cela vous intéresse.`,
    variables: ['contact_name', 'company_name', 'sender_name'],
    category: 'introduction',
    isActive: true,
    priority: 'high',
    segment_targeting: ['enterprise', 'creative_agencies'],
    ab_test_variant: 'A',
    performance_metrics: {
      open_rate: 0.45,
      click_rate: 0.12,
      response_rate: 0.08,
      conversion_rate: 0.15,
      last_updated: '2024-01-15'
    }
  },
  {
    id: 'film_intro_specialized',
    name: 'Introduction Spécialisée - Production Cinématographique',
    subject: '🎥 Donnez vie à vos histoires avec une production cinématographique d\'exception',
    content: `Bonjour {{contact_name}},

Votre approche narrative chez {{company_name}} m'a particulièrement impressionné. Je pense que nous partageons la même vision : créer des contenus qui touchent et transforment.

**Mon expertise en production cinématographique :**
• Direction artistique et réalisation de films corporate
• Production de contenus narratifs pour marques premium
• Post-production avancée (colorimétrie, effets visuels, sound design)

🏆 **Projets marquants :**
- Film institutionnel [Client A] : Prix du meilleur film corporate 2023
- Série documentaire [Client B] : 5M+ de vues, diffusion internationale
- Campagne narrative [Client C] : +200% d'engagement social

**Ce que je propose :**
✓ Audit gratuit de vos besoins en contenu vidéo
✓ Concept créatif personnalisé pour {{company_name}}
✓ Devis détaillé avec timeline de production

Pourriez-vous me consacrer 20 minutes pour explorer les possibilités ?

Au plaisir d'échanger,
{{sender_name}}

📱 Calendly : [lien de réservation]
🎬 Portfolio : [lien vers showreel]`,
    variables: ['contact_name', 'company_name', 'sender_name'],
    category: 'introduction',
    isActive: true,
    priority: 'high',
    segment_targeting: ['enterprise', 'creative_agencies'],
    ab_test_variant: 'B'
  },
  {
    id: 'detailed_commercial_proposal',
    name: 'Proposition Commerciale Détaillée',
    subject: '📋 Proposition personnalisée pour {{company_name}} - Production visuelle premium',
    content: `Bonjour {{contact_name}},

Suite à notre échange, voici la proposition détaillée pour accompagner {{company_name}} dans ses projets visuels.

**🎯 OBJECTIFS IDENTIFIÉS :**
• {{objective_1}}
• {{objective_2}}
• {{objective_3}}

**📦 SOLUTION PROPOSÉE :**

**Phase 1 : Conception & Pré-production ({{duration_phase1}})**
- Audit approfondi de vos besoins
- Développement du concept créatif
- Storyboard et moodboard détaillés
- Planning de production optimisé

**Phase 2 : Production ({{duration_phase2}})**
- Tournage avec équipe technique experte
- Direction artistique sur mesure
- Matériel professionnel 4K/8K
- Gestion complète de la logistique

**Phase 3 : Post-production & Livraison ({{duration_phase3}})**
- Montage professionnel
- Étalonnage colorimétrique avancé
- Sound design et mixage audio
- Formats multiples pour tous vos canaux

**💰 INVESTISSEMENT :**
- Package complet : {{total_price}}€ HT
- Paiement échelonné possible
- Garantie satisfaction 100%

**🎁 BONUS INCLUS :**
✓ 3 révisions incluses
✓ Fichiers sources fournis
✓ Formation équipe interne
✓ Support technique 6 mois

**⏰ PROCHAINES ÉTAPES :**
1. Validation de la proposition
2. Signature du contrat
3. Lancement immédiat (dispo dès {{start_date}})

Je reste à votre disposition pour tout ajustement.

Cordialement,
{{sender_name}}

📞 {{phone}}
📧 {{email}}`,
    variables: ['contact_name', 'company_name', 'objective_1', 'objective_2', 'objective_3', 'duration_phase1', 'duration_phase2', 'duration_phase3', 'total_price', 'start_date', 'sender_name', 'phone', 'email'],
    category: 'proposal',
    isActive: true,
    priority: 'high',
    segment_targeting: ['enterprise']
  },
  {
    id: 'portfolio_presentation_demo',
    name: 'Présentation Portfolio avec Démo',
    subject: '🎨 Découvrez notre savoir-faire en action - Démo personnalisée pour {{company_name}}',
    content: `Bonjour {{contact_name}},

Pour vous donner un aperçu concret de ce que nous pourrions créer ensemble, j'ai préparé une sélection de projets similaires à vos besoins.

**🎬 PORTFOLIO SÉLECTIONNÉ POUR {{company_name}} :**

**Projet 1 : [Nom du projet]**
• Secteur : {{industry}}
• Défi : Augmenter la notoriété de marque
• Solution : Campagne vidéo multi-format
• Résultat : +150% de visibilité, +40% de leads
🔗 Voir le projet : [lien]

**Projet 2 : [Nom du projet]**
• Secteur : {{industry}}
• Défi : Lancement produit innovant
• Solution : Film produit + contenus sociaux
• Résultat : 2M+ vues, 25% de conversion
🔗 Voir le projet : [lien]

**Projet 3 : [Nom du projet]**
• Secteur : {{industry}}
• Défi : Repositionnement de marque
• Solution : Identité visuelle complète
• Résultat : +60% de reconnaissance marque
🔗 Voir le projet : [lien]

**🎯 DÉMO PERSONNALISÉE :**
J'ai également créé un mockup rapide montrant comment nous pourrions adapter notre approche à {{company_name}} :

🔗 **Voir la démo : [lien vers démo personnalisée]**

**💡 CE QUE VOUS Y DÉCOUVRIREZ :**
• Concept visuel adapté à votre secteur
• Exemples de formats pour vos canaux
• Estimation timeline et budget
• Recommandations stratégiques

Cette démo vous prendra 3 minutes à consulter et vous donnera une vision claire de nos possibilités de collaboration.

Qu'en pensez-vous ? Souhaitez-vous que nous approfondissions l'une de ces pistes ?

Bien à vous,
{{sender_name}}

📱 Planning : [lien Calendly]
💼 Portfolio complet : [lien]`,
    variables: ['contact_name', 'company_name', 'industry', 'sender_name'],
    category: 'follow_up',
    isActive: true,
    priority: 'high',
    segment_targeting: ['enterprise', 'creative_agencies']
  },
  {
    id: 'project_confirmation_planning',
    name: 'Confirmation Projet avec Planning Détaillé',
    subject: '✅ Confirmation projet {{company_name}} - Planning et prochaines étapes',
    content: `Bonjour {{contact_name}},

Excellente nouvelle ! Je confirme le lancement de votre projet de production visuelle.

**📋 RÉCAPITULATIF PROJET :**
• Client : {{company_name}}
• Projet : {{project_name}}
• Budget validé : {{budget}}€ HT
• Date de début : {{start_date}}
• Livraison prévue : {{delivery_date}}

**📅 PLANNING DÉTAILLÉ :**

**Semaine 1-2 : Pré-production**
- Lundi {{date1}} : Réunion de lancement (2h)
- Mercredi {{date2}} : Présentation concepts créatifs
- Vendredi {{date3}} : Validation finale concept
- Préparation technique et casting

**Semaine 3-4 : Production**
- {{date4}} : Jour 1 de tournage
- {{date5}} : Jour 2 de tournage (si applicable)
- Capture de tous les éléments visuels
- Validation quotidienne des rushes

**Semaine 5-6 : Post-production**
- Montage et assemblage
- Étalonnage et effets visuels
- Sound design et mixage
- Première version pour validation

**Semaine 7 : Finalisation**
- Intégration de vos retours
- Livraison finale tous formats
- Formation de votre équipe
- Archivage et sauvegarde

**👥 ÉQUIPE DÉDIÉE :**
• Chef de projet : {{project_manager}}
• Réalisateur : {{director}}
• Directeur photo : {{dop}}
• Monteur : {{editor}}

**📞 POINTS DE CONTACT RÉGULIERS :**
• Réunions hebdomadaires : Tous les mardis 14h
• Rapports d'avancement : Vendredis par email
• Urgences : {{emergency_phone}} (24h/7j)

**📁 ACCÈS PROJET :**
• Plateforme collaborative : [lien]
• Partage de fichiers : [lien]
• Suivi temps réel : [lien dashboard]

**🎯 PROCHAINES ACTIONS :**
1. Signature contrat (si pas encore fait)
2. Acompte de 30% pour démarrage
3. Réunion de lancement {{start_date}} à {{time}}

J'ai hâte de commencer cette collaboration !

Cordialement,
{{sender_name}}

📧 {{email}}
📱 {{phone}}
🌐 {{website}}`,
    variables: ['contact_name', 'company_name', 'project_name', 'budget', 'start_date', 'delivery_date', 'date1', 'date2', 'date3', 'date4', 'date5', 'project_manager', 'director', 'dop', 'editor', 'emergency_phone', 'time', 'sender_name', 'email', 'phone', 'website'],
    category: 'closing',
    isActive: true,
    priority: 'high'
  },
  {
    id: 'advanced_follow_up_sequence_1',
    name: 'Séquence Follow-up Avancée - Email 1',
    subject: '🎬 {{contact_name}}, avez-vous eu l\'occasion de consulter notre proposition ?',
    content: `Bonjour {{contact_name}},

J'espère que vous allez bien. Je me permets de revenir vers vous concernant notre proposition de collaboration pour {{company_name}}.

Je sais que les décisions importantes prennent du temps, et c'est tout à fait normal. Cependant, j'aimerais m'assurer que vous avez toutes les informations nécessaires.

**🤔 Avez-vous des questions spécifiques sur :**
• Le processus de production ?
• Les délais de réalisation ?
• Les aspects techniques ?
• Le budget et les modalités ?

**💡 Nouveauté :** J'ai récemment terminé un projet similaire au vôtre pour [Client récent]. Les résultats sont impressionnants : +180% d'engagement sur leurs contenus visuels.

Souhaiteriez-vous que je vous envoie cette case study ?

Je reste à votre entière disposition pour échanger.

Bien à vous,
{{sender_name}}

P.S. : Si le timing n'est pas optimal actuellement, n'hésitez pas à me le faire savoir. Je peux vous recontacter à un moment plus approprié.`,
    variables: ['contact_name', 'company_name', 'sender_name'],
    category: 'follow_up',
    isActive: true,
    priority: 'medium',
    ab_test_variant: 'A'
  },
  {
    id: 'advanced_follow_up_sequence_2',
    name: 'Séquence Follow-up Avancée - Email 2',
    subject: '📈 Dernières tendances visuelles pour {{industry}} - Insights pour {{company_name}}',
    content: `Bonjour {{contact_name}},

J'ai pensé à {{company_name}} en analysant les dernières tendances visuelles dans le secteur {{industry}}.

**🔍 INSIGHTS SECTORIELS :**

**Tendance #1 : Authenticité Visuelle**
• +65% de préférence pour les contenus "real-life"
• Impact sur l'engagement : +40%
• Recommandation : Intégrer plus de behind-the-scenes

**Tendance #2 : Formats Courts Optimisés**
• 85% du contenu consommé en <60 secondes
• Taux de rétention : +120% vs formats longs
• Opportunité : Créer des séries de micro-contenus

**Tendance #3 : Personnalisation Interactive**
• 73% des marques investissent dans l'interactivité
• ROI moyen : +200%
• Application : Contenus adaptatifs par audience

**🎯 APPLICATION POUR {{company_name}} :**
Basé sur votre positionnement, je vois 3 opportunités immédiates :
1. {{opportunity_1}}
2. {{opportunity_2}}
3. {{opportunity_3}}

**📊 ÉTUDE COMPLÈTE :**
J'ai préparé une analyse de 15 pages spécifique à votre secteur. Elle inclut :
• Benchmark concurrentiel visuel
• Recommandations stratégiques
• Exemples d'implémentation
• ROI estimé par action

Souhaitez-vous que je vous l'envoie ?

Cordialement,
{{sender_name}}

🔗 Réserver un créneau : [lien]
📧 Répondre directement à cet email`,
    variables: ['contact_name', 'company_name', 'industry', 'opportunity_1', 'opportunity_2', 'opportunity_3', 'sender_name'],
    category: 'nurturing',
    isActive: true,
    priority: 'medium'
  }
];

// Imports des types
export * from './types/emailTypes';

// Imports des constantes
export * from './constants/emailConstants';

// Imports des templates
import { musicTemplates } from './templates/musicTemplates';
import { luxuryTemplates } from './templates/luxuryTemplates';
import { sportsTemplates } from './templates/sportsTemplates';
import { weddingTemplates } from './templates/weddingTemplates';
import { commonTemplates } from './templates/commonTemplates';

// Imports des utilitaires
export * from './utils/templateUtils';
export * from './utils/templateCompiler';
export * from './utils/templateSelector';
export * from './utils/performanceManager';

// Combinaison de tous les templates (garde le nom emailTemplates)
export const emailTemplates = [
  ...baseEmailTemplates,
  ...musicTemplates,
  ...luxuryTemplates,
  ...sportsTemplates,
  ...weddingTemplates,
  ...commonTemplates
];

// Fonctions de convenance qui utilisent la liste consolidée
export const getTemplate = (id: string) => 
  emailTemplates.find(template => template.id === id && template.isActive);

export const getTemplatesByCategory = (category: string) => 
  emailTemplates.filter(template => template.category === category && template.isActive);

export const getTemplatesBySegment = (segment: string) => 
  emailTemplates.filter(template => 
    template.isActive && 
    (template.segment_targeting?.includes(segment) || !template.segment_targeting)
  );

export const getBestPerformingTemplate = (category: EmailTemplate['category']): EmailTemplate | undefined => {
  const templates = getTemplatesByCategory(category);
  return templates.reduce((best, current) => {
    const bestScore = (best.performance_metrics?.response_rate || 0) * (best.performance_metrics?.conversion_rate || 0);
    const currentScore = (current.performance_metrics?.response_rate || 0) * (current.performance_metrics?.conversion_rate || 0);
    return currentScore > bestScore ? current : best;
  });
};

export const getFollowUpSequence = (initialTemplateId: string): EmailTemplate[] => {
  const sequences: { [key: string]: string[] } = {
    'visual_intro_advertising': ['advanced_follow_up_sequence_1', 'advanced_follow_up_sequence_2'],
    'film_intro_specialized': ['portfolio_presentation_demo', 'detailed_commercial_proposal']
  };
  
  const sequenceIds = sequences[initialTemplateId] || [];
  return sequenceIds.map(id => getTemplate(id)).filter(Boolean) as EmailTemplate[];
};

export const compileTemplate = (template: EmailTemplate, variables: Record<string, string>): { subject: string; content: string } => {
  let compiledSubject = template.subject;
  let compiledContent = template.content;

  // Remplacer les variables dans le sujet et le contenu
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiledSubject = compiledSubject.replace(regex, value);
    compiledContent = compiledContent.replace(regex, value);
  });

  return {
    subject: compiledSubject,
    content: compiledContent
  };
};

// Nouvelles fonctions avancées
export const generateUnsubscribeLink = (prospectId: string): string => {
  return `${window.location.origin}/unsubscribe?id=${prospectId}`;
};

export const generateBookingLink = (prospectId: string): string => {
  return `${window.location.origin}/book-meeting?prospect=${prospectId}`;
};

export const validateTemplateVariables = (template: EmailTemplate, variables: Record<string, string>): string[] => {
  const missingVariables: string[] = [];
  
  template.variables.forEach(variable => {
    if (!variables[variable] || variables[variable].trim() === '') {
      missingVariables.push(variable);
    }
  });
  
  return missingVariables;
};

export const selectTemplateVariant = (templateId: string): EmailTemplate | undefined => {
  const variants = emailTemplates.filter(t => t.id.startsWith(templateId) && t.isActive);
  if (variants.length === 0) return undefined;
  
  // Sélection basée sur les performances ou aléatoire pour A/B testing
  const bestVariant = variants.reduce((best, current) => {
    const bestScore = best.performance_metrics?.response_rate || 0;
    const currentScore = current.performance_metrics?.response_rate || 0;
    return currentScore > bestScore ? current : best;
  });
  
  return bestVariant;
};

export const updateTemplatePerformance = (templateId: string, metrics: Partial<EmailTemplate['performance_metrics']>): void => {
  const templateIndex = emailTemplates.findIndex(t => t.id === templateId);
  if (templateIndex !== -1) {
    emailTemplates[templateIndex].performance_metrics = {
      ...emailTemplates[templateIndex].performance_metrics,
      ...metrics,
      last_updated: new Date().toISOString()
    } as EmailTemplate['performance_metrics'];
  }
};