import { regionLabel } from '../../shared/content.js';

const NEXT = { 0: 3, 3: 6, 6: 8, 8: 0 };
const WORD = { 3: 'Stiff', 6: 'Sore', 8: 'Painful' };

// Front view: the person faces you, so their right side is on your left.
const FRONT = [
  ['neck', 'rect', { x: 90, y: 56, width: 20, height: 16, rx: 6 }],
  ['right_shoulder', 'ellipse', { cx: 62, cy: 86, rx: 17, ry: 14 }],
  ['left_shoulder', 'ellipse', { cx: 138, cy: 86, rx: 17, ry: 14 }],
  ['right_elbow', 'rect', { x: 36, y: 122, width: 19, height: 78, rx: 9.5 }],
  ['left_elbow', 'rect', { x: 145, y: 122, width: 19, height: 78, rx: 9.5 }],
  ['right_hip', 'ellipse', { cx: 77, cy: 186, rx: 9, ry: 15 }],
  ['left_hip', 'ellipse', { cx: 123, cy: 186, rx: 9, ry: 15 }],
  ['right_groin', 'path', { d: 'M88 182 L99 182 L99 210 L92 206 Z' }],
  ['left_groin', 'path', { d: 'M101 182 L112 182 L108 206 L101 210 Z' }],
  ['right_quad', 'rect', { x: 72, y: 212, width: 26, height: 66, rx: 12 }],
  ['left_quad', 'rect', { x: 102, y: 212, width: 26, height: 66, rx: 12 }],
  ['right_knee', 'circle', { cx: 85, cy: 292, r: 13 }],
  ['left_knee', 'circle', { cx: 115, cy: 292, r: 13 }],
  ['right_calf', 'rect', { x: 75, y: 308, width: 21, height: 60, rx: 10 }],
  ['left_calf', 'rect', { x: 104, y: 308, width: 21, height: 60, rx: 10 }],
  ['right_ankle', 'ellipse', { cx: 85, cy: 384, rx: 13, ry: 9 }],
  ['left_ankle', 'ellipse', { cx: 115, cy: 384, rx: 13, ry: 9 }],
];

// Back view: the person faces away, so their left side is on your left.
const BACK = [
  ['neck', 'rect', { x: 90, y: 56, width: 20, height: 16, rx: 6 }],
  ['left_shoulder', 'ellipse', { cx: 62, cy: 86, rx: 17, ry: 14 }],
  ['right_shoulder', 'ellipse', { cx: 138, cy: 86, rx: 17, ry: 14 }],
  ['upper_back', 'rect', { x: 78, y: 78, width: 44, height: 52, rx: 12 }],
  ['lower_back', 'rect', { x: 80, y: 134, width: 40, height: 40, rx: 10 }],
  ['left_elbow', 'rect', { x: 36, y: 122, width: 19, height: 78, rx: 9.5 }],
  ['right_elbow', 'rect', { x: 145, y: 122, width: 19, height: 78, rx: 9.5 }],
  ['left_hip', 'ellipse', { cx: 86, cy: 194, rx: 15, ry: 15 }],
  ['right_hip', 'ellipse', { cx: 114, cy: 194, rx: 15, ry: 15 }],
  ['left_hamstring', 'rect', { x: 72, y: 214, width: 26, height: 64, rx: 12 }],
  ['right_hamstring', 'rect', { x: 102, y: 214, width: 26, height: 64, rx: 12 }],
  ['left_knee', 'circle', { cx: 85, cy: 292, r: 13 }],
  ['right_knee', 'circle', { cx: 115, cy: 292, r: 13 }],
  ['left_calf', 'rect', { x: 75, y: 308, width: 21, height: 60, rx: 10 }],
  ['right_calf', 'rect', { x: 104, y: 308, width: 21, height: 60, rx: 10 }],
  ['left_ankle', 'ellipse', { cx: 85, cy: 384, rx: 13, ry: 9 }],
  ['right_ankle', 'ellipse', { cx: 115, cy: 384, rx: 13, ry: 9 }],
];

function Silhouette() {
  // Neutral body underneath the tappable regions.
  return (
    <g>
      <circle className="base" cx="100" cy="32" r="22" />
      <rect className="base" x="68" y="72" width="64" height="112" rx="22" />
      <rect className="base" x="70" y="176" width="60" height="36" rx="14" />
      <rect className="base" x="36" y="96" width="20" height="40" rx="10" />
      <rect className="base" x="144" y="96" width="20" height="40" rx="10" />
      <circle className="base" cx="45" cy="210" r="9" />
      <circle className="base" cx="155" cy="210" r="9" />
    </g>
  );
}

function Figure({ parts, label, leftMark, rightMark, value, onTap }) {
  return (
    <svg className="body-svg" viewBox="0 0 200 420" role="group" aria-label={`${label} of body`}>
      <Silhouette />
      {parts.map(([id, Tag, attrs]) => {
        const lvl = value[id] || 0;
        return (
          <Tag key={id} {...attrs} className={`part${lvl ? ` l${lvl}` : ''}`} tabIndex={0} role="button"
            aria-label={`${regionLabel(id)}: ${lvl ? WORD[lvl] : 'fine'}`}
            onClick={() => onTap(id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(id); } }} />
        );
      })}
      <text x="100" y="414" textAnchor="middle">{label}</text>
      <text x="22" y="414" textAnchor="middle">{leftMark}</text>
      <text x="178" y="414" textAnchor="middle">{rightMark}</text>
    </svg>
  );
}

export default function BodyMap({ value, onChange }) {
  const tap = (id) => onChange({ ...value, [id]: NEXT[value[id] || 0] });
  const selected = Object.entries(value).filter(([, l]) => l > 0);
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="body-wrap">
        <Figure parts={FRONT} label="FRONT" leftMark="R" rightMark="L" value={value} onTap={tap} />
        <Figure parts={BACK} label="BACK" leftMark="L" rightMark="R" value={value} onTap={tap} />
      </div>
      <div className="legend">
        <span><i style={{ background: 'color-mix(in srgb, var(--easy) 45%, var(--surface-2))' }} /> 1 tap · stiff</span>
        <span><i style={{ background: 'color-mix(in srgb, var(--stop) 55%, var(--easy))' }} /> 2 taps · sore</span>
        <span><i style={{ background: 'var(--stop)' }} /> 3 taps · painful</span>
      </div>
      {selected.length > 0 && (
        <div className="chips">
          {selected.map(([id, l]) => (
            <button key={id} className="chip" style={{ border: 0, cursor: 'pointer' }} onClick={() => onChange({ ...value, [id]: 0 })} aria-label={`Clear ${regionLabel(id)}`}>
              <span className={`dot ${l >= 8 ? 'red' : l >= 6 ? 'yellow' : ''}`} style={l === 3 ? { background: 'var(--easy)', opacity: 0.6 } : undefined} />
              {regionLabel(id)} · {WORD[l]} ✕
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
