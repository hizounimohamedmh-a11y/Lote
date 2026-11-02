// GreenLight content: body regions, exercises, sports, check questions.

export const SPORTS = [
  { id: 'football', label: 'Football', load: 'sprints, sharp cuts and shooting' },
  { id: 'basketball', label: 'Basketball', load: 'jumping, landing and quick changes of direction' },
  { id: 'running', label: 'Running', load: 'speed work, hills and long runs' },
  { id: 'gym', label: 'Gym / strength', load: 'heavy lifts and max-effort sets' },
  { id: 'racket', label: 'Tennis / padel', load: 'explosive lunges and overhead shots' },
  { id: 'combat', label: 'Boxing / martial arts', load: 'sparring and explosive kicks or punches' },
  { id: 'cycling', label: 'Cycling', load: 'intervals and long climbs' },
  { id: 'active', label: 'Just staying active', load: 'intense or long sessions' },
];

// Body map regions. "side" regions exist as left_/right_ pairs.
export const REGIONS = {
  neck: { label: 'Neck', sided: false },
  shoulder: { label: 'Shoulder', sided: true },
  elbow: { label: 'Elbow / wrist', sided: true },
  upper_back: { label: 'Upper back', sided: false },
  lower_back: { label: 'Lower back', sided: false },
  hip: { label: 'Hip / glute', sided: true },
  groin: { label: 'Groin', sided: true },
  quad: { label: 'Thigh (front)', sided: true },
  hamstring: { label: 'Hamstring', sided: true },
  knee: { label: 'Knee', sided: true },
  calf: { label: 'Calf / shin', sided: true },
  ankle: { label: 'Ankle / foot', sided: true },
};

export function regionLabel(id) {
  const m = id.match(/^(left|right)_(.+)$/);
  if (!m) return REGIONS[id]?.label || id;
  return `${m[1] === 'left' ? 'Left' : 'Right'} ${REGIONS[m[2]]?.label.toLowerCase() || m[2]}`;
}
export const baseRegion = (id) => id.replace(/^(left|right)_/, '');

export const SORENESS = [
  { level: 0, label: 'Fine' },
  { level: 3, label: 'A bit stiff' },
  { level: 6, label: 'Sore' },
  { level: 8, label: 'Painful' },
];

export const RED_FLAGS = [
  { id: 'sharp', q: 'Is the pain sharp or stabbing (not just a dull ache)?' },
  { id: 'swelling', q: 'Is there swelling, bruising or heat?' },
  { id: 'rest', q: 'Does it hurt when resting or wake you at night?' },
  { id: 'numb', q: 'Any numbness, tingling or weakness?' },
  { id: 'impact', q: 'Did it start with a fall, twist, pop or hit?' },
];

export const QUESTIONS = {
  sleep: { q: 'How did you sleep?', options: [{ v: 1, label: 'Badly' }, { v: 2, label: 'OK' }, { v: 3, label: 'Great' }] },
  energy: { q: 'Energy right now?', options: [{ v: 1, label: 'Empty' }, { v: 2, label: 'Low' }, { v: 3, label: 'Normal' }, { v: 4, label: 'Good' }, { v: 5, label: 'Fired up' }] },
  load: { q: 'What did you do yesterday?', options: [{ v: 0, label: 'Rest' }, { v: 1, label: 'Light' }, { v: 2, label: 'Hard session' }, { v: 3, label: 'Game / very hard' }] },
};

// Exercise library. dose is what to do; cue is the one thing to get right.
export const EXERCISES = {
  ankle_circles: { name: 'Ankle circles', dose: '10 each way, each foot', cue: 'Big slow circles, knee still.' },
  knee_to_wall: { name: 'Knee-to-wall rocks', dose: '2 × 10 each side', cue: 'Heel stays down while the knee touches the wall.' },
  calf_raises: { name: 'Slow calf raises', dose: '2 × 12', cue: 'Three seconds up, three seconds down.' },
  calf_stretch: { name: 'Wall calf stretch', dose: '2 × 30 s each side', cue: 'Back heel down, back knee straight.' },
  quad_sets: { name: 'Quad squeezes', dose: '3 × 10 (5 s holds)', cue: 'Leg straight, tighten the front of the thigh.' },
  glute_bridge: { name: 'Glute bridge', dose: '2 × 12', cue: 'Squeeze your glutes at the top, ribs down.' },
  spanish_squat: { name: 'Wall sit (pain-free depth)', dose: '3 × 30 s', cue: 'Only as deep as feels comfortable.' },
  hip_9090: { name: '90/90 hip switches', dose: '2 × 8 each side', cue: 'Sit tall, rotate from the hips.' },
  hip_flexor: { name: 'Half-kneeling hip flexor stretch', dose: '2 × 30 s each side', cue: 'Tuck your pelvis, squeeze the back glute.' },
  clamshell: { name: 'Clamshells', dose: '2 × 15 each side', cue: 'Keep hips stacked, don’t roll back.' },
  ham_floss: { name: 'Hamstring flossing', dose: '2 × 10 each side', cue: 'Gentle, no pulling into pain.' },
  ham_iso: { name: 'Hamstring bridge hold', dose: '3 × 20 s', cue: 'Heels dig into the floor, hips up.' },
  adductor_rock: { name: 'Adductor rock-backs', dose: '2 × 10 each side', cue: 'One leg out to the side, sit back slowly.' },
  copenhagen: { name: 'Short Copenhagen hold', dose: '3 × 15 s each side', cue: 'Knee on the bench, body in a straight line.' },
  cat_cow: { name: 'Cat-cow', dose: '10 slow reps', cue: 'Move one segment of the spine at a time.' },
  childs_pose: { name: 'Child’s pose breathing', dose: '5 slow breaths', cue: 'Breathe into your lower back.' },
  bird_dog: { name: 'Bird dog', dose: '2 × 8 each side', cue: 'Keep a glass of water balanced on your back.' },
  dead_bug: { name: 'Dead bug', dose: '2 × 8 each side', cue: 'Lower back pressed into the floor.' },
  thoracic_rot: { name: 'Open-book rotations', dose: '8 each side', cue: 'Follow your hand with your eyes.' },
  wall_slides: { name: 'Wall slides', dose: '2 × 10', cue: 'Forearms on the wall, slide up without shrugging.' },
  arm_circles: { name: 'Arm circles', dose: '10 forward, 10 back', cue: 'Start small, get bigger.' },
  scap_pushup: { name: 'Scapula push-ups', dose: '2 × 10', cue: 'Arms straight, only the shoulder blades move.' },
  chin_tucks: { name: 'Chin tucks', dose: '10 × 3 s holds', cue: 'Make a double chin, eyes level.' },
  neck_rot: { name: 'Slow neck turns', dose: '5 each side', cue: 'Only to where it’s comfortable.' },
  wrist_circles: { name: 'Wrist and forearm circles', dose: '10 each way', cue: 'Loose fists, slow circles.' },
  forearm_stretch: { name: 'Forearm stretch', dose: '2 × 20 s each side', cue: 'Arm straight, gently pull fingers back.' },
  quad_stretch: { name: 'Standing quad stretch', dose: '2 × 30 s each side', cue: 'Knees together, hips forward.' },
  walk: { name: 'Easy walk or bike', dose: '15–20 min', cue: 'You should be able to hold a conversation.' },
  leg_swings: { name: 'Leg swings', dose: '10 front-back, 10 side-side each leg', cue: 'Hold something for balance, swing loosely.' },
  skips: { name: 'A-skips', dose: '2 × 15 m', cue: 'Knee up, quick feet.' },
  lunges: { name: 'Walking lunges with a reach', dose: '8 each side', cue: 'Long step, reach overhead.' },
  jump_prep: { name: 'Pogo hops', dose: '2 × 15', cue: 'Stiff ankles, quiet landings.' },
  breathing: { name: 'Box breathing', dose: '4 rounds', cue: 'In 4, hold 4, out 4, hold 4.' },
};

// Per body region: what helps and what to avoid when it's sore.
export const REGION_PLAN = {
  neck: { drills: ['chin_tucks', 'neck_rot'], avoid: 'heavy overhead lifting and contact' },
  shoulder: { drills: ['wall_slides', 'scap_pushup', 'arm_circles'], avoid: 'heavy pressing, overhead shots and throwing at full power' },
  elbow: { drills: ['wrist_circles', 'forearm_stretch'], avoid: 'heavy gripping and hard hitting' },
  upper_back: { drills: ['thoracic_rot', 'cat_cow'], avoid: 'heavy rows and twisting under load' },
  lower_back: { drills: ['cat_cow', 'bird_dog', 'dead_bug', 'childs_pose'], avoid: 'heavy deadlifts, squats and long sitting' },
  hip: { drills: ['hip_9090', 'clamshell', 'glute_bridge'], avoid: 'deep loaded squats and long sprints' },
  groin: { drills: ['adductor_rock', 'copenhagen'], avoid: 'long passes, sharp side-to-side cuts and wide lunges' },
  quad: { drills: ['quad_stretch', 'quad_sets', 'leg_swings'], avoid: 'max sprints, shooting at full power and jumping' },
  hamstring: { drills: ['ham_floss', 'ham_iso', 'glute_bridge'], avoid: 'max-speed sprints and heavy hinges' },
  knee: { drills: ['quad_sets', 'spanish_squat', 'glute_bridge'], avoid: 'jumping, deep squats and sharp cuts' },
  calf: { drills: ['calf_stretch', 'calf_raises'], avoid: 'hill sprints, jumping and long runs' },
  ankle: { drills: ['ankle_circles', 'knee_to_wall', 'calf_raises'], avoid: 'jumping, sharp cuts and uneven ground' },
};

export const WARMUPS = {
  football: ['leg_swings', 'skips', 'lunges', 'adductor_rock'],
  basketball: ['leg_swings', 'jump_prep', 'lunges', 'ankle_circles'],
  running: ['leg_swings', 'skips', 'calf_raises', 'glute_bridge'],
  gym: ['cat_cow', 'glute_bridge', 'wall_slides', 'hip_9090'],
  racket: ['arm_circles', 'lunges', 'thoracic_rot', 'ankle_circles'],
  combat: ['arm_circles', 'thoracic_rot', 'leg_swings', 'neck_rot'],
  cycling: ['hip_flexor', 'cat_cow', 'leg_swings', 'glute_bridge'],
  active: ['arm_circles', 'leg_swings', 'cat_cow', 'glute_bridge'],
};

export const RECOVERY = ['walk', 'cat_cow', 'hip_9090', 'breathing'];
