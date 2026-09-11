// Escape user input before embedding it in a RegExp or MongoDB $regex.
// Without this, inputs like ".*" or "(a+)+$" enable regex injection / ReDoS.
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
