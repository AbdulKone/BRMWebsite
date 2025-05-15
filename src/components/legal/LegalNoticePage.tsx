import { motion } from 'framer-motion';

const LegalNoticePage = () => {
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
            Mentions Légales
          </h1>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              1. Informations Légales
            </h2>
            <p className="text-gray-300 mb-4">
              Le site blackroadmusic.com est édité par :
            </p>
            <div className="text-gray-300 mb-6">
              <p>Black Road Music</p>
              <p>32 Rue de la Musique</p>
              <p>75011 Paris, France</p>
              <p>SIRET : XX XXX XXX XXXXX</p>
              <p>Capital social : XX XXX €</p>
              <p>TVA Intracommunautaire : FR XX XXX XXX XXX</p>
            </div>
            <p className="text-gray-300">
              Directeur de la publication : KAAZTHENOVA<br />
              Email : blackroadmusic@hotmail.com<br />
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              2. Hébergement
            </h2>
            <p className="text-gray-300">
              Le site est hébergé par :<br />
              [Vercel]<br />
              {/*[Adresse de l'hébergeur]<br />
              [Contact de l'hébergeur]*/}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              3. Propriété Intellectuelle
            </h2>
            <p className="text-gray-300 mb-4">
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est protégé par 
              le droit d'auteur et est la propriété exclusive de Black Road Music SARL.
            </p>
            <p className="text-gray-300">
              Toute reproduction, représentation, modification, publication, transmission, ou plus 
              généralement toute exploitation non autorisée du site et de son contenu est strictement interdite.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              4. Données Personnelles
            </h2>
            <p className="text-gray-300">
              Les informations concernant la collecte et le traitement des données personnelles sont 
              détaillées dans notre <a href="/politique-de-confidentialite" className="text-accent-400 hover:text-accent-300">
              Politique de Confidentialité</a>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              5. Cookies
            </h2>
            <p className="text-gray-300">
              Le site utilise des cookies pour améliorer l'expérience utilisateur. Pour plus d'informations, 
              consultez notre <a href="/politique-de-confidentialite#cookies" className="text-accent-400 hover:text-accent-300">
              Politique de Cookies</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold mb-4 gold-gradient">
              6. Droit Applicable
            </h2>
            <p className="text-gray-300">
              Les présentes mentions légales sont régies par le droit français. En cas de litige, les 
              tribunaux français seront seuls compétents.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default LegalNoticePage;