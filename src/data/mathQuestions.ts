export type OpKind = 'add' | 'sub' | 'mul' | 'div' | 'mixed';

export interface MathQuestion {
  prompt: string;
  answer: number;
  choices: number[];
  difficulty: number;
  op: OpKind;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueChoices(correct: number, gen: () => number): number[] {
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < 4 && guard++ < 40) {
    const n = gen();
    if (n !== correct && n >= 0) set.add(n);
  }
  while (set.size < 4) set.add(correct + set.size + 1);
  return shuffle([...set]);
}

export function generateQuestion(level: number, prefer?: OpKind): MathQuestion {
  const difficulty = Math.min(5, Math.max(1, Math.ceil(level / 2)));
  const ops: OpKind[] =
    level < 3 ? ['add', 'sub'] : level < 5 ? ['add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div'];
  const op = prefer && ops.includes(prefer) ? prefer : ops[Math.floor(Math.random() * ops.length)];

  let a = 0;
  let b = 0;
  let answer = 0;
  let prompt = '';

  switch (op) {
    case 'add': {
      a = 2 + Math.floor(Math.random() * (8 + difficulty * 6));
      b = 2 + Math.floor(Math.random() * (8 + difficulty * 6));
      answer = a + b;
      prompt = `${a} + ${b} = ?`;
      break;
    }
    case 'sub': {
      a = 5 + Math.floor(Math.random() * (10 + difficulty * 8));
      b = 1 + Math.floor(Math.random() * a);
      answer = a - b;
      prompt = `${a} − ${b} = ?`;
      break;
    }
    case 'mul': {
      a = 2 + Math.floor(Math.random() * (2 + difficulty * 2));
      b = 2 + Math.floor(Math.random() * (2 + difficulty * 2));
      answer = a * b;
      prompt = `${a} × ${b} = ?`;
      break;
    }
    case 'div': {
      b = 2 + Math.floor(Math.random() * (2 + difficulty));
      answer = 2 + Math.floor(Math.random() * (3 + difficulty * 2));
      a = b * answer;
      prompt = `${a} ÷ ${b} = ?`;
      break;
    }
    default: {
      a = 3 + Math.floor(Math.random() * 12);
      b = 2 + Math.floor(Math.random() * 10);
      answer = a + b;
      prompt = `${a} + ${b} = ?`;
    }
  }

  const choices = uniqueChoices(answer, () => {
    const delta = Math.floor(Math.random() * 8) - 3;
    return answer + (delta === 0 ? 2 : delta);
  });

  return { prompt, answer, choices, difficulty, op };
}

export function mapIdToOps(mapId: string): OpKind | undefined {
  if (mapId === 'map_sector_a') return undefined; // mixed add/sub via level
  if (mapId === 'map_nebula') return 'mul';
  if (mapId === 'map_core') return 'div';
  return undefined;
}
