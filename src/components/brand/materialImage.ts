import credits from '@/content/imageCredits.json'

/** Real, freely licensed photo for a material name, or undefined when none fits. Credits live in /creditos. */
export function materialImage(name: string): string | undefined {
  const value = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
  const file = /hdpe/.test(value)
    ? 'plastico-hdpe'
    : /pet|plastic|botella/.test(value)
      ? 'plastico-pet'
      : /carton/.test(value)
        ? 'carton'
        : /papel/.test(value)
          ? 'papel'
          : /vidrio/.test(value)
            ? 'vidrio'
            : /aluminio|lata/.test(value)
              ? 'aluminio'
              : /metal|chatarra/.test(value)
                ? 'metal-ferroso'
                : /organ|jardin|compost|cocina/.test(value)
                  ? 'organicos'
                  : undefined
  return file ? `/materials/${file}.webp` : undefined
}

export const imageCredits = credits
