'use strict'
const mysql = require('mysql')
/**
 * Example
 *  
 * query
 * @param string query like 'SELECT * FROM posts'
 * db.query(query).then(response=>{
 *   console.log(response)
 * }).catch(error => {
 *   console.log(error);
 * })
 * 
 * select
 * @param string table 
 * @param string|array columns 
 * @param string|array where like [['id','>',6,'and'],['id','<',9]]
 * db.select(table,columns,where)
 *  .then(response => {
 *  console.log(response);
 * }).catch(error => {
 *  console.log(error);
 * })
 * 
 * insert
 * @param string table 
 * @param object data { column: value } 
 * 
 *  db.insert(table, data).then(response => {
 *    console.log(response);
 *  }).catch(error=>{
 *    console.log(error);
 *  })
 * 
 * update
 * @param string table 
 * @param object data { column: value } 
 * @param string|array where
 * 
 *  db.update(table, data, where).then(response => {
 *    console.log(response);
 *  }).catch(err=>{
 *    console.log(err);
 *  })
 * 
 * delete
 * @param string table 
 * @param string|array where
 *    
 * db.delete(table, where).then(response => {
 *   console.log(response);
 * }).catch(error => {
 *   console.log(error);
 * })
 * 
 * 
 */
const myConfig = {
  host: 'localhost',
  user: 'db_user',
  password: 'db_password',
  database: 'db_name'
}
class Database {
  static logics() {
    return [
      'and',
      'or',
      'not'
    ]
  }
  static operators() {
    return [
      '=', 
      '<', 
      '>', 
      '<=', 
      '>=', 
      '<>', 
      '!=', 
      '<=>',
      'like', 
      'not like'
    ]
  }
  static connection() {return mysql.createConnection(myConfig)}
  static constructor(config = myConfig) {
  }

  static query(sql) {
    console.log(sql);

    return new Promise((resolve, reject) => {
      Database.connection().query(sql, (err, rows) => {
        console.log('connection open');
        Database.close()
        if (err) {
          return reject(err)
        }
        resolve(rows)
      });
    });
  }

  static close() {
    return new Promise((resolve, reject) => {
      Database.connection().end(err => {
        console.log('connection close');
        
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  static promise(data, error = null) {
    return new Promise((resolve, reject) => {
      if (error) {
        return reject(error)
      }
      resolve(data)
    });
  }

  static isEmpty(obj) {

    if (obj == null) return true;
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;
    if (typeof obj !== "object") return true;
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
  }

  static where(data) {
    if (Array.isArray(data)) {
      let wheres = []
      let length = data.length
      for (let row in data) {
        let column
        let operator
        let value
        let logic

        if (Array.isArray(data[row])) {
          [column, operator, value, logic] = data[row];
          if (Array.isArray(column)) {
            return Database.promise({}, JSON.stringify({
              errors: "wrong array, array must be of this type [['','','',''],['']]"
            }));
          }
          if (operator != null && Database.operators().includes(operator.trim()) === false) {
            value = operator
            operator = '='
          }
          if (operator == null) {
            operator = '!='
            value = '""'
          }

          if (Database.isEmpty(logic)) {
            logic = 'AND'
          }
          if (logic != null && Database.logics().includes(logic.trim()) === false) {
            'AND'
          }
          if (row == length - 1) {
            logic = '';
          }
          wheres.push(`${column} ${operator} '${value}' ${logic}`)
          // Database.where(column, operator, value, boolean)
        } else {
          return Database.promise({}, JSON.stringify({
            errors: "wrong array, array must be of this type [['','','',''],['']]"
          }));
        }

      }
      return wheres.join(' ')
    } else {
      return data
    }
  }
  static tableInfo(table){
    let errors = [];
    if (!table) {
      errors.push('no table name')
    }

    let sql = ''

    sql = `DESCRIBE ${table}`

    if (!Database.isEmpty(errors)) {
      return Database.promise({}, JSON.stringify({
        errors: errors
      }));
    }
    return Database.query(sql)
  }

  static select(table, select = '*', where = 1, limit = '') {
    let errors = [];
    if (!table) {
      errors.push('no table name')
    }
    if (Array.isArray(select)) {
      select = select.join()
    }
    if (limit !== '') {
      if (Array.isArray(limit)) {
        limit = limit.reverse().join()
      }
      limit = `LIMIT ${limit}`
    }
    where = Database.where(where)


    let sql = ''

    sql = `SELECT ${select} FROM ${table} WHERE ${where} ${limit}`

    if (!Database.isEmpty(errors)) {
      return Database.promise({}, JSON.stringify({
        errors: errors
      }));
    }
    return Database.query(sql)
  }

  static insert(table, data) {
    let errors = [];
    if (!table) {
      errors.push('no table name')
    }
    if (Database.isEmpty(data)) {
      errors.push('data empty')
    }

    let sql = ''
    let keys = []
    let vals = []

    for (let key in data) {
      keys.push(key)
      vals.push(`'${data[key]}'`)
    }
    sql = `INSERT INTO ${table} (${keys.join()}) VALUES (${vals})`

    if (!Database.isEmpty(errors)) {
      return Database.promise({}, JSON.stringify({
        errors: errors
      }));
    }
    return Database.query(sql)
  }

  static update(table, data, where = null) {
    let errors = [];
    if (where === null) {
      errors.push('where empty')
    } else {
      where = Database.where(where)
    }
    if (!table) {
      errors.push('no table name')
    }
    if (Database.isEmpty(data)) {
      errors.push('data empty')
    }

    let sql = ''
    let sets = []

    for (let key in data) {
      sets.push(`${key} = '${data[key]}'`)
    }
    sql = `UPDATE ${table} SET ${sets.join()} WHERE ${where}`

    if (!Database.isEmpty(errors)) {
      return Database.promise({}, {
        errors: errors
      });
    }
    return Database.query(sql)
  }
  static delete(table, where = null) {
    let errors = [];
    if (where === null) {
      errors.push('where empty')
    } else {
      where = Database.where(where)
    }
    if (!table) {
      errors.push('no table name')
    }

    let sql = ''

    sql = `DELETE FROM ${table} WHERE ${where}`

    if (!Database.isEmpty(errors)) {
      return Database.promise({}, {
        errors: errors
      });
    }
    return Database.query(sql)
  }
}
module.exports = Database
