import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useErrorStore } from '../../stores/errorStore';

interface DragDropReorderProps<T> {
  items: T[];
  onReorder: (items: T[]) => Promise<void>;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemId: (item: T) => string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

function DragDropReorder<T>({
  items,
  onReorder,
  renderItem,
  getItemId,
  title,
  isOpen,
  onClose
}: DragDropReorderProps<T>) {
  const [reorderedItems, setReorderedItems] = useState<T[]>(items);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { handleError, handleSuccess } = useErrorStore();

  React.useEffect(() => {
    setReorderedItems(items);
    setHasChanges(false);
  }, [items]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(reorderedItems);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setReorderedItems(newItems);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onReorder(reorderedItems);
      setHasChanges(false);
      handleSuccess('Ordre mis à jour avec succès');
      onClose();
    } catch (error) {
      handleError(error, 'Erreur lors de la sauvegarde de l\'ordre');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setReorderedItems(items);
    setHasChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleCancel()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Réorganiser {title}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-400 mt-2">
              Glissez-déposez les éléments pour modifier leur ordre d'affichage
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="reorder-list">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-purple-500/5 rounded-lg p-2' : ''
                    }`}
                  >
                    {reorderedItems.map((item, index) => (
                      <Draggable
                        key={getItemId(item)}
                        draggableId={getItemId(item)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-gray-800/50 border border-gray-700 rounded-xl p-4 transition-all ${
                              snapshot.isDragging
                                ? 'shadow-2xl border-purple-500/50 bg-gray-800'
                                : 'hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-purple-400 cursor-grab active:cursor-grabbing transition-colors"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                {renderItem(item, index)}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">
                                #{index + 1}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Footer */}
          <div className="bg-gray-900/50 border-t border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {hasChanges ? (
                  <span className="text-yellow-400">• Modifications non sauvegardées</span>
                ) : (
                  <span>Aucune modification</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DragDropReorder;