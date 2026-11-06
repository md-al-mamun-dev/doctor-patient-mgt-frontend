export function setSessionCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'dt_session=true; path=/; max-age=604800; SameSite=Lax';
  }
}

export function clearSessionCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'dt_session=; path=/; max-age=0; SameSite=Lax';
  }
}

