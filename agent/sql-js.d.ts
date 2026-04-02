declare module 'sql.js' {
  interface SqlJsStatic {
    Database: typeof Database
  }

  class Database {
    constructor(data?: ArrayLike<number> | Buffer | null)
    run(sql: string, params?: any[]): Database
    exec(sql: string, params?: any[]): QueryExecResult[]
    prepare(sql: string): Statement
    getRowsModified(): number
    export(): Uint8Array
    close(): void
  }

  interface Statement {
    bind(params?: any[]): boolean
    step(): boolean
    getAsObject(params?: any[]): Record<string, any>
    get(params?: any[]): any[]
    free(): boolean
    reset(): void
  }

  interface QueryExecResult {
    columns: string[]
    values: any[][]
  }

  export default function initSqlJs(config?: {
    locateFile?: (filename: string) => string
  }): Promise<SqlJsStatic>

  export { Database, Statement, QueryExecResult }
}
