import { describe, it, expect } from 'vitest';
import { fechaKey, deduplicarPorFecha, mapearPuntos } from './precios';

describe('fechaKey', () => {
  it('convierte Date object a YYYY-MM-DD', () => {
    expect(fechaKey(new Date('2026-07-05'))).toBe('2026-07-05');
  });

  it('convierte string ISO a YYYY-MM-DD', () => {
    expect(fechaKey('2026-07-05T12:00:00Z')).toBe('2026-07-05');
  });

  it('convierte string YYYY-MM-DD a YYYY-MM-DD', () => {
    expect(fechaKey('2026-07-05')).toBe('2026-07-05');
  });

  it('devuelve string vacío para null', () => {
    expect(fechaKey(null)).toBe('');
  });

  it('devuelve string vacío para undefined', () => {
    expect(fechaKey(undefined)).toBe('');
  });
});

describe('deduplicarPorFecha', () => {
  const base = {
    fecha: new Date('2026-07-05'),
    proveedor_id: 'prov-a',
    creado_en: '2026-07-05T10:00:00Z',
    precio: 18,
  };

  it('devuelve array vacio para entrada vacia', () => {
    expect(deduplicarPorFecha([])).toEqual([]);
  });

  it('mantiene un unico elemento', () => {
    const result = deduplicarPorFecha([base]);
    expect(result).toHaveLength(1);
    expect(result[0].precio).toBe(18);
  });

  it('deduplica misma fecha y proveedor (guarda ultimo creado_en)', () => {
    const items = [
      { ...base, creado_en: '2026-07-05T08:00:00Z', precio: 18 },
      { ...base, creado_en: '2026-07-05T10:00:00Z', precio: 20 },
    ];
    const result = deduplicarPorFecha(items);
    expect(result).toHaveLength(1);
    expect(result[0].precio).toBe(20);
  });

  it('mantiene ambos si diferente proveedor aunque misma fecha', () => {
    const items = [
      { ...base, proveedor_id: 'prov-a', precio: 18 },
      { ...base, proveedor_id: 'prov-b', precio: 22 },
    ];
    const result = deduplicarPorFecha(items);
    expect(result).toHaveLength(2);
  });

  it('mantiene ambos si diferente fecha aunque mismo proveedor', () => {
    const items = [
      { ...base, fecha: new Date('2026-07-05'), precio: 18 },
      { ...base, fecha: new Date('2026-07-06'), precio: 20 },
    ];
    const result = deduplicarPorFecha(items);
    expect(result).toHaveLength(2);
  });

  it('deduplica con getKey personalizada', () => {
    const items = [
      { ingrediente_id: 'ing-1', fecha: new Date('2026-07-05'), proveedor_id: 'prov-a', creado_en: '2026-07-05T08:00:00Z', precio: 10 },
      { ingrediente_id: 'ing-1', fecha: new Date('2026-07-05'), proveedor_id: 'prov-a', creado_en: '2026-07-05T10:00:00Z', precio: 15 },
      { ingrediente_id: 'ing-2', fecha: new Date('2026-07-05'), proveedor_id: 'prov-a', creado_en: '2026-07-05T09:00:00Z', precio: 20 },
    ];
    const getKey = (h) => `${h.ingrediente_id}|${fechaKey(h.fecha)}|${h.proveedor_id || ''}`;
    const result = deduplicarPorFecha(items, getKey);
    expect(result).toHaveLength(2);
    expect(result.find(r => r.ingrediente_id === 'ing-1').precio).toBe(15);
    expect(result.find(r => r.ingrediente_id === 'ing-2').precio).toBe(20);
  });

  it('ordena por fecha ascendente', () => {
    const items = [
      { ...base, fecha: new Date('2026-07-06'), precio: 22 },
      { ...base, fecha: new Date('2026-07-05'), precio: 18 },
      { ...base, fecha: new Date('2026-07-07'), precio: 25 },
    ];
    const result = deduplicarPorFecha(items);
    expect(result[0].precio).toBe(18);
    expect(result[1].precio).toBe(22);
    expect(result[2].precio).toBe(25);
  });
});

describe('mapearPuntos', () => {
  it('mapea correctamente a formato del grafico', () => {
    const input = [
      { fecha: new Date('2026-07-05'), precio: 18, creado_en: '2026-07-05T10:00:00Z' },
    ];
    const result = mapearPuntos(input);
    expect(result).toHaveLength(1);
    expect(result[0].fecha).toBe('05 jul');
    expect(result[0].precio).toBe(18);
    expect(result[0].ts).toBe('2026-07-05T10:00:00Z');
  });

  it('maneja fecha como string', () => {
    const input = [
      { fecha: '2026-07-05', precio: 18, creado_en: '2026-07-05T10:00:00Z' },
    ];
    const result = mapearPuntos(input);
    expect(result[0].fecha).toBe('05 jul');
  });

  it('devuelve fecha vacia para fecha null', () => {
    const input = [
      { fecha: null, precio: 18, creado_en: '2026-07-05T10:00:00Z' },
    ];
    const result = mapearPuntos(input);
    expect(result[0].fecha).toBe('');
  });
});
