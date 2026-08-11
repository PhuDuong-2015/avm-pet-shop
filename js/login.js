/* =========================================================
   AVM PET SHOP
   FILE: js/login.js
========================================================= */

"use strict";


/* =========================================================
   FIREBASE IMPORT
========================================================= */

import {
    auth,
    db
} from "./firebase-config.js";


import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   HTML ELEMENTS
========================================================= */

const loginForm =
    document.querySelector("#loginForm");

const loginEmailInput =
    document.querySelector("#loginEmail");

const loginPasswordInput =
    document.querySelector("#loginPassword");

const rememberLoginInput =
    document.querySelector("#rememberLogin");

const loginPasswordToggle =
    document.querySelector("#loginPasswordToggle");

const forgotPasswordButton =
    document.querySelector("#forgotPasswordButton");

const loginButton =
    document.querySelector("#loginButton");

const loginButtonText =
    document.querySelector("#loginButtonText");

const loginLoader =
    document.querySelector("#loginLoader");

const loginMessage =
    document.querySelector("#loginMessage");

const loginEmailError =
    document.querySelector("#loginEmailError");

const loginPasswordError =
    document.querySelector("#loginPasswordError");


/* =========================================================
   VALIDATION
========================================================= */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function clearFieldErrors() {
    loginEmailError.textContent = "";
    loginPasswordError.textContent = "";

    loginEmailInput.classList.remove("input-error");
    loginPasswordInput.classList.remove("input-error");
}


function validateLoginForm() {
    clearFieldErrors();

    const email =
        loginEmailInput.value.trim();

    const password =
        loginPasswordInput.value;

    let isValid = true;


    if (!isValidEmail(email)) {
        loginEmailError.textContent =
            "Vui lòng nhập email hợp lệ.";

        loginEmailInput.classList.add(
            "input-error"
        );

        isValid = false;
    }


    if (password.length < 6) {
        loginPasswordError.textContent =
            "Mật khẩu phải có ít nhất 6 ký tự.";

        loginPasswordInput.classList.add(
            "input-error"
        );

        isValid = false;
    }


    return isValid;
}


/* =========================================================
   MESSAGE
========================================================= */

function showLoginMessage(type, message) {
    loginMessage.textContent = message;

    loginMessage.classList.remove(
        "hidden",
        "auth-message-success",
        "auth-message-error"
    );

    loginMessage.classList.add(
        type === "success"
            ? "auth-message-success"
            : "auth-message-error"
    );
}


function hideLoginMessage() {
    loginMessage.classList.add("hidden");
}


/* =========================================================
   LOADING
========================================================= */

function setLoginLoading(isLoading) {
    loginButton.disabled = isLoading;

    loginButtonText.textContent =
        isLoading
            ? "Đang đăng nhập..."
            : "Đăng nhập";

    loginLoader.classList.toggle(
        "hidden",
        !isLoading
    );
}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getLoginErrorMessage(errorCode) {
    const messages = {
        "auth/invalid-email":
            "Email không đúng định dạng.",

        "auth/user-disabled":
            "Tài khoản này đã bị vô hiệu hóa.",

        "auth/user-not-found":
            "Không tìm thấy tài khoản.",

        "auth/wrong-password":
            "Mật khẩu không chính xác.",

        "auth/invalid-credential":
            "Email hoặc mật khẩu không chính xác.",

        "auth/too-many-requests":
            "Bạn đã thử quá nhiều lần. Hãy thử lại sau.",

        "auth/network-request-failed":
            "Không thể kết nối Firebase. Hãy kiểm tra Internet.",

        "auth/operation-not-allowed":
            "Email/Password chưa được bật trong Firebase."
    };

    return messages[errorCode] ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
}


/* =========================================================
   ĐỌC HỒ SƠ FIRESTORE
========================================================= */

async function getUserProfile(user) {
    try {
        const userReference =
            doc(db, "users", user.uid);

        const userSnapshot =
            await getDoc(userReference);

        if (userSnapshot.exists()) {
            return {
                uid: user.uid,
                email: user.email,
                ...userSnapshot.data()
            };
        }

        /*
            Trường hợp có tài khoản Authentication
            nhưng chưa có hồ sơ Firestore.
        */

        return {
            uid: user.uid,
            email: user.email,
            fullName:
                user.displayName ||
                "Thành viên AVM",
            role: "user",
            status: "active"
        };

    } catch (error) {
        console.error(
            "Không thể đọc hồ sơ Firestore:",
            error
        );

        return {
            uid: user.uid,
            email: user.email,
            fullName:
                user.displayName ||
                "Thành viên AVM",
            role: "user",
            status: "active"
        };
    }
}


/* =========================================================
   ĐĂNG NHẬP
========================================================= */

async function loginUser(event) {
    event.preventDefault();

    hideLoginMessage();

    if (!validateLoginForm()) {
        return;
    }

    setLoginLoading(true);


    const email =
        loginEmailInput.value
            .trim()
            .toLowerCase();

    const password =
        loginPasswordInput.value;


    try {
        /*
            Ghi nhớ:
            - Có chọn: duy trì khi đóng trình duyệt.
            - Không chọn: chỉ giữ trong tab hiện tại.
        */

        const persistence =
            rememberLoginInput.checked
                ? browserLocalPersistence
                : browserSessionPersistence;

        await setPersistence(
            auth,
            persistence
        );


        /*
            Đăng nhập Firebase Authentication.
        */

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            userCredential.user;


        /*
            Đọc hồ sơ trong Firestore.
        */

        const userProfile =
            await getUserProfile(user);


        if (userProfile.status === "disabled") {
            throw new Error(
                "account-disabled"
            );
        }


        /*
            Lưu thông tin cơ bản phục vụ giao diện.
            Firebase Auth vẫn là nguồn xác thực chính.
        */

        localStorage.setItem(
            "avmCurrentUser",
            JSON.stringify({
                uid: userProfile.uid,
                fullName: userProfile.fullName,
                email: userProfile.email,
                role: userProfile.role || "user",
                status:
                    userProfile.status || "active"
            })
        );


        showLoginMessage(
            "success",
            "Đăng nhập thành công! Đang chuyển trang..."
        );


        /*
            Admin vào admin.html.
            User thông thường về index.html.
        */

        window.setTimeout(() => {
            if (userProfile.role === "admin") {
                window.location.replace(
                    "./admin.html"
                );

                return;
            }

            window.location.replace(
                "./index.html"
            );
        }, 1100);

    } catch (error) {
        console.error(
            "Firebase login error:",
            error
        );

        if (error.message === "account-disabled") {
            showLoginMessage(
                "error",
                "Tài khoản của bạn đã bị khóa."
            );

            return;
        }

        showLoginMessage(
            "error",
            getLoginErrorMessage(error.code)
        );

    } finally {
        setLoginLoading(false);
    }
}


/* =========================================================
   QUÊN MẬT KHẨU
========================================================= */

async function resetPassword() {
    hideLoginMessage();
    clearFieldErrors();

    const email =
        loginEmailInput.value
            .trim()
            .toLowerCase();


    if (!isValidEmail(email)) {
        loginEmailError.textContent =
            "Hãy nhập email trước khi đặt lại mật khẩu.";

        loginEmailInput.classList.add(
            "input-error"
        );

        loginEmailInput.focus();

        return;
    }


    forgotPasswordButton.disabled = true;
    forgotPasswordButton.textContent =
        "Đang gửi...";


    try {
        await sendPasswordResetEmail(
            auth,
            email
        );

        showLoginMessage(
            "success",
            "Firebase đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư."
        );

    } catch (error) {
        console.error(
            "Password reset error:",
            error
        );

        showLoginMessage(
            "error",
            getLoginErrorMessage(error.code)
        );

    } finally {
        forgotPasswordButton.disabled = false;
        forgotPasswordButton.textContent =
            "Quên mật khẩu?";
    }
}


/* =========================================================
   HIỆN / ẨN MẬT KHẨU
========================================================= */

loginPasswordToggle?.addEventListener(
    "click",
    () => {
        const isHidden =
            loginPasswordInput.type ===
            "password";

        loginPasswordInput.type =
            isHidden
                ? "text"
                : "password";

        loginPasswordToggle.textContent =
            isHidden
                ? "Ẩn"
                : "Hiện";
    }
);


/* =========================================================
   XÓA LỖI KHI NHẬP
========================================================= */

loginEmailInput?.addEventListener(
    "input",
    () => {
        loginEmailError.textContent = "";
        loginEmailInput.classList.remove(
            "input-error"
        );

        hideLoginMessage();
    }
);


loginPasswordInput?.addEventListener(
    "input",
    () => {
        loginPasswordError.textContent = "";
        loginPasswordInput.classList.remove(
            "input-error"
        );

        hideLoginMessage();
    }
);


/* =========================================================
   SỰ KIỆN
========================================================= */

loginForm?.addEventListener(
    "submit",
    loginUser
);


forgotPasswordButton?.addEventListener(
    "click",
    resetPassword
);


/* =========================================================
   KIỂM TRA PHIÊN ĐĂNG NHẬP HIỆN TẠI
========================================================= */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return;
    }

    /*
        Nếu người dùng đã đăng nhập rồi nhưng vẫn mở login.html,
        có thể tự động chuyển họ về đúng trang.
    */

    const userProfile =
        await getUserProfile(user);

    localStorage.setItem(
        "avmCurrentUser",
        JSON.stringify({
            uid: userProfile.uid,
            fullName: userProfile.fullName,
            email: userProfile.email,
            role: userProfile.role || "user",
            status: userProfile.status || "active"
        })
    );

    if (userProfile.role === "admin") {
        window.location.replace(
            "./admin.html"
        );

        return;
    }

    window.location.replace(
        "./index.html"
    );
});