// The keys of a Design the host reads: the Design type of @digitaplatform/theme. A key outside them
// composes into nothing, so gen-design-css refuses it. A test holds the list equal to the published type.
export const DESIGN_KEYS = ['meta', 'semantic', 'categorical', 'ramps', 'radius', 'shadow', 'typography', 'motion', 'controlHeight'];

/** The keys of `design` the host does not read. */
export const unreadDesignKeys = (design) => Object.keys(design).filter((key) => !DESIGN_KEYS.includes(key));
