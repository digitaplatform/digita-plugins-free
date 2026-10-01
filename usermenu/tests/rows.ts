import type { UserMenuRow } from '../src/UserMenuNav';

// Two trees: one for the Sales role and the master tree. Each carries one
// inactive row next to its active siblings.
export const ROWS: UserMenuRow[] = [
  { _id: 'root-sales', kind: 'tree_root', label: 'Sales', priority: 10, roles: [{ role: 'Sales' }] },
  { _id: 'root-sales-old', kind: 'tree_root', label: 'Old sales', priority: 1, roles: [{ role: 'Sales' }], is_active: false },
  { _id: 'root-master', kind: 'tree_root', label: 'Master', is_master: true },

  { _id: 'g-selling', kind: 'group', label: 'Selling', tree_root: 'root-sales', parent: 'root-sales', position: 1 },
  { _id: 'e-customer', kind: 'entity', label: 'Customers', tree_root: 'root-sales', parent: 'g-selling', position: 1, target_entity: 'Customer' },
  { _id: 'e-order', kind: 'entity', label: 'Orders', tree_root: 'root-sales', parent: 'g-selling', position: 2, target_entity: 'SalesOrder', filter_json: { status: 'Open' } },
  { _id: 'e-quote', kind: 'entity', label: 'Quotes', tree_root: 'root-sales', parent: 'g-selling', position: 3, target_entity: 'Quotation', is_active: false },
  { _id: 'u-reports', kind: 'url', label: 'Reports', tree_root: 'root-sales', parent: 'root-sales', position: 2, target_url: '/reports' },

  { _id: 'old-leaf', kind: 'entity', label: 'Old leaf', tree_root: 'root-sales-old', parent: 'root-sales-old', target_entity: 'Legacy' },

  { _id: 'g-admin', kind: 'group', label: 'Admin', tree_root: 'root-master', parent: 'root-master', position: 1 },
  { _id: 'e-user', kind: 'entity', label: 'Users', tree_root: 'root-master', parent: 'g-admin', position: 1, target_entity: 'User' },
];
