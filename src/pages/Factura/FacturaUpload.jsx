import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Camera, FileUp, Loader2, X, Scan, ChevronDown, Store } from 'lucide-react';

const JSON_EJEMPLO = `{
  "fecha_factura": "15/06/2026",
  "importe_total": 187.40,
  "lineas": [
    {
      "nombre_producto": "Atún rojo lomo",
      "cantidad": 8,
      "unidad_medida": "kg",
      "precio_unitario": 22.40,
      "importe_linea": 179.20
    },
    {
      "nombre_producto": "Limón",
      "cantidad": 2,
      "unidad_medida": "kg",
      "precio_unitario": 1.80,
      "importe_linea": 3.60
    }
  ]
}`;

export default function FacturaUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [jsonTexto, setJsonTexto] = useState('');
  const [mostrarEjemplo, setMostrarEjemplo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extrayendoOcr, setExtrayendoOcr] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposValidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!tiposValidos.includes(file.type)) {
      setError('Formato no soportado. Usa una foto (JPG/PNG) o un PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máximo 10MB).');
      return;
    }

    setError(null);
    setArchivo(file);
    setPreview(file.type !== 'application/pdf' ? URL.createObjectURL(file) : null);
  };

  const handleQuitarArchivo = () => {
    setArchivo(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validarJson = (texto) => {
    let parsed;
    try {
      parsed = JSON.parse(texto);
    } catch {
      throw new Error('El JSON no es válido. Revisa que esté bien formado.');
    }
    if (!Array.isArray(parsed.lineas) || parsed.lineas.length === 0) {
      throw new Error('El JSON debe incluir al menos una línea en "lineas".');
    }
    return { ...parsed, proveedor_nombre: proveedorNombre || parsed.proveedor_nombre };
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleExtraerOcr = async () => {
    setError(null);
    setExtrayendoOcr(true);

    try {
      const base64 = await toBase64(archivo);

      const res = await fetch('/api/extraer-factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          fileName: archivo.name,
          fileType: archivo.type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error del servidor (${res.status})`);
      }

      setJsonTexto(JSON.stringify(data.datos_extraidos, null, 2));
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('502') || msg.includes('503')) {
        setError('El servicio de OCR no está disponible. Asegúrate de haber desplegado la API en Vercel o ejecuta `vercel dev` para desarrollo local. Puedes pegar el JSON manualmente.');
      } else {
        setError(msg || 'No se pudieron extraer los datos. Puedes pegar el JSON manualmente.');
      }
    } finally {
      setExtrayendoOcr(false);
    }
  };

  const handleProcesar = async () => {
    setError(null);

    if (!proveedorNombre.trim()) {
      setError('Introduce el nombre del proveedor.');
      return;
    }

    let datosExtraidos;
    try {
      datosExtraidos = validarJson(jsonTexto);
    } catch (err) {
      setError(err.message);
      return;
    }

    setUploading(true);

    try {
      const { data: restaurante, error: restError } = await supabase
        .from('restaurantes')
        .select('id')
        .limit(1)
        .single();
      if (restError) throw new Error('No se encontró tu restaurante.');

      let archivoUrl = null;
      if (archivo) {
        const extension = archivo.name.split('.').pop();
        const ruta = `${restaurante.id}/${Date.now()}.${extension}`;
        const { error: storageError } = await supabase.storage
          .from('facturas')
          .upload(ruta, archivo, { contentType: archivo.type });
        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage.from('facturas').getPublicUrl(ruta);
        archivoUrl = urlData.publicUrl;
      }

      const datosCompletos = {
        ...datosExtraidos,
        proveedor_nombre: proveedorNombre.trim(),
        confianza_global: 'alta',
        notas_ocr: null,
      };

      const { data: factura, error: facturaError } = await supabase
        .from('facturas')
        .insert([{
          restaurante_id: restaurante.id,
          archivo_url: archivoUrl,
          estado: 'pendiente',
          fecha_factura: datosCompletos.fecha_factura || null,
          importe_total: datosCompletos.importe_total || null,
          datos_extraidos: datosCompletos,
        }])
        .select('id')
        .single();
      if (facturaError) throw facturaError;

      navigate(`/facturas/${factura.id}/revision`);

    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar la factura.');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-8">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/facturas')}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Subir factura</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ===== Paso 1: Archivo ===== */}
        <div>
          <p className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-2">
            1. Archivo del albarán / factura
            <span className="ml-1 font-normal normal-case text-warm-gray">(necesario para OCR)</span>
          </p>

          {!archivo ? (
            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3 bg-terracotta text-white rounded-xl py-4 font-semibold cursor-pointer hover:bg-terracotta-dark transition-colors">
                  <Camera className="h-5 w-5" />
                  Hacer foto
                </div>
              </label>

              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3 bg-white border-2 border-dashed border-warm-gray/30 text-ink-soft rounded-xl py-4 font-medium cursor-pointer hover:border-terracotta hover:text-terracotta transition-colors">
                  <FileUp className="h-5 w-5" />
                  Subir desde el dispositivo
                </div>
              </label>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-warm-gray/10 p-3 shadow-sm relative">
              <button
                onClick={handleQuitarArchivo}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md text-ink-soft hover:text-red-500 transition-colors"
                aria-label="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
              {preview ? (
                <img src={preview} alt="Vista previa" className="w-full rounded-lg max-h-64 object-contain" />
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <FileUp className="h-7 w-7 text-terracotta" />
                  <span className="text-ink font-medium truncate text-sm">{archivo.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Paso 2: Proveedor ===== */}
        <div>
          <p className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-2">
            2. Proveedor
          </p>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray" />
            <input
              type="text"
              value={proveedorNombre}
              onChange={(e) => setProveedorNombre(e.target.value)}
              placeholder="Ej: Mercados García, Pescados Martínez..."
              className="w-full rounded-lg border border-warm-gray/30 pl-10 pr-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition text-sm"
            />
          </div>
        </div>

        {/* ===== Botón OCR (solo si hay archivo) ===== */}
        {archivo && (
          <button
            onClick={handleExtraerOcr}
            disabled={extrayendoOcr}
            className="w-full flex items-center justify-center gap-2 bg-olive text-white rounded-full py-3.5 font-semibold disabled:opacity-60 transition-colors hover:bg-olive-dark"
          >
            {extrayendoOcr ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Extrayendo datos con OCR...
              </>
            ) : (
              <>
                <Scan className="h-5 w-5" />
                Extraer datos con OCR
              </>
            )}
          </button>
        )}

        {/* ===== Paso 3: Datos extraídos (JSON) ===== */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-warm-gray uppercase tracking-wide">
              3. Datos extraídos
            </p>
            <button
              type="button"
              onClick={() => {
                setJsonTexto(JSON_EJEMPLO);
                setMostrarEjemplo(false);
              }}
              className="text-xs font-medium text-olive-dark hover:underline"
            >
              Usar ejemplo
            </button>
          </div>

          <textarea
            value={jsonTexto}
            onChange={(e) => setJsonTexto(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-lg border border-warm-gray/30 px-3 py-2.5 text-xs font-mono bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition resize-none"
            placeholder="Los datos extraídos aparecerán aquí automáticamente. También puedes pegar o editar el JSON manualmente..."
          />

          <button
            type="button"
            onClick={() => setMostrarEjemplo(!mostrarEjemplo)}
            className="mt-1.5 flex items-center gap-1 text-xs text-warm-gray hover:text-ink"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mostrarEjemplo ? 'rotate-180' : ''}`} />
            Ver formato esperado
          </button>

          {mostrarEjemplo && (
            <pre className="mt-2 bg-ink/5 rounded-lg p-3 text-[11px] font-mono text-ink-soft overflow-x-auto">
              {JSON_EJEMPLO}
            </pre>
          )}
        </div>

        <button
          onClick={handleProcesar}
          disabled={uploading || !jsonTexto.trim() || !proveedorNombre.trim()}
          className="w-full flex items-center justify-center gap-2 bg-terracotta text-white rounded-full py-3.5 font-semibold disabled:opacity-50 transition-colors hover:bg-terracotta-dark"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando...
            </>
          ) : (
            'Continuar a revisión'
          )}
        </button>
      </main>
    </div>
  );
}
