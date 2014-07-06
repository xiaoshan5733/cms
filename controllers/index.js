'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Role = mongoose.model('Role'),
    userController = require('./user'),
    config = require('../../config'),
    core = require('../../libs/core');

//后台首页
exports.index = function(req, res) {
    if(req.session.user) {
        res.render('server/index', { title: 'CMS系统' });
    } else {
        var path = core.translateAdminDir('/user/login');
        return res.redirect(path);
    }
};
//管理员资料
exports.me = function(req, res) {
    if(!req.session.user) {
        var path = core.translateAdminDir('/user/login');
        return res.redirect(path);
    }
    var id = req.session.user._id;
    User.findById(id).populate('roles').exec(function(err, user) {
        user._roles = req.Roles;
        user._actions = req.Actions;
        res.render('server/me', {
            title: '我的资料',
            user: user
        });
    }); 
};
//修改密码
exports.updatePassword = function(req, res) {
    if(req.method === 'GET') {

    } else if(req.method === 'POST') {
        var obj = req.body;
        var oldPassword = obj.oldpassword;
        var password = obj.password;
        var id = req.session.user._id;
        User.findById(id).exec(function(err, user) {
            if (user.authenticate(oldPassword)) {
                user.password = password;
                user.save(function(err, result) {
                    //console.log('fffffffffffff', result);
                    userController.reload(result._id, function(err, user) {
                        req.session.user = user;
                        res.locals.User = user;
                        res.render('server/message', {
                            msg: '密码修改成功'
                        });
                    });
                    /*req.session.user = result;
                    res.locals.User = result;
                    res.render('server/message', {
                        msg: '密码修改成功'
                    });*/
                });
            } else {
                res.render('server/message', {
                    msg: '原密码不正确'
                });
            }
        });
    }
};
exports.checkInstall = function(req, res, next) {
    if(req.session.user) {
        var path = core.translateAdminDir('/index');
        return res.redirect(path);
    }
    if(req.path.indexOf('/user/login') > -1 || req.path.indexOf('/user/login') > -1) {
        return next();
    }
    User.find({}, function(err, results) {
        if(err) {
            return;
        }
        if(results.length > 0) {
            var path = core.translateAdminDir('/user/login');
            return res.redirect(path);
        } else {
            var path = core.translateAdminDir('/index/install');
            return res.redirect(path);
        }
        next();
    })
}
//初始化后台,安装初始数据
exports.install = function(req, res) {
    if(req.session.user) {
        var path = core.translateAdminDir('/index');
        return res.redirect(path);
    }
    //检查是否已经有用户
    User.find({}, function(err, results) {
        console.log(err, results);
        if(err) {
            return;
        }
        if(results.length < 1) {
            //满足条件
            if(req.method === 'GET') {
                res.render('server/install', {
                    title: '初始化'
                });
            } else if(req.method === 'POST') {
                var createUser = function(obj) {
                    var user = new User(obj);
                    user.save(function() {
                        res.render('server/message', {
                            msg: '初始化完成'
                        });
                    });
                };
                var obj = req.body;
                obj.status = 101;//系统默认管理员
                //检查是否有角色，没有的话创建
                Role.find({status: 201}, function(err, roles) {
                    console.log('查找role', err, roles)
                    if(roles.length < 1) {
                        console.log('没有角色 ' + config.admin.role.admin);
                        var role = new Role({
                            name: config.admin.role.admin,
                            actions: [],
                            status: 201//系统默认管理员角色
                        });
                        role.save(function(err, result) {
                            console.log('role result', result);
                            obj.roles = [role._id];
                            createUser(obj);
                        });
                        //创建普通角色
                        new Role({
                            name: config.admin.role.user,
                            actions: [],
                            status: 202//系统默认用户角色
                        }).save();
                    }else{
                        obj.roles = [roles[0]._id];
                        createUser(obj);
                    }
                })
            }
        }else{
            //已经初始化过，跳过
            var path = core.translateAdminDir('/index');
            res.redirect(path);
        }
    })
};