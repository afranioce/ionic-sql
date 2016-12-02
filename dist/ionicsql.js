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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { SQLite } from 'ionic-native';
var win = window;
var DB_NAME = '__ionicsql';
var ID_DEFAULT = 'id';
/**
 * Supported Data-types of sqlite 3
 */
export var DataTypes;
(function (DataTypes) {
    DataTypes[DataTypes["TEXT"] = 0] = "TEXT";
    DataTypes[DataTypes["NUMERIC"] = 1] = "NUMERIC";
    DataTypes[DataTypes["INTEGER"] = 2] = "INTEGER";
    DataTypes[DataTypes["REAL"] = 3] = "REAL";
    DataTypes[DataTypes["BLOB"] = 4] = "BLOB";
})(DataTypes || (DataTypes = {}));
export var Operators;
(function (Operators) {
    Operators[Operators["EQ"] = '='] = "EQ";
    Operators[Operators["NEQ"] = '<>'] = "NEQ";
    Operators[Operators["LT"] = '<'] = "LT";
    Operators[Operators["LTE"] = '<='] = "LTE";
    Operators[Operators["GT"] = '>'] = "GT";
    Operators[Operators["GTE"] = '>='] = "GTE";
    Operators[Operators["IN"] = 'IN'] = "IN";
    Operators[Operators["NOT_IN"] = 'NOT IN'] = "NOT_IN";
    Operators[Operators["LIKE"] = 'LIKE'] = "LIKE";
    Operators[Operators["NOT_LIKE"] = 'NOT LIKE'] = "NOT_LIKE";
})(Operators || (Operators = {}));
var SQLConfigDefaults = {
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
export var SQLConfig = (function () {
    function SQLConfig(config) {
        this.set(config);
    }
    SQLConfig.prototype.set = function (config) {
        this._config = SQLHelper.mergeDeep(SQLConfigDefaults, config);
        this.fields = Object.keys(this._config.columns);
        this.adapter = this._config.adapter;
        this.columns = this._config.columns;
        this.debug = this._config.debug;
    };
    SQLConfig.prototype.get = function () {
        return this._config;
    };
    return SQLConfig;
}());
export var Migrator = (function () {
    function Migrator(config, sqlBuilder) {
        this.config = config;
        this.sqlBuilder = sqlBuilder;
    }
    Migrator.prototype.createTable = function () {
        var columns = [];
        for (var field in this.config.columns) {
            columns.push(field + ' ' + DataTypes[this.config.columns[field].type] + (this.config.columns[field].primaryKey ? ' PRIMARY KEY' : '') + (this.config.columns[field].notNull ? ' NOT NULL' : ''));
        }
        var sql = 'CREATE TABLE IF NOT EXISTS ' + this.config.get().adapter.tableName + ' ( ' + columns.join(',') + ' )';
        return this.sqlBuilder.query(sql).catch(function (err) {
            console.error('Storage: Unable to create initial storage tables', err.tx, err.err);
        });
    };
    Migrator.prototype.createIndex = function () {
    };
    Migrator.prototype.dropTable = function () {
        return this.sqlBuilder.query('DROP TABLE IF EXISTS ' + this.config.get().adapter.tableName);
    };
    return Migrator;
}());
export var Sql = (function () {
    function Sql(config) {
        this.config = config;
    }
    /**
     * Open database
     * @returns {Promise<any>}
     */
    Sql.prototype.openDB = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (win.sqlitePlugin) {
                    _this.db = new SQLite();
                    _this.db.openDatabase({
                        name: _this.config.adapter.dbName,
                        location: 'default' // the location field is required
                    }).then(function () {
                        SQLHelper.logger(_this.config.debug, 'Banco de dados aberto');
                        resolve();
                    }).catch(function (err) {
                        console.error('Não é possível abrir banco de dados: ', err);
                    });
                }
                else {
                    console.warn('Storage: SQLite plugin not installed, falling back to WebSQL. Make sure to install cordova-sqlite-storage in production!');
                    _this.db = win.openDatabase(_this.config.adapter.dbName, '1.0', 'database', 5 * 1024 * 1024);
                    resolve();
                }
            }
            catch (error) {
                reject(error);
            }
        });
    };
    /**
     * Init config data of table
     * @param {ISQLAdapterConfig} config
     * @returns {Promise<SQLBuilder>}
     */
    Sql.prototype.init = function (config) {
        var _this = this;
        this.config.set(config);
        return this.openDB().then(function () {
            _this.SQLBuilder = new SQLBuilder(_this.config, _this.db);
            var migrator = new Migrator(_this.config, _this.SQLBuilder);
            return migrator.createTable();
        }).then(function () {
            return _this.SQLBuilder;
        });
    };
    Sql = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [SQLConfig])
    ], Sql);
    return Sql;
}());
export var SQLBuilder = (function () {
    function SQLBuilder(config, db) {
        this.config = config;
        this.db = db;
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
    SQLBuilder.prototype.query = function (query, params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.db.transaction(function (tx) {
                    SQLHelper.logger(_this.config.debug, 'Before execute sql: query', query);
                    SQLHelper.logger(_this.config.debug, 'Before execute sql: params', params);
                    tx.executeSql(query, params ? params : [], function (tx, res) {
                        SQLHelper.logger(_this.config.debug, 'After execute sql: total rows', res.rows.length);
                        SQLHelper.logger(_this.config.debug, 'After execute sql: total affected', res.rowsAffected);
                        return resolve(res);
                    }, function (tx, err) { return reject(err); });
                });
            }
            catch (err) {
                reject({ err: err });
            }
        });
    };
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
    SQLBuilder.prototype.filter = function (condition, order, limit, offset) {
        var values = [], criteria = [];
        for (var field in condition) {
            if (Array.isArray(condition[field])) {
                var inCond = [];
                for (var i in condition[field]) {
                    values.push(condition[field][i]);
                    inCond.push('?');
                }
                criteria.push(field + " " + Operators.IN + " ( " + inCond.join(',') + " )");
            }
            else if (SQLHelper.isObject(condition[field])) {
                if (Array.isArray(condition[field].value)) {
                    var inCond = [];
                    var con = [Operators.IN, Operators.NOT_IN];
                    condition[field].operator = con[con.indexOf(condition[field].operator)];
                    for (var i in condition[field].value) {
                        values.push(condition[field].value[i]);
                        inCond.push('?');
                    }
                    criteria.push(field + " " + condition[field].operator + " ( " + inCond.join(',') + " )");
                }
                criteria.push(field + " " + condition[field].operator + " ?");
                values.push(condition[field].value);
            }
            else {
                criteria.push(field + " " + Operators.EQ + " ?");
                values.push(condition[field]);
            }
        }
        return this.query(("SELECT * FROM " + this.config.adapter.tableName) + (values.length > 0 ? ' WHERE ' + criteria.join(' AND ') : '') + (order ? ' ORDER BY ' + order.join(', ') : '') + this.doOffset(limit, offset), values);
    };
    SQLBuilder.prototype.doOffset = function (limit, offset) {
        var limitQuery = '';
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
    };
    /**
     * Get the value in the database identified by the given key.
     * @param key A value from atribute id
     * @returns {Promise<any>} Result
     */
    SQLBuilder.prototype.get = function (key) {
        return this.query("SELECT * FROM " + this.config.adapter.tableName + " WHERE " + this.config.adapter.idAttribute + " = ? limit 1", [key]).then(function (data) {
            if (data.res.rows.length > 0) {
                return data.rows.item(0);
            }
        });
    };
    /**
     * Set the value in the database. Existing values will be overwritten.
     *
     * @param {Object|Object[]} entity
     * @returns {Promise<any>} that resolves or rejects with an object of the form
     */
    SQLBuilder.prototype.set = function (entity) {
        var entities = (Array.isArray(entity) ? entity : [entity]), values = [], rows = [];
        for (var _i = 0, entities_1 = entities; _i < entities_1.length; _i++) {
            entity = entities_1[_i];
            var qs = [];
            for (var _a = 0, _b = this.config.fields; _a < _b.length; _a++) {
                var field = _b[_a];
                values.push(entity[field]);
                qs.push('?');
            }
            rows.push('( ' + qs.join(',') + ' )');
        }
        var sql = 'INSERT OR REPLACE INTO ' + this.config.adapter.tableName + '( ' + this.config.fields.join(',') + ' ) VALUES ' + rows.join(', ');
        return this.query(sql, values);
    };
    /**
     * Remove the value in the database for the given key.
     * @param {any} key A value from atribute id
     * @returns {Promise<any>}
     */
    SQLBuilder.prototype.remove = function (key) {
        return this.query("DELETE FROM " + this.config.adapter.tableName + " WHERE " + this.config.adapter.idAttribute + " = ?", [key]);
    };
    /**
     * Clear all data.
     * @returns {Promise<any>}
     */
    SQLBuilder.prototype.clear = function () {
        return this.query('DELETE FROM ' + this.config.adapter.tableName);
    };
    return SQLBuilder;
}());
export var SQLHelper = (function () {
    function SQLHelper() {
    }
    SQLHelper.logger = function (debug, message, data) {
        if (debug) {
            console.log('[SQL] ' + message);
            if (data) {
                console.debug(typeof data === 'object' ? JSON.stringify(data, null, '\t') : data);
            }
        }
    };
    /**
     * Simple is object check.
     * @param item
     * @returns {boolean}
     */
    SQLHelper.isObject = function (item) {
        return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
    };
    /**
     * Deep merge two objects.
     * @param target
     * @param source
     */
    SQLHelper.mergeDeep = function (target, source) {
        if (SQLHelper.isObject(target) && SQLHelper.isObject(source)) {
            for (var key in source) {
                if (SQLHelper.isObject(source[key])) {
                    if (!target[key])
                        Object.assign(target, (_a = {}, _a[key] = {}, _a));
                    SQLHelper.mergeDeep(target[key], source[key]);
                }
                else {
                    Object.assign(target, (_b = {}, _b[key] = source[key], _b));
                }
            }
        }
        return target;
        var _a, _b;
    };
    return SQLHelper;
}());
export function getSqlConfig() {
    return new Sql(new SQLConfig());
}
export var SQL_PROVIDERS = [
    {
        provide: Sql,
        useFactory: getSqlConfig
    }
];
