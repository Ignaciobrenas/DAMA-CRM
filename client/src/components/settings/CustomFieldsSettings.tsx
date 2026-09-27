import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListFilter,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../services/api';

interface CustomFieldItem {
  id: string;
  entityType: string;
  name: string;
  label: string;
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'BOOLEAN';
  optionsJson?: string | null;
  isRequired: boolean;
  defaultValue?: string | null;
  createdAt: string;
}

const ENTITY_TYPES = [
  { id: 'CONTACT', label: 'Contactos y Clientes' },
  { id: 'COMPANY', label: 'Empresas y Cuentas' },
  { id: 'DEAL', label: 'Oportunidades (Deals)' },
  { id: 'PROJECT', label: 'Proyectos Ágiles' },
  { id: 'TASK', label: 'Tareas y Entregables' },
  { id: 'INVOICE', label: 'Facturas y Presupuestos' },
  { id: 'PRODUCT', label: 'Catálogo de Inventario' },
  { id: 'TICKET', label: 'Mesa de Ayuda (Tickets)' },
];

const FIELD_TYPES = [
  { id: 'TEXT', label: 'Texto corto / Cadena' },
  { id: 'NUMBER', label: 'Número decimal / Entero' },
  { id: 'SELECT', label: 'Lista desplegable (Opciones)' },
  { id: 'DATE', label: 'Fecha (Selector calendario)' },
  { id: 'BOOLEAN', label: 'Casilla Sí/No (Booleano)' },
];

export const CustomFieldsSettings: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [fields, setFields] = useState<CustomFieldItem[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('CONTACT');
  const [isLoading, setIsLoading] = useState(false);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    entityType: 'CONTACT',
    name: '',
    label: '',
    fieldType: 'TEXT',
    optionsText: '',
    isRequired: false,
    defaultValue: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFields = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest(`/custom-fields?entityType=${selectedEntity}`);
      if (res.success && res.data) {
        setFields(res.data);
      }
    } catch {
      toast.error('Error', 'No se pudieron cargar los campos personalizados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, [selectedEntity]);

  const handleOpenCreate = () => {
    setEditingFieldId(null);
    setFormData({
      entityType: selectedEntity,
      name: '',
      label: '',
      fieldType: 'TEXT',
      optionsText: '',
      isRequired: false,
      defaultValue: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (field: CustomFieldItem) => {
    setEditingFieldId(field.id);
    let opts = '';
    if (field.optionsJson) {
      try {
        const parsed = JSON.parse(field.optionsJson);
        if (Array.isArray(parsed)) opts = parsed.join(', ');
      } catch {}
    }

    setFormData({
      entityType: field.entityType,
      name: field.name,
      label: field.label,
      fieldType: field.fieldType,
      optionsText: opts,
      isRequired: field.isRequired,
      defaultValue: field.defaultValue || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      toast.warning('Campo requerido', 'Por favor ingresa una etiqueta para el campo.');
      return;
    }

    let parsedOptions: string[] | null = null;
    if (formData.fieldType === 'SELECT' && formData.optionsText.trim()) {
      parsedOptions = formData.optionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    setIsSubmitting(true);
    try {
      if (editingFieldId) {
        const res = await apiRequest(`/custom-fields/${editingFieldId}`, {
          method: 'PUT',
          body: JSON.stringify({
            label: formData.label.trim(),
            fieldType: formData.fieldType,
            options: parsedOptions,
            isRequired: formData.isRequired,
            defaultValue: formData.defaultValue.trim() || null,
          }),
        });

        if (res.success) {
          toast.success('Campo Actualizado', 'El campo personalizado ha sido modificado.');
          setIsModalOpen(false);
          loadFields();
        } else {
          toast.error('Error al actualizar', res.message);
        }
      } else {
        const safeName = formData.name.trim() || formData.label.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const res = await apiRequest('/custom-fields', {
          method: 'POST',
          body: JSON.stringify({
            entityType: formData.entityType,
            name: safeName,
            label: formData.label.trim(),
            fieldType: formData.fieldType,
            options: parsedOptions,
            isRequired: formData.isRequired,
            defaultValue: formData.defaultValue.trim() || null,
          }),
        });

        if (res.success) {
          toast.success('Campo Creado', 'El nuevo campo personalizado ha sido guardado.');
          setIsModalOpen(false);
          loadFields();
        } else {
          toast.error('Error al crear', res.message);
        }
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Operación fallida');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (field: CustomFieldItem) => {
    if (!window.confirm(`¿Estás seguro de eliminar el campo "${field.label}"? Se perderán los valores registrados.`)) {
      return;
    }

    try {
      const res = await apiRequest(`/custom-fields/${field.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        toast.info('Campo Eliminado', `El campo ${field.label} ha sido eliminado.`);
        loadFields();
      } else {
        toast.error('Error al eliminar', res.message);
      }
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Campos Personalizados (Metadatos Dinámicos)
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  Totalmente Personalizable
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Añade atributos y campos a medida para contactos, empresas, oportunidades, facturas y proyectos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Campo</span>
          </button>
        </div>

        {/* Entity Selector Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 pb-2">
          {ENTITY_TYPES.map((ent) => {
            const isSelected = selectedEntity === ent.id;
            return (
              <button
                key={ent.id}
                type="button"
                onClick={() => setSelectedEntity(ent.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-transparent'
                }`}
              >
                {ent.label}
              </button>
            );
          })}
        </div>

        {/* Fields List Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Etiqueta & Identificador</th>
                <th className="px-4 py-3">Tipo de Dato</th>
                <th className="px-4 py-3">Obligatorio</th>
                <th className="px-4 py-3">Valor por Defecto / Opciones</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Cargando campos personalizados...
                  </td>
                </tr>
              ) : fields.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No hay campos personalizados configurados para {ENTITY_TYPES.find((e) => e.id === selectedEntity)?.label}.
                  </td>
                </tr>
              ) : (
                fields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 dark:text-white">{field.label}</div>
                      <div className="text-[10px] text-gray-400 font-mono">key: {field.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        {FIELD_TYPES.find((f) => f.id === field.fieldType)?.label || field.fieldType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {field.isRequired ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">Sí (Requerido)</span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Opcional</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-[11px]">
                      {field.optionsJson ? (
                        <span className="truncate max-w-[200px] block">Opciones: {field.optionsJson}</span>
                      ) : (
                        field.defaultValue || '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(field)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Editar campo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(field)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Eliminar campo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {editingFieldId ? 'Modificar Campo Personalizado' : 'Nuevo Campo Personalizado'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Entidad Asociada
                  </label>
                  <select
                    disabled={Boolean(editingFieldId)}
                    value={formData.entityType}
                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-medium disabled:opacity-60"
                  >
                    {ENTITY_TYPES.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Etiqueta Visible (Label) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Número de Licencia, Nivel VIP, etc."
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                {!editingFieldId && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Identificador Interno (Key)
                    </label>
                    <input
                      type="text"
                      placeholder="Dejar en blanco para autogenerar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Tipo de Dato *
                  </label>
                  <select
                    value={formData.fieldType}
                    onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-medium"
                  >
                    {FIELD_TYPES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.fieldType === 'SELECT' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Opciones Separadas por Comas
                    </label>
                    <input
                      type="text"
                      placeholder="Opción 1, Opción 2, Opción 3"
                      value={formData.optionsText}
                      onChange={(e) => setFormData({ ...formData, optionsText: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Valor por Defecto
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={formData.defaultValue}
                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isRequiredCheckbox"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                  />
                  <label htmlFor="isRequiredCheckbox" className="text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                    Campo obligatorio al crear registros
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center space-x-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Campo'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
