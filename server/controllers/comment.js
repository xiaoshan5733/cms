'use strict';
var mongoose = require('mongoose'),
    Comment = mongoose.model('Comment'),
    util = require('../libs/util');
//列表
exports.list = function(req, res) {
    var condition = {};
    if(req.Roles && req.Roles.indexOf('admin') < 0) {
        condition.author = req.session.user._id;
    }
    Comment.count(condition, function(err, total) {
        var query = Comment.find(condition).populate('author').populate('from');
        //分页
        var pageInfo = util.createPage(req, total, 10);
        //console.log(pageInfo);
        query.skip(pageInfo.start);
        query.limit(pageInfo.pageSize);
        query.sort({created: -1});
        query.exec(function(err, results) {
            //console.log(err, results);
            res.render('server/comment/list', {
                //title: '列表',
                comments: results,
                pageInfo: pageInfo
            });
        })
    })
    
};
//单条
exports.one = function(req, res) {
    var id = req.param('id');
    Comment.findById(id).populate('author', 'username name email').populate('from').exec(function(err, result) {
        console.log(result);
        if(!result) {
            return res.render('server/message', {
                msg: '该评论不存在'
            });
        }
        res.render('server/comment/item', {
            title: result.name,
            comment: result
        });
    });
};
//删除
exports.del = function(req, res) {
    if(!req.session.user) {
        return res.render('server/message', {
            msg: '请先登录'
        });
    }
    var id = req.params.id;
    Comment.findById(id).populate('author').exec(function(err, result) {
        if(!result) {
            return res.render('server/message', {
                msg: '评论不存在'
            });
        }
        console.log(result)
        //if(!result.author || result.author._id == req.session.user._id) {
            result.remove(function(err) {
                if(err) {
                    return res.render('server/message', {
                        msg: '删除失败222'
                    });
                }
                res.render('server/message', {
                    msg: '删除成功'
                })
            });
        /*}else {
            return res.render('server/message', {
                msg: '你没有权限删除别人的评论'
            });
        }*/
    });
};