// node:sqlite (DatabaseSync) sobre sql.js, para o servidor rodar dentro do navegador na prévia.
// O banco sql.js é criado antes (window.__lacosDB) porque a inicialização do sql.js é assíncrona.
let generation = 0;

const norm = (params) => params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? Number(p) : p));

class StatementSync {
  constructor(sql) {
    this.sql = sql;
    this.gen = -1;
    this.stmt = null;
  }

  prepared() {
    if (this.gen !== generation) {
      this.stmt = window.__lacosDB.prepare(this.sql);
      this.gen = generation;
    }
    return this.stmt;
  }

  all(...params) {
    const s = this.prepared();
    try {
      s.bind(norm(params));
      const rows = [];
      while (s.step()) rows.push(s.getAsObject());
      return rows;
    } finally {
      s.reset();
    }
  }

  get(...params) {
    const s = this.prepared();
    try {
      s.bind(norm(params));
      return s.step() ? s.getAsObject() : undefined;
    } finally {
      s.reset();
    }
  }

  run(...params) {
    const s = this.prepared();
    try {
      s.bind(norm(params));
      s.step();
    } finally {
      s.reset();
    }
    const db = window.__lacosDB;
    const changes = db.getRowsModified();
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    return { changes, lastInsertRowid: id };
  }
}

export class DatabaseSync {
  exec(sql) {
    window.__lacosDB.exec(sql);
  }

  prepare(sql) {
    return new StatementSync(sql);
  }
}

/** Cópia do banco para salvar no navegador. O sql.js fecha os comandos preparados ao exportar. */
export function exportDatabase() {
  const bytes = window.__lacosDB.export();
  generation++;
  window.__lacosDB.exec('PRAGMA foreign_keys = ON;');
  return bytes;
}

/** Troca por um banco vazio (usado para reiniciar a demonstração) */
export function resetDatabase() {
  window.__lacosDB.close();
  window.__lacosDB = new window.__lacosSQL.Database();
  generation++;
}
