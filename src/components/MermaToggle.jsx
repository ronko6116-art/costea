const OPCIONES = [
  { value: '0', label: 'Sin merma' },
  { value: '20', label: 'Merma 20%' },
  { value: '40', label: 'Merma 40%' },
];

export default function MermaToggle({ value, onChange, size = 'sm' }) {
  const actual = OPCIONES.find(o => o.value === String(value)) || OPCIONES[0];
  const sizeClass = size === 'xs' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-xs';

  function handleClick() {
    const idx = OPCIONES.findIndex(o => o.value === String(value));
    const next = OPCIONES[(idx + 1) % OPCIONES.length];
    onChange(next.value);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-lg font-medium border transition-colors whitespace-nowrap ${
        actual.value === '0'
          ? 'bg-white text-ink-soft border-warm-gray/30 hover:border-orange-300'
          : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
      } ${sizeClass}`}
    >
      {actual.label}
    </button>
  );
}
