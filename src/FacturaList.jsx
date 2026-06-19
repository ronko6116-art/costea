// src/FacturaList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { ArrowLeft, Plus, Clock, CheckCircle2, AlertCircle, FileSearch } from 'lucide-react';

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', icon: Clock, color: 'text-warm-gray', bg: 'bg-warm-gray/10' },
  revision_manual: { label: 'Revisar', icon: FileSearch, color: 'text-terracotta-dark', bg: 'bg-terracotta/10' },
  procesada: { label: 'Procesada', icon: CheckCircle2, color: 'text-olive-dark', bg: 'bg-olive/10' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function FacturaList() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacturas = async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('*, proveedor:proveedores(nombre)')
        .order('created_at', { ascending: false });

      if (!error) setFacturas(data);
      setLoading(false);
    };
    fetchFacturas();
  }, []);

  const formatoFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatoMoneda = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  const handleClick = (factura) => {
    // Una factura 'pendiente' (recién creada con el JSON) va directa a revisión.
    // Una ya 'procesada' por ahora es solo informativa (sin pantalla de detalle todavía).
    if (factura.estado === 'pendiente' || factura.estado === 'revision_manual') {
      navigate(`/facturas/${factura.id}/revision`);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-8">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Facturas</span>
          <button
            onClick={() => navigate('/facturas/nueva')}
            className="p-2 rounded-full bg-terracotta text-white hover:bg-terracotta-dark transition-colors"
            aria-label="Subir factura"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-20" />
            ))}
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center text-ink-soft py-12">
            <p className="mb-4">Aún no has subido ninguna factura.</p>
            <button
              onClick={() => navigate('/facturas/nueva')}
              className="bg-terracotta text-white px-6 py-3 rounded-full text-sm font-semibold"
            >
              Subir la primera
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {facturas.map((f) => {
              const config = ESTADO_CONFIG[f.estado] || ESTADO_CONFIG.pendiente;
              const Icon = config.icon;
              const esClicable = f.estado === 'pendiente' || f.estado === 'revision_manual';

              return (
                <div
                  key={f.id}
                  onClick={() => handleClick(f)}
                  className={`bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm flex items-center justify-between gap-3 ${
                    esClicable ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">
                      {f.proveedor?.nombre || 'Proveedor sin identificar'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-warm-gray mt-0.5">
                      <span>{formatoFecha(f.created_at)}</span>
                      {f.importe_total && <span>· {formatoMoneda.format(f.importe_total)}</span>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full shrink-0 ${config.color} ${config.bg}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
