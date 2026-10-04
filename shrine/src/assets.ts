const base = import.meta.env.BASE_URL;
export const assets = {
  shrine: `${base}environment/shrine.png`,
  heroes: `${base}characters/heroes.png`,
  voice: (id: string) => `${base}audio/${id}.wav`,
};
export const frames = { pawn: 0, knight: 1, bishop: 2, rook: 3, queen: 4, king: 5 } as const;
