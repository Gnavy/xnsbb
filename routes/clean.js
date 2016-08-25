'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var CleanItem = AV.Object.extend("CleanItem");

//clean首页
router.get('/', function(req, res, next) {
	var query = new AV.Query(CleanItem);
	query.descending('ItemWT');
	query.find().then(function(results) {
		res.render('clean', {
			items: results
		});
	}, function(err) {
		if (err.code === 101) {
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
router.get('/detail/:itemId', function(req, res, next) {

	var query = new AV.Query(CleanItem);
	query.get(req.params.itemId).then(function(item) {
		// 成功获得实例
		// data 就是 id 为 57328ca079bc44005c2472d0 的 Todo 对象实例
		res.render('clean-detail', {
			item:item
		});
	}, function(error) {
		// 失败了
	});

});

module.exports = router;