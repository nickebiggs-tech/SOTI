import type { IAuthProvider, AuthUser } from './types'

/**
 * LDAP Authentication Provider
 *
 * To enable LDAP authentication:
 * 1. Set VITE_AUTH_MODE=ldap in .env.local
 * 2. Set VITE_LDAP_URL to your LDAP server (e.g., ldaps://ldap.company.com:636)
 * 3. Set VITE_LDAP_BASE_DN to your base DN (e.g., dc=company,dc=com)
 * 4. Set VITE_LDAP_BIND_DN for service account bind (e.g., cn=svc-soti,ou=services,dc=company,dc=com)
 *
 * Note: In production, LDAP bind should happen server-side via an API endpoint.
 * This provider calls a backend API to verify credentials against LDAP.
 */
export class LDAPAuthProvider implements IAuthProvider {
  private apiUrl: string

  constructor() {
    this.apiUrl = (import.meta.env.VITE_AUTH_API_URL as string) || '/api/auth'
  }

  async login(username: string, password: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) return null

      const data = (await response.json()) as {
        username: string
        displayName: string
        role: 'analyst' | 'admin'
      }

      return {
        username: data.username,
        displayName: data.displayName,
        role: data.role,
      }
    } catch {
      console.error('LDAP auth failed — is the auth API running?')
      return null
    }
  }

  logout(): void {
    // Call logout endpoint if session management is enabled
    fetch(`${this.apiUrl}/logout`, { method: 'POST' }).catch(() => {})
  }
}
