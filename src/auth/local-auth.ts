import type { IAuthProvider, AuthUser } from './types'

/**
 * Local authentication provider for development and demo use.
 * For production, switch to LDAP auth by setting VITE_AUTH_MODE=ldap
 * and configuring the LDAP provider in AuthContext.tsx.
 */
const USERS: Record<string, { password: string; user: AuthUser }> = {
  Jim: {
    password: '3101',
    user: { username: 'Jim', displayName: 'Jim', role: 'analyst' },
  },
  Admin: {
    password: '0000',
    user: { username: 'Admin', displayName: 'Admin User', role: 'admin' },
  },
}

export class LocalAuthProvider implements IAuthProvider {
  async login(username: string, password: string): Promise<AuthUser | null> {
    const entry = USERS[username]
    if (entry && entry.password === password) {
      return entry.user
    }
    return null
  }

  logout(): void {
    // no-op for local auth
  }
}
