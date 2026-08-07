export const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  SCHOOL_ADMIN: 'school_admin',
  SUPER_ADMIN: 'super_admin',
});

/**
 * @param {string} role
 * @param {string[]} allowedRoles
 */
export function hasRole(role, allowedRoles = []) {
  return allowedRoles.includes(role);
}

/**
 * Role hierarchy for coarse checks (higher index = more privilege).
 */
const ROLE_RANK = Object.freeze({
  [ROLES.STUDENT]: 1,
  [ROLES.PARENT]: 2,
  [ROLES.TEACHER]: 3,
  [ROLES.SCHOOL_ADMIN]: 4,
  [ROLES.SUPER_ADMIN]: 5,
});

export function hasAtLeastRole(role, minimumRole) {
  return (ROLE_RANK[role] || 0) >= (ROLE_RANK[minimumRole] || Infinity);
}
