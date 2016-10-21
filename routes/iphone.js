'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var Iphone = AV.Object.extend("IphoneGlass");
var WXPay = require('node-wxpay');
var fs = require("fs");
var weixin = require('../wechat/wechat.js');
var IphoneOrder = AV.Object.extend('iphoneOrder');

//clean首页
router.get('/', function(req, res, next) {
	var query = new AV.Query(Iphone);
	query.find().then(function(results) {
		res.render('chooseIphone', {
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

router.get('/detail/:itemId/:where', function(req, res, next) {

	var query = new AV.Query(Iphone);
	query.get(req.params.itemId).then(function(item) {
		// 成功获得实例
		// data 就是 id 为 57328ca079bc44005c2472d0 的 Todo 对象实例
		res.render('iPhoneDetail', {
			itemId: req.params.itemId,
			item: item,
			where: req.params.where
		});
	}, function(error) {
		// 失败了
	});

});

router.get('/pay', function(req, res, next) {
	var currentUser =  req.currentUser;
	if(currentUser) {
		// 跳转到首页
	} else {
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fcgi%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
		//currentUser 为空时，可打开用户注册界面…
	}

	var wxpay = WXPay({
		appid: 'wxe856936b8d520631',
		mch_id: '1396828302',
		partner_key: '7cS2iRIZpuI59OIIkpJ6E9vubuKI60Vs',
		pfx: fs.readFileSync('apiclient_cert.p12')
	});
	console.log("iphone's openid is :" + currentUser.get('authData').weixin.openid);
	wxpay.getBrandWCPayRequestParams({
		openid: currentUser.get('authData').weixin.openid,
		body: '公众号支付测试',
		detail: '公众号支付测试',
		out_trade_no: '20150331' + Math.random().toString().substr(2, 10),
		total_fee: 1,
		spbill_create_ip: '192.168.2.210',
		notify_url: 'http://wxpay_notify_url'
	}, function(err, result) {
		// in express
		res.render('pay', {
			payargs: JSON.stringify(result)
		})
	});
})

router.post('/takeOrder', function(req, res, next) {
	var currentUser =  req.currentUser;
	if(currentUser) {
		// 跳转到首页
	} else {
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fcgi%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
		//currentUser 为空时，可打开用户注册界面…
	}
	// 新建对象
	var iphoneOrder = new IphoneOrder;
	// 设置参数
	iphoneOrder.set('Username', req.body.userName);
	iphoneOrder.set('Useraddr', req.body.userAddr);
	iphoneOrder.set('Userphone', req.body.phoneNumber);
	iphoneOrder.set('Ordertime', req.body.orderTM);

	var query = new AV.Query(Iphone);
	query.get(req.body.itemId).then(function(item) {
		var whereDes = "内屏";
		if(req.body.where == 0) {
			iphoneOrder.set('price', item.get('innerGlassPrice'));

		} else {
			iphoneOrder.set('price', item.get('outerGlassPrice'));
			var whereDes = "外屏";
		}
		var des = item.get('name') + "换" + whereDes;
		iphoneOrder.set('des', des);
		iphoneOrder.save().then(function(order) {
			var relation = currentUser.relation('iphoneOrder');
			relation.add(order);
			currentUser.save().then(function(user) {}, function(err) {
				console.log("err:" + err)
			});
			res.render('suc', {
				orderId: order.id,
				orderTp: 1
			});
		}, function(error) {
			console.log(error);
		});
	}, function(error) {
		// 失败了
	});

	//查询真实价格

})

router.get('/suc', function(req, res, next) {

	res.render('suc');

});
//clean首页

module.exports = router;