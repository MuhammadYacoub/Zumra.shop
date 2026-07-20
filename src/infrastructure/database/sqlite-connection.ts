import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { Logger } from '../logging/logger';

export class SQLiteConnection {
  private static instance: sqlite3.Database | null = null;

  public static getDatabase(customPath?: string): sqlite3.Database {
    if (!this.instance) {
      const dbPath = customPath || process.env.DB_PATH || path.join(__dirname, '../../../scripts/zumra.sqlite');
      
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.instance = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          Logger.error(`Failed to connect to SQLite database at ${dbPath}`, { error: err.message });
          throw err;
        }
        Logger.info(`Connected to SQLite database at ${dbPath}`, { context: 'SQLiteConnection' });
      });

      this.instance.run('PRAGMA foreign_keys = ON;');
    }
    return this.instance;
  }

  public static close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.instance) {
        this.instance.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.instance = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  public static query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = this.getDatabase();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows as T[]);
      });
    });
  }

  public static execute(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
    const db = this.getDatabase();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  public static async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    await this.execute('BEGIN TRANSACTION;');
    try {
      const result = await work();
      await this.execute('COMMIT;');
      return result;
    } catch (err) {
      await this.execute('ROLLBACK;');
      throw err;
    }
  }
}
