import { motion } from 'framer-motion';

const PrivacyPage = () => {
  return (
    <div className="pt-24 pb-20 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="prose prose-invert max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-heading font-bold mb-8 gold-gradient">
            Politique de Confidentialité
          </h1>

          <p className="text-gray-300 mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              1. Collecte des Informations
            </h2>
            <p className="text-gray-300 mb-4">
              Black Road Music collecte les informations suivantes lorsque vous utilisez notre site web :
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Nom et prénom</li>
              <li>Adresse e-mail</li>
              <li>Messages envoyés via le formulaire de contact</li>
              <li>Données de navigation (cookies)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              2. Utilisation des Informations
            </h2>
            <p className="text-gray-300 mb-4">
              Les informations collectées sont utilisées pour :
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Répondre à vos demandes de contact</li>
              <li>Améliorer notre site web et nos services</li>
              <li>Vous informer sur nos actualités et offres (avec votre consentement)</li>
              <li>Assurer la sécurité de notre site</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              3. Protection des Données
            </h2>
            <p className="text-gray-300 mb-4">
              Nous mettons en œuvre des mesures de sécurité pour protéger vos informations :
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Utilisation du protocole HTTPS</li>
              <li>Protection contre les attaques par force brute</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Mise à jour régulière de nos systèmes de sécurité</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              4. Vos Droits
            </h2>
            <p className="text-gray-300 mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              5. Cookies
            </h2>
            <p className="text-gray-300 mb-4">
              Notre site utilise des cookies pour améliorer votre expérience. Vous pouvez les désactiver 
              dans les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              6. Contact
            </h2>
            <p className="text-gray-300">
              Pour toute question concernant notre politique de confidentialité, contactez-nous à :<br />
              Email : privacy@blackroadmusic.com<br />
              Adresse : 32 Rue de la Musique, 75011 Paris, France
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPage;