/* =========================================================
   AVM PET SHOP
   FILE: js/auth-guard.js

   CHỨC NĂNG:
   - Kiểm tra trạng thái Firebase Authentication
   - Chặn người chưa đăng nhập vào trang chính
========================================================= */

"use strict";

import {
    auth
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/*
    Tạm ẩn trang trong lúc Firebase kiểm tra tài khoản.
    Tránh việc trang chủ hiện lên rồi mới chuyển trang.
*/

document.documentElement.classList.add(
    "auth-checking"
);


onAuthStateChanged(auth, (user) => {
    if (!user) {
        /*
            Chưa đăng nhập:
            chuyển sang trang đăng ký.
        */

        window.location.replace(
            "./register.html"
        );

        return;
    }


    /*
        Đã đăng nhập:
        cho phép hiển thị trang.
    */

    document.documentElement.classList.remove(
        "auth-checking"
    );
});