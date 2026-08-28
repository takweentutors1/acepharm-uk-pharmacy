import type { Context, Next } from 'hono';
import type { AuthContext } from './auth';

export type UserRole =
  | 'student'
  | 'author'
  | 'clinical_reviewer'
  | 'educational_reviewer'
  | 'copy_editor'
  | 'content_lead'
  | 'support_agent'
  | 'finance_admin'
  | 'marketing_editor'
  | 'super_admin';

export const ADMIN_ROLES: UserRole[] = [
  'author',
  'clinical_reviewer',
  'educational_reviewer',
  'copy_editor',
  'content_lead',
  'support_agent',
  'finance_admin',
  'marketing_editor',
  'super_admin',
];

/**
 * Enforces that the authenticated user possesses one of the required roles.
 * Returns HTTP 403 if the user is unprivileged.
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async function rbacMiddleware(c: Context<AuthContext>, next: Next) {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized: Authentication required' }, 401);
    }

    const userRole = user.role as UserRole;

    // super_admin always bypasses role checks
    if (userRole === 'super_admin') {
      await next();
      return;
    }

    if (!roles.includes(userRole)) {
      return c.json(
        {
          error: 'Forbidden: Insufficient privileges for this resource',
          requiredRoles: roles,
          currentRole: userRole,
        },
        403
      );
    }

    await next();
  };
}

/**
 * Convenience middleware for routes under /admin requiring any internal clinical/administrative role.
 */
export const requireAdmin = requireRole(ADMIN_ROLES);
