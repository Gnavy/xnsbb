'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var clean = require('./routes/clean');
var repair = require('./routes/repair');
var flower = require('./routes/flower');
var iphone = require('./routes/iphone');
var WXPay = require('node-wxpay');
var fs = require("fs");
var AV = require('leanengine');
var wechat = require('./wechat/wechat');
var app = express();

var cache = require('memory-cache');

var wxpay = WXPay({
	appid: 'wxe856936b8d520631',
	mch_id: '1396828302',
	partner_key: '7cS2iRIZpuI59OIIkpJ6E9vubuKI60Vs',
	pfx: fs.readFileSync('apiclient_cert.p12')
});
Date.prototype.Format = function(fmt) { //author: meizz 
		var o = {
			"M+": this.getMonth() + 1, //月份 
			"d+": this.getDate(), //日 
			"h+": this.getHours(), //小时 
			"m+": this.getMinutes(), //分 
			"s+": this.getSeconds(), //秒 
			"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
			"S": this.getMilliseconds() //毫秒 
		};
		if(/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		for(var k in o)
			if(new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		return fmt;
	}
	// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(AV.Cloud.CookieSession({
	secret: 'xiaonengshoubangbang',
	maxAge: 3600000,
	fetchUser: true
}));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云函数定义
require('./cloud');
// 加载云引擎中间件
app.use(AV.express());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());

var Swiper = AV.Object.extend("Swiper");

app.get('/', function(req,res){
	res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fcgi%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect")
})

app.get('/cgi', function(req, res) {

	wechat.getWechatOpenid(req.query.code, function(data) {

		var body = JSON.parse(data);
		if(!body.errcode) {
			AV.User.signUpOrlogInWithAuthData({
				"openid": body.openid,
				"access_token": body.access_token,
				"expires_at": "2026-01-06T11:43:11.904Z"
			}, 'weixin').then(function(s) {
				cache.put(s.id,body.openid);
				res.saveCurrentUser(s);
				console.log("user is login :" + JSON.stringify(s));
				var query = new AV.Query(Swiper);
				query.descending('SwiperWT');
				query.find().then(function(results) {
					res.render('index', {
						swiper: results
					});
				}, function(err) {});
			}, function(e) {
				console.log(e)
				res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fcgi%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect")
			});
		} else {
			console.error(body.errcode);
		}
	});

});

app.get('/phone-bound', function(req, res) {
	res.render('phone-bound', {
		currentTime: new Date()
	});
});
app.get('/phone-verify', function(req, res) {
	res.render('phone-verify', {
		currentTime: new Date()
	});
});

app.get('/order', function(req, res) {
	res.render('clean', {
		currentTime: new Date()
	});
});
app.get("/user/requestSms/:phone", function(req, res) {

	var phone = req.params.phone;
	AV.Cloud.requestSmsCode(phone).then(function(success) {
		res.json({
			res: true
		});
	}, function(error) {
		res.json({
			res: false
		});
	});

});
app.get("/user/checkPhone/:phone/:code", function(req, res) {
	var phone = req.params.phone;
	var code = req.params.code;
	AV.Cloud.verifySmsCode(code, phone).then(function(success) {
		res.json({
			res: true
		});
	}, function(error) {
		res.json({
			res: false
		});
	});

});
app.get('/myorder', function(req, res) {

	res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fmyorder%2Fcgi%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect")
})
app.get("/myorder/cgi", function(req, res) {
	wechat.getWechatOpenid(req.query.code, function(data) {

		var body = JSON.parse(data);
		if(!body.errcode) {
			AV.User.signUpOrlogInWithAuthData({
				"openid": body.openid,
				"access_token": body.access_token,
				"expires_at": "2026-01-06T11:43:11.904Z"
			}, 'weixin').then(function(s) {
				res.saveCurrentUser(s);
				res.redirect("/myorder/do")
			}, function(e) {
				console.log(e)
				res.json("请用微信打开");
			});
		} else {

		}
	});

});

app.get('/myorder/do', function(req, res) {
	var currentUser = req.currentUser;
	if(!currentUser) {
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fmyorder%2Fcgi%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect")
	}
	var relation = currentUser.relation('iphoneOrder');
	var query = relation.query();
	var orders = [];
	query.find().then(function(results) {
		// results 是一个 AV.Object 的数组，它包含所有当前 todoFolder 的 tags
		for(var i in results) {

			var order = {
				userName: results[i].get('Username'),
				userAddr: results[i].get('Useraddr'),
				userPhone: results[i].get('Userphone'),
				orderNo: results[i].get('orderNo'),
				price: results[i].get('price'),
				des: results[i].get('des'),
				orderTm: results[i].get('Ordertime'),
				pay: results[i].get('payStatus'),
				tm: results[i].get('createdAt').Format("yyyy-MM-dd hh:mm:ss"),
				tp: "iPhone 换屏",
				payUrl: "/xnsbb/pay/" + results[i].id + "/1"
			}

			orders.push(order);
		}
		var relclean = currentUser.relation('CleanOrder');
		var queryclean = relclean.query();
		queryclean.find().then(function(resClean) {
			for(var i in resClean) {
				var order = {
					userName: resClean[i].get('Username'),
					userAddr: resClean[i].get('Useraddr'),
					userPhone: resClean[i].get('Userphone'),
					orderNo: resClean[i].get('orderNo'),
					price: resClean[i].get('price'),
					des: resClean[i].get('des'),
					orderTm: resClean[i].get('Ordertime'),
					pay: resClean[i].get('payStatus'),
					tm: resClean[i].get('createdAt').Format("yyyy-MM-dd hh:mm:ss"),
					tp: "大家电清洗",
					payUrl: "/xnsbb/pay/" + resClean[i].id + "/2"
				}

				orders.push(order);
			}
			res.render('myOrder', {
				orders: orders
			});
		});

	}, function(error) {
		console.error(error);
	});

})
app.get("/admin/order/:ordertp/:orderid/", function(req, res) {
	var orderId = req.params.orderid;
	var orderTp = req.params.ordertp;
	if(orderTp == 1) {
		var IphoneOrder = AV.Object.extend('iphoneOrder');
		var query = new AV.Query(IphoneOrder);
		query.get(orderId).then(function(order) {
			var order = {
				userName: order.get('Username'),
				userAddr: order.get('Useraddr'),
				userPhone: order.get('Userphone'),
				orderNo: order.get('orderNo'),
				price: order.get('price'),
				des: order.get('des'),
				orderTm: order.get('Ordertime'),
				pay: order.get('payStatus'),
				tm: order.get('createdAt').Format("yyyy-MM-dd hh:mm:ss"),
				tp: "iPhone 换屏",
				payUrl: "/xnsbb/pay/" + order.id + "/1"
			}
			res.render('adminOrder', {
				order: order
			});

		});
	} else if(orderTp == 2) {
		var CleanOrder = AV.Object.extend('CleanOrder');
		var query = new AV.Query(CleanOrder);
		query.get(orderId).then(function(order) {
			var order = {
				userName: order.get('Username'),
				userAddr: order.get('Useraddr'),
				userPhone: order.get('Userphone'),
				orderNo: order.get('orderNo'),
				price: order.get('price'),
				des: order.get('des'),
				orderTm: order.get('Ordertime'),
				pay: order.get('payStatus'),
				tm: order.get('createdAt').Format("yyyy-MM-dd hh:mm:ss"),
				tp: "iPhone 换屏",
				payUrl: "/xnsbb/pay/" + order.id + "/1"
			}
			res.render('adminOrder', {
				order: order
			});
		});
	}
});
app.get("/xnsbb/pay/:orderid/:ordertp", function(req, res) {

	var currentUser =  req.currentUser;
	if(!currentUser) {
		res.json({
			err: "未登录"
		});
	}
	var orderId = req.params.orderid;
	var orderTp = req.params.ordertp;

	if(orderTp == 1) {
		var IphoneOrder = AV.Object.extend('iphoneOrder');
		var query = new AV.Query(IphoneOrder);
		query.get(orderId).then(function(order) {
			wxpay.getBrandWCPayRequestParams({
				openid: cache.get(currentUser.id),
				body: '小能手帮帮服务订单',
				detail: order.get('des'),
				out_trade_no: order.get('orderNo'),
				//				total_fee: order.get('price') * 100,
				total_fee: 1,
				spbill_create_ip: "127.0.0.1",
				notify_url: 'https://xnsbb.leanapp.cn/1/wxpay/back'
			}, function(err, result) {
				// in express
				console.log("err:" + err + "res:" + JSON.stringify(result));
				res.json(result);
			});
		});
	} else if(orderTp == 2) {
		var CleanOrder = AV.Object.extend('CleanOrder');
		var query = new AV.Query(CleanOrder);
		query.get(orderId).then(function(order) {
			wxpay.getBrandWCPayRequestParams({
				openid: cache.get(currentUser.id),
				body: '小能手帮帮服务订单',
				detail: '大家电清洗',
				out_trade_no: order.get('orderNo'),
				//				total_fee: order.get('price') * 100,
				total_fee: 1,
				spbill_create_ip: "127.0.0.1",
				notify_url: 'https://xnsbb.leanapp.cn/2/wxpay/back'
			}, function(err, result) {
				// in express
				console.log("err:" + err + "res:" + JSON.stringify(result));
				res.json(result);
			});

		});
	}

})
app.use('/1/wxpay/back', wxpay.useWXCallback(function(msg, req, res, next) {
	// 处理商户业务逻辑

	if(msg.result_code == "SUCCESS") {
		var IphoneOrder = AV.Object.extend('iphoneOrder');
		var query = new AV.Query(IphoneOrder);
		query.equalTo('orderNo', Number(msg.out_trade_no));
		query.find().then(function(order) {
			order[0].set("payStatus", 1);
			order[0].set("status", 1);
			order[0].save().then(function(data) {
				// data 中的 results 是本次查询返回的结果，AV.Object 实例列表
				var adminQuery = new AV.Query('admin');

				adminQuery.find().then(function(admins) {
					for(var i in admins) {
						var msg = {
							"touser": admins[i].get("openid"),
							"template_id": "0mlONaVIx55kOny833H4X0TplRllwH7Z9qVrP-9l9YA",
							"url": "https://xnsbb.leanapp.cn/admin/order/1/" + data.id,
							"topcolor": "#FF0000",
							"data": {
								"first": {
									"value": order[0].get("des"),
									"color": "#173177"
								},
								"keyword1": {
									"value": order[0].get("orderNo"),
									"color": "#173177"
								},
								"keyword2": {
									"value": order[0].get("Username"),
									"color": "#173177"
								},
								"keyword3": {
									"value": order[0].get("price"),
									"color": "#173177"
								},
								"keyword4": {
									"value": "iPhone 换屏",
									"color": "#173177"
								},
								"keyword5": {
									"value": order[0].get("Ordertime"),
									"color": "#173177"
								},
								"remark": {
									"value": "电话:" + order[0].get("Userphone") + " 地址：" + order[0].get("Useraddr"),
									"color": "#173177"
								}
							}
						}
						wechat.sendMsgToAdmin(msg);
					}
					res.success();
				});

			}, function(error) {
				// 异常处理
				console.error(error);
				res.fail();
			});
		}, function(error) {
			// 异常处理
			console.error(error);
			res.fail();
		})
	}
	// res.success() 向微信返回处理成功信息，res.fail()返回失败信息。
}));

app.use('/2/wxpay/back', wxpay.useWXCallback(function(msg, req, res, next) {
	// 处理商户业务逻辑

	if(msg.result_code == "SUCCESS") {
		var CleanOrder = AV.Object.extend('CleanOrder');
		var query = new AV.Query(CleanOrder);
		query.equalTo('orderNo', Number(msg.out_trade_no));
		query.find().then(function(order) {
			order[0].set("payStatus", 1);
			order[0].set("status", 1);
			order[0].save().then(function(data) {
				// data 中的 results 是本次查询返回的结果，AV.Object 实例列表
				var adminQuery = new AV.Query('admin');

				adminQuery.find().then(function(admins) {
					for(var i in admins) {
						var msg = {
							"touser": admins[i].get("openid"),
							"template_id": "0mlONaVIx55kOny833H4X0TplRllwH7Z9qVrP-9l9YA",
							"url": "https://xnsbb.leanapp.cn/admin/order/2/" + data.id,
							"topcolor": "#FF0000",
							"data": {
								"first": {
									"value": order[0].get("des"),
									"color": "#173177"
								},
								"keyword1": {
									"value": order[0].get("orderNo"),
									"color": "#173177"
								},
								"keyword2": {
									"value": order[0].get("Username"),
									"color": "#173177"
								},
								"keyword3": {
									"value": order[0].get("price"),
									"color": "#173177"
								},
								"keyword4": {
									"value": "大家电清洗",
									"color": "#173177"
								},
								"keyword5": {
									"value": order[0].get("Ordertime"),
									"color": "#173177"
								},
								"remark": {
									"value": "电话:" + order[0].get("Userphone") + " 地址：" + order[0].get("Useraddr"),
									"color": "#173177"
								}
							}
						}
						wechat.sendMsgToAdmin(msg);
					}

					res.success();
				}, function(error) {});

			}, function(error) {
				// 异常处理
				console.error(error);
				res.fail();
			});
		}, function(error) {
			// 异常处理
			console.error(error);
			res.fail();
		})
	}
	// res.success() 向微信返回处理成功信息，res.fail()返回失败信息。
}));

app.get('/admin', function(req, res) {
	res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe856936b8d520631&redirect_uri=https%3A%2F%2Fxnsbb.leanapp.cn%2Fadmin%2Freg%2F&response_type=code&scope=snsapi_base&state=123#wechat_redirect")
})

app.get('/testMsg', function(req, res) {

})
app.get('/admin/reg/', function(req, res) {
	wechat.getWechatOpenid(req.query.code, function(data) {

		var body = JSON.parse(data);
		if(!body.errcode) {
			res.render('adminreg', {
				openid: body.openid
			});
		} else {
			console.log(e)
			res.json("请用微信打开");

		}
	});

});
app.get('/admin/doReg/', function(req, res) {

	if(req.query.pw == "123") {
		var Admin = AV.Object.extend('admin');
		var admin = new Admin;
		admin.set("openid", req.query.openid);
		admin.save().then(function(s) {
			res.json("成功了")
		}, function(e) {
			console.error(e)
			res.json("失败，系统错误")
		});

	} else {
		res.json("密码错误")
	}
});
app.get('/api/getWechatToken/', wechat.getWechatToken);
app.get('/api/getWechatJsapiTicket/', wechat.getWechatJsapiTicket);
app.get('/api/getWechatJsapiSign/', wechat.getWechatJsapiSign);
// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);
app.use("/clean", clean);
app.use("/repair", repair);
app.use("/flower", flower);
app.use("/iphone", iphone);

app.use(function(req, res, next) {
	// 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
	if(!res.headersSent) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	}
});

// error handlers
app.use(function(err, req, res, next) { // jshint ignore:line
	var statusCode = err.status || 500;
	if(statusCode === 500) {
		console.error(err.stack || err);
	}
	if(req.timedout) {
		console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
	}
	res.status(statusCode);
	// 默认不输出异常详情
	var error = {}
	if(app.get('env') === 'development') {
		// 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
		error = err;
	}
	res.render('error', {
		message: err.message,
		error: error
	});
});

module.exports = app;