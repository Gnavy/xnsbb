function checkMobile(phoneNumber) {
	var sMobile = phoneNumber;
	if (!(/^1[3|4|5|7|8][0-9]\d{8}$/.test(sMobile))) {
		return false;
	} else {

		return true;
	}

}
function escape2Html(str) {
 var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
 return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}