import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit3, X, Check } from 'lucide-react';
import { formatearMoneda } from '../../functions/formatters';
import { fechaKey } from '../../helpers/precios';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_HEADERS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function HistoricoCompras() {
  const navigate = useNavigate();
  const { restauranteId } = useRestaurant();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ precio: '', fecha: '', proveedor_id: '' });
  const [saving, setSaving] = useState(false);
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    if (!restauranteId) return;

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    setLoading(true);

    supabase
      .from('precios_historicos')
      .select('*, ingrediente:ingredientes(nombre, unidad_medida), proveedor:proveedores(nombre)')
      .eq('restaurante_id', restauranteId)
      .gte('fecha', startStr)
      .lte('fecha', endStr)
      .order('fecha', { ascending: false })
      .then(({ data }) => {
        if (data) setPurchases(data);
        setLoading(false);
      });

    supabase
      .from('proveedores')
      .select('id, nombre')
      .eq('restaurante_id', restauranteId)
      .order('nombre')
      .then(({ data }) => {
        if (data) setProveedores(data);
      });
  }, [restauranteId, currentMonth, currentYear]);

  const purchaseDates = new Set(purchases.map(p => fechaKey(p.fecha)));

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, otherMonth: true, key: `prev-${i}` });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const dateStr = fechaKey(date);
    const isToday = dateStr === fechaKey(today);
    calendarDays.push({
      day: i,
      otherMonth: false,
      date: dateStr,
      hasPurchases: purchaseDates.has(dateStr),
      isToday,
      key: dateStr,
    });
  }

  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, otherMonth: true, key: `next-${i}` });
  }

  const selectedPurchases = selectedDate
    ? purchases.filter(p => fechaKey(p.fecha) === selectedDate)
    : [];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDate(null);
  };

  const handleDayClick = (day) => {
    if (day.otherMonth) return;
    setSelectedDate(prev => prev === day.date ? null : day.date);
    setEditingId(null);
  };

  const openEdit = (purchase) => {
    setEditingId(purchase.id);
    setEditForm({
      precio: String(purchase.precio ?? ''),
      fecha: purchase.fecha ? fechaKey(purchase.fecha) : '',
      proveedor_id: purchase.proveedor_id || '',
    });
  };

  const closeEdit = () => {
    setEditingId(null);
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    setSaving(true);

    const precioNum = parseFloat(editForm.precio);
    if (isNaN(precioNum) || !editForm.fecha) {
      setSaving(false);
      return;
    }

    const payload = {
      precio: precioNum,
      fecha: editForm.fecha,
      proveedor_id: editForm.proveedor_id || null,
    };

    const { error } = await supabase
      .from('precios_historicos')
      .update(payload)
      .eq('id', editingId);

    if (!error) {
      setPurchases(prev =>
        prev.map(p => p.id === editingId ? { ...p, ...payload, proveedor: proveedores.find(pr => pr.id === payload.proveedor_id) || null } : p)
      );
      setEditingId(null);
    }
    setSaving(false);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-cream pb-8">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/ingredientes')}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Histórico de compras</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-warm-gray/10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-warm-gray/10">
            <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-warm-gray/10 text-ink transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold text-ink text-base">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-warm-gray/10 text-ink transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-warm-gray py-1">{d}</div>
              ))}
            </div>

            {loading ? (
              <div className="text-center text-sm text-warm-gray py-8">Cargando...</div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map(d => {
                  const isSelected = !d.otherMonth && d.date === selectedDate;
                  return (
                    <button
                      key={d.key}
                      onClick={() => handleDayClick(d)}
                      className={`relative flex items-center justify-center h-10 w-full rounded-lg text-sm transition-colors
                        ${d.otherMonth ? 'text-warm-gray/30 cursor-default' : 'text-ink cursor-pointer hover:bg-olive/10'}
                        ${isSelected ? 'bg-olive text-white font-bold hover:bg-olive-dark' : ''}
                        ${!d.otherMonth && !isSelected && d.isToday ? 'ring-2 ring-olive/40 font-semibold' : ''}
                      `}
                    >
                      {d.day}
                      {!d.otherMonth && d.hasPurchases && (
                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-terracotta'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {selectedDate && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-ink capitalize mb-3">
              {formatDateLabel(selectedDate)}
            </h3>

            {selectedPurchases.length === 0 ? (
              <p className="text-sm text-warm-gray">Sin compras este día</p>
            ) : (
              <div className="space-y-2">
                {selectedPurchases.map(p => {
                  const isEditing = editingId === p.id;
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-warm-gray/10 shadow-sm p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-warm-gray mb-1">Ingrediente</p>
                            <p className="font-medium text-ink text-sm">{p.ingrediente?.nombre}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-warm-gray block mb-1">Precio (€)</label>
                              <input type="number" step="0.01" min="0" value={editForm.precio}
                                onChange={e => setEditForm(f => ({ ...f, precio: e.target.value }))}
                                className="w-full rounded-lg border border-warm-gray/20 px-3 py-2 text-sm focus:border-olive focus:ring-2 focus:ring-olive/20 outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-warm-gray block mb-1">Fecha</label>
                              <input type="date" value={editForm.fecha}
                                onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))}
                                className="w-full rounded-lg border border-warm-gray/20 px-3 py-2 text-sm focus:border-olive focus:ring-2 focus:ring-olive/20 outline-none transition"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-warm-gray block mb-1">Proveedor</label>
                            <select value={editForm.proveedor_id}
                              onChange={e => setEditForm(f => ({ ...f, proveedor_id: e.target.value }))}
                              className="w-full rounded-lg border border-warm-gray/20 px-3 py-2 text-sm focus:border-olive focus:ring-2 focus:ring-olive/20 outline-none transition"
                            >
                              <option value="">Sin proveedor</option>
                              {proveedores.map(pr => (
                                <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button onClick={closeEdit}
                              className="px-4 py-2 rounded-full border border-warm-gray/20 text-sm text-ink-soft hover:bg-warm-gray/5 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button onClick={handleEditSave} disabled={saving}
                              className="px-4 py-2 rounded-full bg-olive text-white text-sm font-semibold hover:bg-olive-dark transition-colors disabled:opacity-50"
                            >
                              {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ink text-sm truncate">{p.ingrediente?.nombre}</p>
                            <div className="flex flex-wrap gap-x-2 text-xs text-warm-gray">
                              <span>{formatearMoneda(p.precio)}</span>
                              {p.ingrediente?.unidad_medida && <span>/ {p.ingrediente.unidad_medida}</span>}
                              {p.proveedor && <span>· {p.proveedor.nombre}</span>}
                            </div>
                          </div>
                          <button onClick={() => openEdit(p)}
                            className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors shrink-0"
                            title="Editar compra"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
