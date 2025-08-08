import React, { useState, useCallback, useMemo } from "react";
import isEqual from "lodash/isEqual";
import { motion } from "framer-motion";
import ConfirmDialog from '../shared/ConfirmDialog'; // Ajouter cette importation

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: string;
  duration: string;
  features: string[];
}

const initialFormData: Partial<Service> = { features: [] };

export default function ServicesAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<Partial<Service>>(initialFormData);
  const [newFeature, setNewFeature] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");

  const addFeature = useCallback(() => {
    setFormData((prev) => {
      if (newFeature.trim()) {
        return { ...prev, features: [...(prev.features || []), newFeature.trim()] };
      }
      return prev;
    });
    setNewFeature("");
  }, [newFeature]);

  const removeFeature = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const handleCloseForm = useCallback(() => {
    const hasChanges = !isEqual(formData, initialFormData);
    if (hasChanges) {
      setConfirmClose(true);
    } else {
      setFormData(initialFormData);
      setIsEditing(null);
      setActiveTab("list");
    }
  }, [formData]);

  const handleDeleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
    const price = Number((service.price || "").replace(/[^\d.-]/g, "")) || 0;
    const savings = price > 0 ? Math.round(price * 0.15) : 0;

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between"
      >
        <div>
          <div className="text-4xl mb-4">{service.icon}</div>
          <h3 className="text-xl font-bold mb-2">{service.title}</h3>
          <p className="text-gray-600 mb-4">{service.description}</p>
          <ul className="space-y-2 mb-4">
            {service.features.map((feature, idx) => (
              <li key={idx} className="flex items-center text-gray-600">
                ✅ <span className="ml-2">{feature}</span>
              </li>
            ))}
          </ul>
          <div className="text-lg font-semibold text-gray-900 mb-2">{service.price}</div>
          {savings > 0 && (
            <div className="text-sm text-green-600">💰 Économisez ~{savings}€</div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            aria-label={`Modifier le service ${service.title}`}
            onClick={() => {
              setIsEditing(service.id);
              setFormData(service);
              setActiveTab("form");
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Modifier
          </button>
          <button
            aria-label={`Supprimer le service ${service.title}`}
            onClick={() => handleDeleteService(service.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </motion.div>
    );
  };

  const renderServiceItem = useCallback((service: Service) => <ServiceCard key={service.id} service={service} />, []);

  const servicesList = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(renderServiceItem)}
      </div>
    ),
    [services, renderServiceItem]
  );

  const serviceForm = useMemo(
    () => (
      <motion.div
        key="form"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
      >
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? "Modifier un service" : "Ajouter un service"}
        </h2>
        <div className="space-y-4">
          <input
            placeholder="Titre"
            value={formData.title || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <textarea
            placeholder="Description"
            value={formData.description || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <input
            placeholder="Icône (emoji)"
            value={formData.icon || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <input
            placeholder="Prix"
            value={formData.price || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <input
            placeholder="Durée"
            value={formData.duration || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            className="w-full border p-2 rounded"
          />
          <div>
            <h4 className="font-semibold mb-2">Caractéristiques</h4>
            <div className="flex gap-2 mb-2">
              <input
                placeholder="Nouvelle caractéristique"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="flex-1 border p-2 rounded"
              />
              <button onClick={addFeature} className="px-3 py-1 bg-green-500 text-white rounded">
                Ajouter
              </button>
            </div>
            <ul className="space-y-1">
              {formData.features?.map((feature, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  {feature}
                  <button
                    onClick={() => removeFeature(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ❌
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded">Enregistrer</button>
            <button
              onClick={handleCloseForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            >
              Annuler
            </button>
          </div>
        </div>
      </motion.div>
    ),
    [formData, newFeature, addFeature, removeFeature, isEditing, handleCloseForm]
  );

  // Déplacer cette fonction AVANT le return
  const confirmCloseForm = useCallback(() => {
    setFormData(initialFormData);
    setIsEditing(null);
    setActiveTab("list");
    setConfirmClose(false);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestion des services</h1>
        <button
          onClick={() => {
            setFormData(initialFormData);
            setIsEditing(null);
            setActiveTab("form");
          }}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Ajouter un service
        </button>
      </div>
      {activeTab === "list" ? servicesList : serviceForm}
      
      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={confirmCloseForm}
        title="Fermer le formulaire"
        message="Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir fermer ?"
        confirmText="Fermer"
        cancelText="Continuer l'édition"
        type="warning"
      />
    </div>
  );
}
