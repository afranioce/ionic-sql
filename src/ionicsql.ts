/**
 * @todo Projeto está em andamento, documentação não implementada, necessita de melhorias
 * @todo Adicionar suporte a migrations
 *
 * @name Sql
 *
 * @description
 * Access SQLite databases on the device or browser.
 *
 * @usage
 *
 * Next, add it to the providers list in your `NgModule` declaration (for example, in `src/app.module.ts`):
 *
 * ```typescript
 * import { Sql } from './sql';
 *
 * @NgModule({
 *   declarations: [
 *     // ...
 *   ],
 *   imports: [
 *     IonicModule.forRoot(MyApp)
 *   ],
 *   bootstrap: [IonicApp],
 *   entryComponents: [
 *     // ...
 *   ],
 *   providers: [
 *     SQL_PROVIDERS
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * Finally, inject it into any of your components:
 *
 * ```typescript
 * import { Sql, DataTypes, SQLBuilder } from './sql';
 *
 * @Injectable()
 * export class Article {
 *   private db: Promise<SQLBuilder>;
 *
 *   constructor(sql: Sql) {
 *     this.sql = sql.init({
 *       adapter: {
 *         idAttribute: 'Id',
 *         tableName: 'article'
 *       },
 *       columns: [
 *         { name: 'id', type: DataTypes.INTEGER, primaryKey: true, notNull: true },
 *         { name: 'author', type: DataTypes.TEXT, notNull: true },
 *         { name: 'body', type: DataTypes.TEXT, notNull: true },
 *         { name: 'published', type: DataTypes.INTEGER, notNull: true },
 *       ]
 *     });
 *   }
 *
 *   public fetch(): Promise<any> {
 *     return this.db.then((sql) => sql.query("SELECT * FROM article")).then(results => {
 *       return results.rows;
 *     });
 *   }
 * }
 * ```
 *
 */

import { Injectable, Provider } from '@angular/core';
import { SQLite } from 'ionic-native';

const win: any = window;

const DB_NAME: string = '__ionicsql';
const ID_DEFAULT: string = 'id';

/**
 * Supported Data-types of sqlite 3
 */
export enum DataTypes {
  TEXT,
  NUMERIC,
  INTEGER,
  REAL,
  BLOB,
}

export enum Operators {
  EQ = <any>'=',
  NEQ = <any>'<>',
  LT = <any>'<',
  LTE = <any>'<=',
  GT = <any>'>',
  GTE = <any>'>=',
  IN = <any>'IN',
  NOT_IN = <any>'NOT IN',
  LIKE = <any>'LIKE',
  NOT_LIKE = <any>'NOT LIKE'
}

export interface ColumnType {
  [name: string]: {
    type: DataTypes;
    primaryKey?: boolean;
    notNull?: boolean;
    defaultValue?: any;
  };
}

export interface ISQLAdapterConfig {
  columns: ColumnType;
  debug?: boolean;
  adapter: {
    tableName: string;
    dbName?: string;
    idAttribute?: string;
  };
}

let SQLConfigDefaults = {
  debug: true,
  columns: {},
  adapter: {
    dbName: DB_NAME,
    idAttribute: ID_DEFAULT,
  }
};

/**
 * Sets up the sql configuration.
 */
export class SQLConfig {
  private _config: ISQLAdapterConfig;
  public adapter;
  public columns: ColumnType;
  public fields: string[];
  public debug: Boolean;

  constructor(config?: ISQLAdapterConfig) {
    this.set(config);
  }

  public set(config) {
    this._config = SQLHelper.mergeDeep(SQLConfigDefaults, config);

    this.fields = Object.keys(this._config.columns);
    this.adapter = this._config.adapter;
    this.columns = this._config.columns;
    this.debug = this._config.debug;
  }

  public get(): ISQLAdapterConfig {
    return this._config;
  }
}

export class Migrator {
  constructor(private config: SQLConfig, private sqlBuilder: SQLBuilder) {
  }

  public createTable(): Promise<any> {
    let columns: string[] = [];
    for (let field in this.config.columns) {
      columns.push(field + ' ' + DataTypes[this.config.columns[field].type] + (this.config.columns[field].primaryKey ? ' PRIMARY KEY' : '') + (this.config.columns[field].notNull ? ' NOT NULL' : ''));
    }

    let sql = 'CREATE TABLE IF NOT EXISTS ' + this.config.get().adapter.tableName + ' ( ' + columns.join(',') + ' )';

    return this.sqlBuilder.query(sql).catch(err => {
      console.error('Storage: Unable to create initial storage tables', err.tx, err.err);
    });
  }

  public createIndex() {
  }

  public dropTable() {
    return this.sqlBuilder.query('DROP TABLE IF EXISTS ' + this.config.get().adapter.tableName);
  }

}

@Injectable()
export class Sql {
  private db: SQLite | any;
  private SQLBuilder: SQLBuilder;

  constructor(private config?: SQLConfig) {

  }

  /**
   * Open database
   * @returns {Promise<any>}
   */
  public openDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (win.sqlitePlugin) {
          this.db = new SQLite();

          this.db.openDatabase({
            name: this.config.adapter.dbName,
            location: 'default' // the location field is required
          }).then(() => {
            SQLHelper.logger(this.config.debug, 'Banco de dados aberto');
            resolve();
          }).catch((err: any) => {
            console.error('Não é possível abrir banco de dados: ', err);
          });

        } else {
          console.warn('Storage: SQLite plugin not installed, falling back to WebSQL. Make sure to install cordova-sqlite-storage in production!');

          this.db = win.openDatabase(this.config.adapter.dbName, '1.0', 'database', 5 * 1024 * 1024);
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Init config data of table
   * @param {ISQLAdapterConfig} config
   * @returns {Promise<SQLBuilder>}
   */
  public init(config: ISQLAdapterConfig): Promise<SQLBuilder> {
    this.config.set(config);

    return this.openDB().then(() => {
      this.SQLBuilder = new SQLBuilder(this.config, this.db);
      let migrator = new Migrator(this.config, this.SQLBuilder);

      return migrator.createTable();
    }).then(() => {
      return this.SQLBuilder;
    });
  }
}

export class SQLBuilder {
  constructor(private config: SQLConfig, private db: SQLite) {

  }

  /**
   * Perform an arbitrary SQL operation on the database. Use this method
   * to have full control over the underlying database through SQL operations
   * like SELECT, INSERT, and UPDATE.
   *
   * @param {string} query the query to run
   * @param {array} params the additional params to use for query placeholders
   * @return {Promise<any>} Result
   */
  public query(query: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.db.transaction((tx: any) => {
          SQLHelper.logger(this.config.debug, 'Before execute sql: query', query);
          SQLHelper.logger(this.config.debug, 'Before execute sql: params', params);
          tx.executeSql(query, params ? params : [],
            (tx: any, res: any) => {
              SQLHelper.logger(this.config.debug, 'After execute sql: total rows', res.rows.length);
              SQLHelper.logger(this.config.debug, 'After execute sql: total affected', res.rowsAffected);
              return resolve(res);
            },
            (tx: any, err: any) => reject(err));
        });
      } catch (err) {
        reject({ err: err });
      }
    });
  }

  /**
   * @deprecated
   *
   * @usage
   *
   * ```typescript
   * //...
   * this.db.then((sql) => sql.filter({foo: 'loren', bar: 1})).then(results => {
   *   return results.rows;
   * });
   * //...
   * ```
   *
   * Or
   *
   * ```typescript
   * //...
   * this.db.then((sql) => sql.filter({foo: {operator: '=', value: 'loren'}, bar: 1})).then(results => {
   *   return results.rows;
   * });
   * //...
   * ```
   *
   * Or
   *
   * ```typescript
   * //...
   * this.db.then((sql) => sql.filter({foo: ['in', 'array', 'condition'], bar: 1})).then(results => {
   *   return results.rows;
   * });
   * //...
   * ```
   *
   */
  public filter(condition?: { [field: string]: any | { operator: Operators, value: any } }, order?: string[], limit?: Number, offset?: Number): Promise<any> {
    let values = [], criteria = [];

    for (let field in condition) {
      if (Array.isArray(condition[field])) {
        let inCond = [];
        for (let i in condition[field]) {
          values.push(condition[field][i]);
          inCond.push('?');
        }
        criteria.push(`${field} ${Operators.IN} ( ${inCond.join(',')} )`);
      } else if (SQLHelper.isObject(condition[field])) {
        if (Array.isArray(condition[field].value)) {
          let inCond = [];
          var con = [Operators.IN, Operators.NOT_IN];
          condition[field].operator = con[con.indexOf(condition[field].operator)];

          for (let i in condition[field].value) {
            values.push(condition[field].value[i]);
            inCond.push('?');
          }

          criteria.push(`${field} ${condition[field].operator} ( ${inCond.join(',')} )`);
        }

        criteria.push(`${field} ${condition[field].operator} ?`);
        values.push(condition[field].value);
      } else {
        criteria.push(`${field} ${Operators.EQ} ?`);
        values.push(condition[field]);
      }
    }

    return this.query(`SELECT * FROM ${this.config.adapter.tableName}` + (values.length > 0 ? ' WHERE ' + criteria.join(' AND ') : '') + (order ? ' ORDER BY ' + order.join(', ') : '') + this.doOffset(limit, offset), values);
  }

  private doOffset(limit?: Number, offset?: Number) {
    let limitQuery = '';
    if (limit) {
      limitQuery += ' LIMIT ' + limit;
    }

    if (offset) {
      if (offset < 0) {
        console.error('Error: LIMIT argument offset=offset is not valid');
      }
      limitQuery += ' OFFSET ' + offset;
    }

    return limitQuery;
  }

  /**
   * Get the value in the database identified by the given key.
   * @param key A value from atribute id
   * @returns {Promise<any>} Result
   */
  public get(key: string): Promise<any> {
    return this.query(`SELECT * FROM ${this.config.adapter.tableName} WHERE ${this.config.adapter.idAttribute} = ? limit 1`, [key]).then(data => {
      if (data.res.rows.length > 0) {
        return data.rows.item(0);
      }
    });
  }

  /**
   * Set the value in the database. Existing values will be overwritten.
   *
   * @param {Object|Object[]} entity
   * @returns {Promise<any>} that resolves or rejects with an object of the form
   */
  public set(entity: {[key: string]: any} | {[key: string]: any}[]): Promise<any> {
    let entities: {[key: string]: any}[] = (Array.isArray(entity) ? entity : [entity]), values: any[] = [], rows: any[] = [];

    for (entity of entities) {
      let qs = [];

      for (let field of this.config.fields) {
        values.push(entity[field]);
        qs.push('?');
      }

      rows.push('( ' + qs.join(',') + ' )');
    }

    let sql = 'INSERT OR REPLACE INTO ' + this.config.adapter.tableName + '( ' + this.config.fields.join(',') + ' ) VALUES ' + rows.join(', ');
    return this.query(sql, values);
  }

  /**
   * Remove the value in the database for the given key.
   * @param {any} key A value from atribute id
   * @returns {Promise<any>}
   */
  public remove(key: any): Promise<any> {
    return this.query(`DELETE FROM ${this.config.adapter.tableName} WHERE ${this.config.adapter.idAttribute} = ?`, [key]);
  }

  /**
   * Clear all data.
   * @returns {Promise<any>}
   */
  public clear(): Promise<any> {
    return this.query('DELETE FROM ' + this.config.adapter.tableName);
  }
}

export class SQLHelper {
  public static logger(debug: Boolean, message: string, data?: any) {
    if (debug) {
      console.log('[SQL] ' + message);
      if (data) {
        console.debug(typeof data === 'object' ? JSON.stringify(data, null, '\t') : data);
      }
    }
  }

  /**
   * Simple is object check.
   * @param item
   * @returns {boolean}
   */
  public static isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  /**
   * Deep merge two objects.
   * @param target
   * @param source
   */
  public static mergeDeep(target: any, source: any) {
    if (SQLHelper.isObject(target) && SQLHelper.isObject(source)) {
      for (const key in source) {
        if (SQLHelper.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          SQLHelper.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    return target;
  }
}

export function getSqlConfig() {
  return new Sql(new SQLConfig());
}

export const SQL_PROVIDERS: Provider[] = [
  {
    provide: Sql,
    useFactory: getSqlConfig
  }
];
