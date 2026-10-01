import { describe, expect, it } from 'vitest';
import { resolveTree, type MenuNode } from '../src/UserMenuNav';
import { ROWS } from './rows';

// Reduce a tree to ids, so a test states the whole expected shape at once.
function shape(nodes: MenuNode[]): unknown[] {
  return nodes.map((n) => (n.children.length > 0 ? { [n._id]: shape(n.children) } : n._id));
}

describe('resolveTree', () => {
  it('builds the tree of the one root that matches the role', () => {
    expect(shape(resolveTree(ROWS, ['Sales']))).toEqual([
      { 'g-selling': ['e-customer', 'e-order'] },
      'u-reports',
    ]);
  });

  it('returns no nodes for a role that matches no root, but a tree for one that does', () => {
    expect(resolveTree(ROWS, ['Warehouse'])).toEqual([]);
    expect(resolveTree(ROWS, ['Warehouse', 'Sales']).map((n) => n._id)).toEqual(['g-selling', 'u-reports']);
  });

  it('skips inactive roots and inactive rows', () => {
    // root-sales-old has the better priority, so only its inactive flag keeps
    // it out; e-quote sits among active siblings.
    const ids = JSON.stringify(shape(resolveTree(ROWS, ['Sales'])));
    expect(ids).toContain('e-customer');
    expect(ids).not.toContain('old-leaf');
    expect(ids).not.toContain('e-quote');
  });
});
