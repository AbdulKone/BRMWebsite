import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useErrorStore } from '../../stores/errorStore';

interface UnsubscribeManagerProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const UnsubscribeManager = ({ onSuccess, onError }: UnsubscribeManagerProps) => {
  const { handleError, handleSuccess } = useErrorStore();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const prospectId = searchParams.get('prospect');
  const campaignId = searchParams.get('campaign');

  const handleUnsubscribe = useCallback(async () => {
    if (!prospectId) {
      const errorMsg = 'Paramètres manquants pour le désabonnement';
      handleError(errorMsg);
      setLocalError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      // Vérifier que le prospect existe
      const { data: existingProspect, error: checkError } = await supabase
        .from('prospects')
        .select('id, status')
        .eq('id', prospectId)
        .single();

      if (checkError) {
        throw new Error('Prospect non trouvé');
      }

      if (existingProspect.status === 'unsubscribed') {
        setSuccess(true);
        onSuccess?.();
        return;
      }

      // Mettre à jour le statut du prospect
      const { error: updateError } = await supabase
        .from('prospects')
        .update({ 
          status: 'unsubscribed',
          updated_at: new Date().toISOString()
        })
        .eq('id', prospectId);

      if (updateError) throw updateError;

      // Enregistrer l'événement de désabonnement
      const { error: trackingError } = await supabase
        .from('email_tracking')
        .insert({
          prospect_id: prospectId,
          status: 'unsubscribed',
          sent_at: new Date().toISOString(),
          campaign_id: campaignId,
          subject: 'Désabonnement'
        });

      if (trackingError) {
        handleError(trackingError, 'Avertissement lors de l\'enregistrement du tracking');
        // Ne pas faire échouer le processus si le tracking échoue
      }

      setSuccess(true);
      handleSuccess('Désabonnement effectué avec succès');
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du désabonnement';
      handleError(errorMessage);
      setLocalError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [prospectId, campaignId, onSuccess, onError, handleError, handleSuccess]);

  const handleRetry = useCallback(() => {
    setLocalError(null);
    handleUnsubscribe();
  }, [handleUnsubscribe]);

  useEffect(() => {
    if (prospectId && !success && !loading && !localError) {
      handleUnsubscribe();
    }
  }, [prospectId, success, loading, localError, handleUnsubscribe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Traitement de votre demande...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Désabonnement confirmé</h1>
          <p className="text-gray-600 mb-6">
            Vous avez été désabonné avec succès de nos communications.
            Nous respectons votre choix.
          </p>
          <p className="text-sm text-gray-500">
            Si vous changez d'avis, vous pouvez toujours nous contacter directement.
          </p>
        </div>
      </div>
    );
  }

  if (localError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-6">{localError}</p>
          <div className="space-y-2">
            <button 
              onClick={handleRetry}
              className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UnsubscribeManager;