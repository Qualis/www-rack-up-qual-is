export function setCountFrom(sets: string): number {
  const parsed = Number.parseInt(sets, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export function setIndexesFor(sets: string): number[] {
  return Array.from({ length: setCountFrom(sets) }, (_, index) => index);
}
