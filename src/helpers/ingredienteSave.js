import { supabase } from '../supabaseClient';

export async function asegurarProveedor(proveedorId, nuevoNombre, restauranteId, setProveedores) {
  if (proveedorId !== '__nuevo__' || !nuevoNombre?.trim()) {
    return proveedorId;
  }

  const { data: newProv, error: provError } = await supabase
    .from('proveedores')
    .insert([{ restaurante_id: restauranteId, nombre: nuevoNombre.trim() }])
    .select()
    .single();

  if (provError) throw provError;
  setProveedores(prev => [...prev, { id: newProv.id, nombre: newProv.nombre }]);
  return newProv.id;
}

export async function guardarCompraPasada(id, precioNum, fechaCompra, restauranteId) {
  const { data: ingActual } = await supabase
    .from('ingredientes')
    .select('precio_actual, restaurante_id, proveedor_habitual_id')
    .eq('id', id)
    .single();

  await supabase.from('precios_historicos').insert({
    ingrediente_id: id,
    precio: precioNum,
    fecha: fechaCompra,
    precio_anterior: ingActual?.precio_actual || 0,
    precio_nuevo: precioNum,
    restaurante_id: ingActual?.restaurante_id || restauranteId,
    proveedor_id: ingActual?.proveedor_habitual_id || null,
    creado_en: new Date().toISOString(),
  });
}

export async function guardarIngrediente(id, dataToSave) {
  if (id) {
    return supabase.from('ingredientes').update(dataToSave).eq('id', id);
  }
  dataToSave.created_at = new Date().toISOString();
  return supabase.from('ingredientes').insert([dataToSave]);
}
