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
		res.render('clean', {
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
router.get('/detail/:itemId', function(req, res, next) {

	var query = new AV.Query(CleanItem);
	query.get(req.params.itemId).then(function(item) {
		// 成功获得实例
		// data 就是 id 为 57328ca079bc44005c2472d0 的 Todo 对象实例
		res.json(item);
	}, function(error) {
		// 失败了
	});

});
router.get('/getProPrice/:price/:count/:code', function(req, res) {
	var yPrice = req.params.price;
	var price = req.params.price;
	var count = req.params.count;
	var code = req.params.code;

	switch(count) {
		case "1":
			price = 0;
			break;
		case "2":
			price *= 0.1;
			break;
		case "3":
			price *= 0.15;
			break;
		default:
			price *= 0.25;
	}
	if(code == "free50" && (yPrice - price) > 100) {
		price += 50;
	}
	res.json({
		promotion: price
	});
})
router.get('/checkPromotion/:code', function(req, res) {

	if(req.params.code == "free50") {

		res.json({
			res: true,
			msg: "优惠了50元"
		})

	} else {

		res.json({
			res: false,
			msg: "不存在这个优惠码"
		})
	}
})

router.post('/order', function(req, res, next) {

	var choosedItems = req.body.choosedItems
	var itemsCount = new Array();
	var i;
	if(typeof(choosedItems) == "string") {
		choosedItems = [];
		choosedItems.push(req.body.choosedItems);
	}
	for(i in choosedItems) {
		var item = choosedItems[i];
		if(itemsCount[item] > 0) {
			itemsCount[item]++;
		} else {
			itemsCount[item] = 1;
		}
	}
	console.log(itemsCount);
	res.render('order', {
		items: itemsCount
	});
})

router.get('/order', function(req, res, next) {
	var query = new AV.Query(CleanItem);
	query.descending('ItemWT');
	query.find().then(function(results) {
		res.render('clean', {
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

router.post('/orderSubmit', function(req, res, next) {

	// 新建对象
	var cleanOrder = new CleanOrder;
	// 设置名称
	cleanOrder.set('Username', req.body.userName);
	cleanOrder.set('Useraddr', req.body.userAddr);
	cleanOrder.set('Userphone', req.body.phoneNumber);
	cleanOrder.set('Ordertime', req.body.orderTM);
	cleanOrder.set('ItemsAccount', req.body.itemCount);
	cleanOrder.set('Items', req.body.itemID);
	cleanOrder.set('Promotioncode', req.body.promotionCode);
	// 设置优先级
	cleanOrder.save().then(function(todo) {
		console.log('objectId is ' + todo.id);
		res.render('suc', {
			orderNo: todo.id
		});
	}, function(error) {
		console.log(error);
	});
})

//clean首页

module.exports = router;