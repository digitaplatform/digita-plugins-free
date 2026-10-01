// Lists the paths at which two designs carry different values, so a failure
// names each token that drifted instead of one opaque inequality.
export function tokenDisagreements(a, b, path = '') {
  if (Object.is(a, b)) return [];
  const bothObjects = a !== null && b !== null && typeof a === 'object' && typeof b === 'object';
  if (!bothObjects) return [path || '(root)'];
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  return keys.flatMap((k) => tokenDisagreements(a[k], b[k], path ? `${path}.${k}` : k));
}
