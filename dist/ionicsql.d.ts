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
import { Provider } from '@angular/core';
import { SQLite } from 'ionic-native';
/**
 * Supported Data-types of sqlite 3
 */
export declare enum DataTypes {
    TEXT = 0,
    NUMERIC = 1,
    INTEGER = 2,
    REAL = 3,
    BLOB = 4,
}
export declare enum Operators {
    EQ,
    NEQ,
    LT,
    LTE,
    GT,
    GTE,
    IN,
    NOT_IN,
    LIKE,
    NOT_LIKE,
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
/**
 * Sets up the sql configuration.
 */
export declare class SQLConfig {
    private _config;
    adapter: any;
    columns: ColumnType;
    fields: string[];
    debug: Boolean;
    constructor(config?: ISQLAdapterConfig);
    set(config: any): void;
    get(): ISQLAdapterConfig;
}
export declare class Migrator {
    private config;
    private sqlBuilder;
    constructor(config: SQLConfig, sqlBuilder: SQLBuilder);
    createTable(): Promise<any>;
    createIndex(): void;
    dropTable(): Promise<any>;
}
export declare class Sql {
    private config;
    private db;
    private SQLBuilder;
    constructor(config?: SQLConfig);
    /**
     * Open database
     * @returns {Promise<any>}
     */
    openDB(): Promise<any>;
    /**
     * Init config data of table
     * @param {ISQLAdapterConfig} config
     * @returns {Promise<SQLBuilder>}
     */
    init(config: ISQLAdapterConfig): Promise<SQLBuilder>;
}
export declare class SQLBuilder {
    private config;
    private db;
    constructor(config: SQLConfig, db: SQLite);
    /**
     * Perform an arbitrary SQL operation on the database. Use this method
     * to have full control over the underlying database through SQL operations
     * like SELECT, INSERT, and UPDATE.
     *
     * @param {string} query the query to run
     * @param {array} params the additional params to use for query placeholders
     * @return {Promise<any>} Result
     */
    query(query: string, params?: any[]): Promise<any>;
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
    filter(condition?: {
        [field: string]: any | {
            operator: Operators;
            value: any;
        };
    }, order?: string[], limit?: Number, offset?: Number): Promise<any>;
    private doOffset(limit?, offset?);
    /**
     * Get the value in the database identified by the given key.
     * @param key A value from atribute id
     * @returns {Promise<any>} Result
     */
    get(key: string): Promise<any>;
    /**
     * Set the value in the database. Existing values will be overwritten.
     *
     * @param {Object|Object[]} entity
     * @returns {Promise<any>} that resolves or rejects with an object of the form
     */
    set(entity: {
        [key: string]: any;
    } | {
        [key: string]: any;
    }[]): Promise<any>;
    /**
     * Remove the value in the database for the given key.
     * @param {any} key A value from atribute id
     * @returns {Promise<any>}
     */
    remove(key: any): Promise<any>;
    /**
     * Clear all data.
     * @returns {Promise<any>}
     */
    clear(): Promise<any>;
}
export declare class SQLHelper {
    static logger(debug: Boolean, message: string, data?: any): void;
    /**
     * Simple is object check.
     * @param item
     * @returns {boolean}
     */
    static isObject(item: any): boolean;
    /**
     * Deep merge two objects.
     * @param target
     * @param source
     */
    static mergeDeep(target: any, source: any): any;
}
export declare function getSqlConfig(): Sql;
export declare const SQL_PROVIDERS: Provider[];
