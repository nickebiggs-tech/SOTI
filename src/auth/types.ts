export interface AuthUser {
  username: string
  displayName: string
  role: 'analyst' | 'admin'
}

export interface IAuthProvider {
  login(username: string, password: string): Promise<AuthUser | null>
  logout(): void
}

/**
 * Auth mode — set VITE_AUTH_MODE=ldap in .env to use LDAP authentication.
 * Default: 'local' (password-based local auth for development/demo)
 */
export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE as string) || 'local'
