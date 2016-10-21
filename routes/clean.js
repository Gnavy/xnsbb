'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var CleanItem = AV.Object.extend("CleanItem");

var CleanOrder = AV.Object.extend('CleanOrder');

var nowPromoCode = "free30";

var nowProm = 30;


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
	if(code == nowPromoCode && (yPrice - price) > 100) {
		price += nowProm;
	}
	res.json({
		promotion: price
	});
})
router.get('/checkPromotion/:code', function(req, res) {

	if(req.params.code == nowPromoCode) {

		res.json({
			res: true,
			msg: "优惠了" + nowProm + "元"
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
	var currentUser =  req.currentUser;
	console.log("now order user:"+JSON.stringify(currentUser));
	if(currentUser) {
		// 跳转到首页
	} else {
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fcgi%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
		//currentUser 为空时，可打开用户注册界面…
	}
	// 新建对象
	var cleanOrder = new CleanOrder;
	var allPrice = 0;
	var allCount = 0;
	var price = 0;
	// 设置名称
	cleanOrder.set('Username', req.body.userName);
	cleanOrder.set('Useraddr', req.body.userAddr);
	cleanOrder.set('Userphone', req.body.phoneNumber);
	cleanOrder.set('Ordertime', req.body.orderTM);

	cleanOrder.set('Promotioncode', req.body.promotionCode);
	// 设置优先级
	var cql = "";
	var cqlItem = JSON.stringify(req.body.itemID);
	cqlItem = cqlItem.replace("[", "(");
	cqlItem = cqlItem.replace("]", ")");
	if(typeof(req.body.itemID) == "string") {
		cleanOrder.set('ItemsAccount', [req.body.itemCount]);
		cleanOrder.set('Items', [req.body.itemID]);
		var cql = 'select * from CleanItem where objectId = ' + JSON.stringify(req.body.itemID);
	} else {
		var cql = 'select * from CleanItem where objectId in ' + cqlItem;
		cleanOrder.set('ItemsAccount', req.body.itemCount);
		cleanOrder.set('Items', req.body.itemID);
	}

	AV.Query.doCloudQuery(cql).then(function(data) {

		// results 即为查询结果，它是一个 AV.Object 数组
		var results = data.results;
		var des = "";
		for(var i in results) {
			var result = results[i];
			allPrice += result.get("ItemPRI") * req.body.itemCount[i];
			allCount += Number(req.body.itemCount[i]);

			des += result.get("ItemNM") + " X " + req.body.itemCount[i] + "台/";
		}
		price = allPrice;
		switch(Number(allCount)) {
			case 1:
				price = 0;
				break;
			case 2:
				price *= 0.1;
				break;
			case 3:
				price *= 0.15;
				break;
			default:
				price *= 0.25;
		}
		allPrice -= price;
		if(req.body.promotionCode == nowPromoCode && (allPrice - price) > 100) {
			allPrice -= nowProm;
		}
		cleanOrder.set('price', Number(allPrice));
		cleanOrder.set('des', des);
		console.log("Clean customer's openid is :" + currentUser.get('authData').weixin.openid);
		cleanOrder.save().then(function(order) {
			var relation = currentUser.relation('CleanOrder');
			relation.add(order);
			currentUser.save().then(function(user) {

			}, function(err) {
				console.error("err:" + err)
			});
			res.render('suc', {
				orderId: order.id,
				orderTp: 2
			});

		}, function(error) {
			console.error(error);
		});
	}, function(error) {
		console.error(error);
	});

})

//clean首页

module.exports = router;