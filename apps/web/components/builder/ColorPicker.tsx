'use client';
import { RESUME_COLORS, ResumeColor } from '../../src/lib/resume-colors';

interface Props {
  selected: string;           // hex value currently selected
  onChange: (color: ResumeColor) => void;
}

export function ColorPicker({ selected, onChange }: Props) {
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
      </div>
    </div>
  );
}
