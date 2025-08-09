import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { format, parse, isAfter, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReCAPTCHA from 'react-google-recaptcha';
import { supabase } from '../../lib/supabase';
import { rateLimit, checkBookingOverlap } from '../../lib/security';
import { useErrorStore } from '../../stores/errorStore';

interface BookingForm {
  client_name: string;
  date: string;
  start_time: string;
  end_time: string;
  studio_type: 'recording' | 'mixing' | 'mastering' | 'composition' | 'photo';
  notes: string;
}

const BookingPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BookingForm>();
  const { handleError, handleSuccess } = useErrorStore();

  const validateTimeRange = (start_time: string, end_time: string, date: string) => {
    const startDateTime = parse(`${date} ${start_time}`, 'yyyy-MM-dd HH:mm', new Date(), { locale: fr });
    let endDateTime = parse(`${date} ${end_time}`, 'yyyy-MM-dd HH:mm', new Date(), { locale: fr });

    // If end time is before start time, assume it's the next day
    if (isBefore(endDateTime, startDateTime)) {
      endDateTime = addDays(endDateTime, 1);
    }

    return {
      startDateTime,
      endDateTime,
      isValid: isAfter(endDateTime, startDateTime)
    };
  };

  const onSubmit = async (data: BookingForm) => {
    if (!captchaValue) {
      handleError("Veuillez confirmer que vous n'êtes pas un robot");
      return;
    }

    // Check rate limit
    if (!rateLimit(data.client_name)) {
      handleError("Vous avez atteint la limite de réservations. Veuillez réessayer plus tard.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate time range
      const { startDateTime, endDateTime, isValid } = validateTimeRange(
        data.start_time,
        data.end_time,
        data.date
      );

      if (!isValid) {
        throw new Error("L'heure de fin doit être après l'heure de début");
      }

      // Check for overlapping bookings
      const hasOverlap = await checkBookingOverlap(startDateTime, endDateTime, data.studio_type);
      if (hasOverlap) {
        throw new Error("Ce créneau horaire n'est pas disponible");
      }

      // Create anonymous session if needed
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
      }

      // Get the current session after potential anonymous sign-in
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        throw new Error("Impossible de créer une session");
      }

      const { error: bookingError } = await supabase.from('studio_bookings').insert([{
        ...data,
        user_id: currentSession.user.id,
        status: 'pending',
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString()
      }]);

      if (bookingError) {
        throw bookingError;
      }

      setIsSubmitted(true);
      reset();
      setCaptchaValue(null);
      handleSuccess('Votre réservation a été enregistrée avec succès !');
    } catch (err) {
      handleError(err, 'Erreur lors de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-4xl font-heading font-bold mb-6 gold-gradient">
            Réserver le Studio
          </h1>

          {isSubmitted ? (
            <div className="bg-primary-900 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Réservation Envoyée !</h2>
              <p className="text-gray-300 mb-6">
                Nous avons bien reçu votre demande de réservation. Notre équipe la traitera dans les plus brefs délais.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Nouvelle réservation
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white"
                  placeholder="Nom du client ou de l'artiste"
                  {...register('client_name', { required: 'Le nom du client est requis' })}
                />
                {errors.client_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.client_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white"
                  {...register('date', { required: 'La date est requise' })}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white"
                    {...register('start_time', { required: 'L\'heure de début est requise' })}
                  />
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-500">{errors.start_time.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white"
                    {...register('end_time', { required: 'L\'heure de fin est requise' })}
                  />
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-500">{errors.end_time.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type de session
                </label>
                <select
                  className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white"
                  {...register('studio_type', { required: 'Le type de session est requis' })}
                >
                  <option value="recording">Enregistrement</option>
                  <option value="mixing">Mixage</option>
                  <option value="mastering">Mastering</option>
                  <option value="composition">Composition</option>
                  <option value="photo">Shooting Photo</option>
                </select>
                {errors.studio_type && (
                  <p className="mt-1 text-sm text-red-500">{errors.studio_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes supplémentaires
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white resize-none"
                  placeholder="Détails sur votre projet, besoins spécifiques..."
                  {...register('notes')}
                ></textarea>
              </div>

              <div>
                <ReCAPTCHA
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                  onChange={(value) => setCaptchaValue(value)}
                  theme="dark"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isSubmitting
                    ? 'bg-accent-700 cursor-not-allowed'
                    : 'bg-accent-600 hover:bg-accent-700'
                } text-white`}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Réserver'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BookingPage;