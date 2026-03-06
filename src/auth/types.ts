export interface AuthUser {
  username: string
  displayName: string
  role: 'analyst' | 'admin'
}

export interface IAuthProvider {
  login(username: string, password: string): Promise<AuthUser | null>
  logout(): void
}

export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE as string) || 'local'
