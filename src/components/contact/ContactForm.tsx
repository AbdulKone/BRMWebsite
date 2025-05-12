import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { supabase } from '../../lib/supabase';
import { checkRateLimit, generateCSRFToken } from '../../lib/security';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (!captchaValue) {
      alert('Veuillez confirmer que vous n\'êtes pas un robot');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error: submitError } = await supabase
        .from('contact_messages')
        .insert([{
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: 'new'
        }]);

      if (submitError) throw submitError;
      
      setIsSubmitted(true);
      reset();
      setCaptchaValue(null);
    } catch (err) {
      setError('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.');
      console.error('Error submitting message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptchaChange = (value: string | null) => {
    setCaptchaValue(value);
  };

  return (
    <div className="bg-primary-900 rounded-xl p-6 md:p-8">
      {isSubmitted ? (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-accent-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-bold mb-2">Message envoyé !</h3>
          <p className="text-gray-400 mb-6">
            Merci de nous avoir contacté. Nous vous répondrons dans les plus brefs délais.
          </p>
          <button
            className="bg-accent-600 hover:bg-accent-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            onClick={() => setIsSubmitted(false)}
          >
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 text-red-400 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Nom
            </label>
            <input
              type="text"
              id="name"
              className={`w-full px-4 py-2.5 bg-primary-800 border ${
                errors.name ? 'border-red-500' : 'border-primary-700'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-white`}
              placeholder="Votre nom"
              {...register('name', { required: 'Le nom est requis' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className={`w-full px-4 py-2.5 bg-primary-800 border ${
                errors.email ? 'border-red-500' : 'border-primary-700'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-white`}
              placeholder="votre@email.com"
              {...register('email', {
                required: 'L\'email est requis',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Email invalide'
                }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Sujet
            </label>
            <input
              type="text"
              id="subject"
              className={`w-full px-4 py-2.5 bg-primary-800 border ${
                errors.subject ? 'border-red-500' : 'border-primary-700'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-white`}
              placeholder="Sujet de votre message"
              {...register('subject', { required: 'Le sujet est requis' })}
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              className={`w-full px-4 py-2.5 bg-primary-800 border ${
                errors.message ? 'border-red-500' : 'border-primary-700'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-white resize-none`}
              placeholder="Votre message"
              {...register('message', {
                required: 'Le message est requis',
                minLength: {
                  value: 10,
                  message: 'Le message doit contenir au moins 10 caractères'
                }
              })}
            ></textarea>
            {errors.message && (
              <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>

          <div>
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={handleCaptchaChange}
              theme="dark"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              isSubmitting
                ? 'bg-accent-700 cursor-not-allowed'
                : 'bg-accent-600 hover:bg-accent-700 hover:shadow-[0_0_15px_rgba(185,158,119,0.3)]'
            } text-white`}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;