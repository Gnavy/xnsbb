function checkMobile(phoneNumber) {
	var sMobile = phoneNumber;
	if (!(/^1[3|4|5|7|8][0-9]\d{8}$/.test(sMobile))) {
		return false;
	} else {

		return true;
	}

}