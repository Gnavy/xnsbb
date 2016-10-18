'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var CleanItem = AV.Object.extend("CleanItem");

var CleanOrder = AV.Object.extend('CleanOrder');

//clean首页
router.get('/', function(req, res, next) {
	var query = new AV.Query(CleanItem);
	query.descending('ItemWT');
	query.find().then(function(results) {
		res.render('flower', {
			items: results
		});
	}, function(err) {
		if(err.code === 101) {
			// 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
			// 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
			res.render('todos', {
				title: 'clean',
				todos: []
			});
		} else {
			next(err);
		}
	}).catch(next);
});
//clean首页


//clean首页

module.exports = router;