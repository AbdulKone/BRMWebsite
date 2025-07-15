import { useState } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';

const ProspectsList = () => {
  const { prospects, isLoading, error } = useProspectionStore();

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">Liste des Prospects</h2>
      <div className="grid gap-4">
        {prospects.map(prospect => (
          <div key={prospect.id} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold">{prospect.company_name}</h3>
            <p>{prospect.contact_name}</p>
            <p>{prospect.email}</p>
            <p>Statut: {prospect.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProspectsList;