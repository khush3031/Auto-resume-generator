'use client';
import { RESUME_COLORS, ResumeColor, isPresetResumeColor, resolveResumeColor } from '../../src/lib/resume-colors';

interface Props {
  selected: string;           // hex value currently selected
  onChange: (color: ResumeColor) => void;
}

export function ColorPicker({ selected, onChange }: Props) {
  const resolvedSelected = resolveResumeColor(selected) ?? RESUME_COLORS[0];
  const isPresetSelected = isPresetResumeColor(resolvedSelected.hex);

  return (
    <div className="color-picker">
      <span className="color-picker__label">Theme Color</span>
      <div className="color-picker__swatches">
        {RESUME_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => onChange(color)}
            className={`color-swatch${selected === color.hex ? ' color-swatch--active' : ''}`}
            style={{ background: color.hex }}
            title={color.label}
            aria-label={`${color.label}${selected === color.hex ? ' (selected)' : ''}`}
          >
            {selected === color.hex && (
              <svg
                className="color-swatch__check"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
        <label
          className={`color-swatch color-swatch--custom${!isPresetSelected ? ' color-swatch--active' : ''}`}
          style={!isPresetSelected ? { background: resolvedSelected.hex } : undefined}
          title={isPresetSelected ? 'Custom color' : `Custom (${resolvedSelected.hex})`}
          aria-label={isPresetSelected ? 'Custom color' : `Custom color ${resolvedSelected.hex} (selected)`}
        >
          <input
            type="color"
            value={resolvedSelected.hex}
            onChange={(event) => {
              const color = resolveResumeColor(event.target.value);
              if (color) onChange(color);
            }}
            className="color-swatch__input"
          />
          {!isPresetSelected ? (
            <svg
              className="color-swatch__check"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className="color-swatch__plus"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </label>
      </div>
    </div>
  );
}
