/**
 * 页面服务
 **/
'use strict';

let mongoose = require('mongoose');
let _ = require('lodash');
let Page = mongoose.model('Page');


let Base = require('./base');

class Service extends Base {
  constructor(props) {
    super(props);
    this.Model = Page;
  }

  findBySome(id, populates) {
    return new Promise((resolve, reject) => {
      let query = this.Model.findById(id)
      if (populates && populates.length > 0) {
        populates.forEach(function (item) {
          query = query.populate(item);
        })
      }
      query.exec(function (err, result) {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      });
    })
  }
}

module.exports = Service;
