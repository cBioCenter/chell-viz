const generateDefaultHeaderIndices = (items: string[]): { [key: string]: number } => ({
  A_i: items.length - 3,
  A_j: items.length - 2,
  cn: 2,
  dist: 3,
  i: 0,
  j: 1,
});

export const getCouplingHeaderIndices = (items: string[]) => {
  const result = generateDefaultHeaderIndices(items);
  Object.entries(result).map(pair => {
    result[pair[0]] = items.includes(pair[0]) ? items.indexOf(pair[0]) : pair[1];
  });
  return result;
};