const BASE = typeof window !== 'undefined' ? window.location.origin : '';

export interface SharedNote {
  id: string;
  title: string;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface NoteStateResponse {
  state: string | null;
}

async function headers(): Promise<HeadersInit> {
  const raw = localStorage.getItem('auth_user');
  let userId = '';
  if (raw) {
    try { userId = JSON.parse(raw).id || ''; } catch { /* noop */ }
  }
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = userId;
  return h;
}

async function get<T>(path: string): Promise<T> {
  const h = await headers();
  const res = await fetch(`${BASE}${path}`, { headers: h });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const h = await headers();
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const h = await headers();
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: h, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function del(path: string): Promise<void> {
  const h = await headers();
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: h });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

export async function listNotes(): Promise<SharedNote[]> {
  return get<SharedNote[]>('/api/notes');
}

export async function createNote(title?: string): Promise<SharedNote> {
  return post<SharedNote>('/api/notes', { title });
}

export async function updateNoteTitle(id: string, title: string): Promise<SharedNote> {
  return put<SharedNote>(`/api/notes/${id}`, { title });
}

export async function deleteNote(id: string): Promise<void> {
  return del(`/api/notes/${id}`);
}

export async function loadNoteState(id: string): Promise<string | null> {
  const res = await get<NoteStateResponse>(`/api/notes/${id}/state`);
  return res.state;
}

export async function saveNoteState(id: string, state: string): Promise<void> {
  await put<Record<string, unknown>>(`/api/notes/${id}/state`, { state });
}
