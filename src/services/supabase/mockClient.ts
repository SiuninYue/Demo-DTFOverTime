import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type PublicTables = Database['public']['Tables']
type TableName = keyof PublicTables
type TableRow<T extends TableName> = PublicTables[T]['Row']
type TableInsert<T extends TableName> = PublicTables[T]['Insert']
type TableUpdate<T extends TableName> = PublicTables[T]['Update']

type Filter<T> = (row: T) => boolean

const tableNames: TableName[] = [
  'employees',
  'schedules',
  'time_records',
  'mc_records',
  'monthly_salaries',
]

const hasBrowserStorage = () => typeof window !== 'undefined' && !!window.localStorage
const dbStorageKey = 'mock-supabase-db-v1'
const authStorageKey = 'mock-supabase-auth-v1'

const nowISO = () => new Date().toISOString()

const generateId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)

const clone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

const pickColumns = <T extends Record<string, unknown>>(row: T, columns?: string[]): Partial<T> =>
  columns
    ? columns.reduce<Partial<T>>((acc, key) => {
        if (key in row) {
          acc[key as keyof T] = row[key as keyof T]
        }
        return acc
      }, {})
    : row

class TableQuery<T extends TableName> {
  private filters: Filter<TableRow<T>>[] = []
  private orderBy: { column: keyof TableRow<T>; ascending: boolean } | null = null
  private selectedColumns: string[] | null = null
  private hasSelect = false
  private mutation:
    | { type: 'insert'; rows: TableInsert<T>[] }
    | { type: 'upsert'; rows: TableInsert<T>[]; conflictKeys: (keyof TableRow<T>)[] }
    | { type: 'update'; payload: TableUpdate<T> }
    | { type: 'delete' }
    | null = null
  private mutationApplied = false
  private lastMutationRows: TableRow<T>[] = []

  constructor(
    private readonly tableName: T,
    private readonly table: TableRow<T>[],
    private readonly persist: () => void,
  ) {}

  select(columns = '*') {
    this.hasSelect = true
    if (columns !== '*') {
      this.selectedColumns = columns
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    }
    return this
  }

  insert(payload: TableInsert<T> | TableInsert<T>[]) {
    const rows = Array.isArray(payload) ? payload : [payload]
    this.mutation = { type: 'insert', rows }
    this.mutationApplied = false
    return this
  }

  upsert(payload: TableInsert<T> | TableInsert<T>[], options?: { onConflict?: string }) {
    const rows = Array.isArray(payload) ? payload : [payload]
    const conflictKeys =
      options?.onConflict?.split(',').map((key) => key.trim()).filter(Boolean) ?? []
    this.mutation = {
      type: 'upsert',
      rows,
      conflictKeys: conflictKeys as (keyof TableRow<T>)[],
    }
    this.mutationApplied = false
    return this
  }

  update(payload: TableUpdate<T>) {
    this.mutation = { type: 'update', payload }
    this.mutationApplied = false
    return this
  }

  delete() {
    this.mutation = { type: 'delete' }
    this.mutationApplied = false
    return this
  }

  eq(column: keyof TableRow<T>, value: unknown) {
    this.filters.push((row) => row[column] === value)
    return this
  }

  gte(column: keyof TableRow<T>, value: unknown) {
    this.filters.push((row) => (row[column] as unknown as string) >= (value as string))
    return this
  }

  lte(column: keyof TableRow<T>, value: unknown) {
    this.filters.push((row) => (row[column] as unknown as string) <= (value as string))
    return this
  }

  order(column: keyof TableRow<T>, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  async single() {
    const rows = this.runSelect()
    if (rows.length === 1) {
      return { data: rows[0], error: null }
    }
    if (rows.length === 0) {
      return { data: null, error: new Error('No rows found') }
    }
    return { data: rows[0], error: new Error('Multiple rows returned') }
  }

  async maybeSingle() {
    const rows = this.runSelect()
    if (!rows.length) {
      return { data: null, error: null }
    }
    return { data: rows[0], error: null }
  }

  async range(from: number, to: number) {
    const rows = this.runSelect().slice(from, to + 1)
    return { data: rows, error: null }
  }

  async then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: Error | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    const outcome = this.executeDefault()
    return Promise.resolve(outcome).then(onfulfilled, onrejected)
  }

  private executeDefault() {
    if (this.hasSelect) {
      return { data: this.runSelect(), error: null }
    }

    if (this.mutation && !this.mutationApplied) {
      this.applyMutation()
    }

    if (this.mutation?.type === 'delete') {
      return { data: this.lastMutationRows, error: null }
    }

    return { data: this.lastMutationRows, error: null }
  }

  private runSelect(): TableRow<T>[] {
    if (this.mutation && !this.mutationApplied) {
      this.applyMutation()
    }

    const rows = this.filteredRows()
    if (this.selectedColumns) {
      return rows.map((row) => pickColumns(row, this.selectedColumns || undefined)) as TableRow<T>[]
    }
    return rows
  }

  private filteredRows(): TableRow<T>[] {
    const useMutationRows =
      this.mutationApplied &&
      this.mutation &&
      this.mutation.type !== 'delete' &&
      this.lastMutationRows.length > 0

    let rows = useMutationRows ? [...this.lastMutationRows] : [...this.table]
    if (this.filters.length) {
      rows = rows.filter((row) => this.filters.every((filter) => filter(row)))
    }
    if (this.orderBy) {
      const { column, ascending } = this.orderBy
      rows.sort((a, b) => {
        const first = (a[column] ?? '') as unknown as string
        const second = (b[column] ?? '') as unknown as string
        return ascending ? first.localeCompare(second) : second.localeCompare(first)
      })
    }
    return rows
  }

  private applyMutation() {
    if (!this.mutation || this.mutationApplied) {
      return
    }

    switch (this.mutation.type) {
      case 'insert': {
        const inserted = this.mutation.rows.map((row) => this.prepareInsert(row))
        this.table.push(...inserted)
        this.lastMutationRows = inserted
        break
      }
      case 'upsert': {
        const inserted: TableRow<T>[] = []
        this.mutation.rows.forEach((row) => {
          const existing = this.findConflictRow(row)
          if (existing) {
            Object.assign(existing, this.prepareUpdatePayload(row))
            inserted.push(existing)
          } else {
            const prepared = this.prepareInsert(row)
            this.table.push(prepared)
            inserted.push(prepared)
          }
        })
        this.lastMutationRows = inserted
        break
      }
      case 'update': {
        const targets = this.filteredRows()
        const mutation = this.mutation as { type: 'update'; payload: TableUpdate<T> }
        targets.forEach((row) => Object.assign(row, this.prepareUpdatePayload(mutation.payload)))
        this.lastMutationRows = targets
        break
      }
      case 'delete': {
        const targets = this.filteredRows()
        this.lastMutationRows = targets
        targets.forEach((target) => {
          const index = this.table.indexOf(target)
          if (index >= 0) {
            this.table.splice(index, 1)
          }
        })
        break
      }
      default:
        break
    }

    this.mutationApplied = true
    this.persist()
  }

  private prepareInsert(row: TableInsert<T>): TableRow<T> {
    const record = clone(row) as TableRow<T>
    if ('id' in record && !record.id) {
      record.id = generateId() as TableRow<T>['id']
    }
    if ('created_at' in record && !record.created_at) {
      record.created_at = nowISO() as TableRow<T>['created_at']
    }
    if ('updated_at' in record) {
      record.updated_at = nowISO() as TableRow<T>['updated_at']
    }
    if ('imported_at' in record && !(record as Record<string, unknown>).imported_at) {
      (record as Record<string, unknown>).imported_at = nowISO()
    }
    return record
  }

  private prepareUpdatePayload(payload: Partial<TableUpdate<T>>): Partial<TableRow<T>> {
    const sanitized: Partial<TableRow<T>> = {}
    Object.entries(payload ?? {}).forEach(([key, value]) => {
      if (value !== undefined) {
        sanitized[key as keyof TableRow<T>] = value as TableRow<T>[keyof TableRow<T>]
      }
    })
    if ('updated_at' in (sanitized as Record<string, unknown>)) {
      sanitized.updated_at = nowISO() as TableRow<T>['updated_at']
    } else if ('updated_at' in (this.table[0] ?? {})) {
      ;(sanitized as Record<string, unknown>).updated_at = nowISO()
    }
    return sanitized
  }

  private findConflictRow(insert: TableInsert<T>) {
    if (!('conflictKeys' in (this.mutation as { conflictKeys?: Array<keyof TableRow<T>> }))) {
      return null
    }
    const keys = (this.mutation as { conflictKeys?: Array<keyof TableRow<T>> }).conflictKeys
    if (!keys?.length) {
      return null
    }
    return this.table.find((row) => keys.every((key) => row[key] === (insert as TableRow<T>)[key])) ?? null
  }
}

interface StoredObject {
  bucket: string
  path: string
  blob: Blob
  contentType?: string
}

interface StoredUser {
  id: string
  email: string
  password: string
  created_at: string
}

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void

const storageBuckets = new Map<string, Map<string, StoredObject>>()

const getBucket = (bucket: string) => {
  if (!storageBuckets.has(bucket)) {
    storageBuckets.set(bucket, new Map())
  }
  return storageBuckets.get(bucket)!
}

const defaultTables = (): Record<TableName, TableRow<TableName>[]> =>
  tableNames.reduce((acc, name) => {
    acc[name] = []
    return acc
  }, {} as Record<TableName, TableRow<TableName>[]>)

const loadTables = (): Record<TableName, TableRow<TableName>[]> => {
  if (!hasBrowserStorage()) {
    return defaultTables()
  }
  const raw = window.localStorage.getItem(dbStorageKey)
  if (!raw) {
    return defaultTables()
  }
  try {
    const parsed = JSON.parse(raw) as Record<TableName, TableRow<TableName>[]>
    return { ...defaultTables(), ...parsed }
  } catch {
    return defaultTables()
  }
}

const persistTables = (tables: Record<TableName, TableRow<TableName>[]>) => {
  if (!hasBrowserStorage()) {
    return
  }
  window.localStorage.setItem(dbStorageKey, JSON.stringify(tables))
}

const loadAuthState = (): { users: StoredUser[]; session: Session | null } => {
  if (!hasBrowserStorage()) {
    return { users: [], session: null }
  }
  const raw = window.localStorage.getItem(authStorageKey)
  if (!raw) {
    return { users: [], session: null }
  }
  try {
    const parsed = JSON.parse(raw) as { users: StoredUser[]; session: Session | null }
    return {
      users: parsed.users ?? [],
      session: parsed.session ?? null,
    }
  } catch {
    return { users: [], session: null }
  }
}

const persistAuthState = (users: StoredUser[], session: Session | null) => {
  if (!hasBrowserStorage()) {
    return
  }
  window.localStorage.setItem(authStorageKey, JSON.stringify({ users, session }))
}

const toSupabaseUser = (user: StoredUser): User => ({
  id: user.id,
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  aud: 'authenticated',
  confirmation_sent_at: user.created_at,
  confirmed_at: user.created_at,
  created_at: user.created_at,
  email: user.email,
  email_confirmed_at: user.created_at,
  last_sign_in_at: user.created_at,
  phone: '',
  role: 'authenticated',
  updated_at: user.created_at,
  identities: [],
  is_anonymous: false,
})

const toSession = (user: StoredUser): Session => ({
  access_token: `mock-token-${user.id}`,
  refresh_token: `mock-refresh-${user.id}`,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  provider_token: null,
  user: toSupabaseUser(user),
})

const createSupabaseMock = () => {
  const tables = loadTables()
  const authState = loadAuthState()
  const listeners = new Set<AuthListener>()
  let currentSession: Session | null = authState.session
  let users: StoredUser[] = authState.users

  const notify = (event: AuthChangeEvent, session: Session | null) => {
    listeners.forEach((listener) => listener(event, session))
  }

  const persistAuth = () => persistAuthState(users, currentSession)
  const persistDb = () => persistTables(tables)

  const auth = {
    async signUp(payload: { email: string; password: string }) {
      const email = payload.email.trim().toLowerCase()
      const password = payload.password
      const existing = users.find((user) => user.email === email)
      if (existing) {
        return {
          data: { user: null, session: null },
          error: new Error('Email already registered'),
        }
      }

      const newUser: StoredUser = {
        id: generateId(),
        email,
        password,
        created_at: nowISO(),
      }

      users = [...users, newUser]
      currentSession = toSession(newUser)
      persistAuth()
      notify('SIGNED_IN', currentSession)

      return {
        data: { user: currentSession.user, session: currentSession },
        error: null,
      }
    },

    async signInWithPassword(payload: { email: string; password: string }) {
      const email = payload.email.trim().toLowerCase()
      const password = payload.password
      const found = users.find((user) => user.email === email)

      if (!found || found.password !== password) {
        return {
          data: { user: null, session: null },
          error: new Error('Invalid email or password'),
        }
      }

      currentSession = toSession(found)
      persistAuth()
      notify('SIGNED_IN', currentSession)

      return { data: { user: currentSession.user, session: currentSession }, error: null }
    },

    async signOut() {
      currentSession = null
      persistAuth()
      notify('SIGNED_OUT', null)
      return { error: null }
    },

    async getSession() {
      return { data: { session: currentSession }, error: null }
    },

    async getUser() {
      return { data: { user: currentSession?.user ?? null }, error: null }
    },

    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback)
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
        error: null,
      }
    },
  }

  return {
    from<K extends TableName>(table: K) {
      return new TableQuery(table, tables[table], persistDb) as TableQuery<K>
    },
    storage: {
      from(bucket: string) {
        return {
          upload: async (path: string, file: Blob) => {
            const bucketStore = getBucket(bucket)
            bucketStore.set(path, {
              bucket,
              path,
              blob: file,
              contentType: file instanceof File ? file.type : undefined,
            })
            return { data: { path }, error: null }
          },
          download: async (path: string) => {
            const bucketStore = getBucket(bucket)
            const stored = bucketStore.get(path)
            if (!stored) {
              return { data: null, error: new Error(`Object ${path} not found`) }
            }
            return { data: stored.blob, error: null }
          },
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://mock-supabase.local/storage/v1/object/public/${bucket}/${path}`,
            },
          }),
        }
      },
    },
    auth,
    reset: () => {
      users = []
      currentSession = null
      tableNames.forEach((name) => {
        tables[name] = []
      })
      storageBuckets.clear()
      persistAuth()
      persistDb()
    },
    dump: () => tables,
  }
}

let cachedMock: ReturnType<typeof createSupabaseMock> | null = null

export const getSupabaseMock = () => {
  if (!cachedMock) {
    cachedMock = createSupabaseMock()
  }
  return cachedMock as unknown as SupabaseClient<Database>
}

export const resetSupabaseMock = () => {
  cachedMock?.reset()
}

export const inspectSupabaseTables = () => cachedMock?.dump()
