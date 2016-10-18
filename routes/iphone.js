'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var Iphone = AV.Object.extend("IphoneGlass");
var fs = require("fs");
var weixin = require('../wechat/wechat.js');

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
			item: item,
			where: req.params.where
		});
	}, function(error) {
		// 失败了
	});

});

router.get('/pay', function(req, res, next) {

//		var wxpay = WXPay({
//			appid: 'wxe856936b8d520631',
//			mch_id: '1396828302',
//			partner_key: '7cS2iRIZpuI59OIIkpJ6E9vubuKI60Vs',
//			pfx: fs.readFileSync('apiclient_cert.p12')
//		});
//
//		wxpay.createUnifiedOrder({
//			body: '扫码支付测试',
//			out_trade_no: '20160703' + Math.random().toString().substr(2, 10),
//			total_fee: 1,
//			spbill_create_ip: '192.168.2.210',
//			notify_url: 'http://wxpay_notify_url',
//			trade_type: 'NATIVE',
//			product_id: '1234567890'
//		}, function(err, result) {
//			console.log(result);
//		});
//
//		var url = wxpay.createMerchantPrepayUrl({
//			product_id: '123456'
//		});
		
		res.json(weixin.getWechatToken) ;
	})
	//clean首页

module.exports = router;