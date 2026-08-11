import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginNavLink =
    document.querySelector("#loginNavLink");

const registerNavLink =
    document.querySelector("#registerNavLink");

const adminPageLink =
    document.querySelector("#adminPageLink");

const userMenu =
    document.querySelector("#userMenu");

const userNameElement =
    document.querySelector("#userName");

const logoutButton =
    document.querySelector("#logoutButton");


/* =========================================================
   LOCAL STORAGE KEY
========================================================= */

const CURRENT_USER_KEY =
    "avmCurrentUser";


/* =========================================================
   HIDE GUEST LINKS
========================================================= */

function hideGuestLinks() {

    loginNavLink?.classList.add(
        "hidden"
    );

    registerNavLink?.classList.add(
        "hidden"
    );

}


/* =========================================================
   SHOW GUEST LINKS
========================================================= */

function showGuestLinks() {

    loginNavLink?.classList.remove(
        "hidden"
    );

    registerNavLink?.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE USER INTERFACE
========================================================= */

function hideUserInterface() {

    /*
        User chưa đăng nhập
    */

    showGuestLinks();


    /* USER MENU */

    userMenu?.classList.add(
        "hidden"
    );


    /* ADMIN LINK */

    adminPageLink?.classList.add(
        "hidden"
    );


    /* RESET USER NAME */

    if (userNameElement) {

        userNameElement.textContent =
            "Thành viên AVM";

    }


    /* LOCAL STORAGE */

    localStorage.removeItem(
        CURRENT_USER_KEY
    );

}


/* =========================================================
   SHOW USER INTERFACE
========================================================= */

function showUserInterface(
    firebaseUser,
    profile
) {

    /*
        User đã đăng nhập
    */

    hideGuestLinks();


    /* =====================================================
       SHOW USER MENU
    ====================================================== */

    userMenu?.classList.remove(
        "hidden"
    );


    /* =====================================================
       USER NAME
    ====================================================== */

    if (userNameElement) {

        const displayName =
            profile?.fullName ||
            profile?.name ||
            firebaseUser?.displayName ||
            firebaseUser?.email ||
            "Thành viên AVM";


        userNameElement.textContent =
            displayName;

    }


    /* =====================================================
       ADMIN LINK
    ====================================================== */

    const role =
        profile?.role || "user";


    if (adminPageLink) {

        if (role === "admin") {

            adminPageLink.classList.remove(
                "hidden"
            );

        } else {

            adminPageLink.classList.add(
                "hidden"
            );

        }

    }


    /* =====================================================
       SAVE SESSION INFO
    ====================================================== */

    const currentUserData = {

        uid:
            firebaseUser?.uid || "",

        email:
            firebaseUser?.email || "",

        fullName:
            profile?.fullName ||
            profile?.name ||
            "",

        role:
            role

    };


    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(
            currentUserData
        )
    );

}


/* =========================================================
   GET USER PROFILE FROM FIRESTORE
========================================================= */

async function getUserProfile(
    firebaseUser
) {

    if (!firebaseUser?.uid) {

        return {
            role: "user"
        };

    }


    try {

        const userRef =
            doc(
                db,
                "users",
                firebaseUser.uid
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (
            userSnapshot.exists()
        ) {

            return {
                id:
                    userSnapshot.id,

                ...userSnapshot.data()
            };

        }


        /*
            Nếu Auth có user nhưng Firestore
            chưa có document tương ứng
        */

        return {

            uid:
                firebaseUser.uid,

            email:
                firebaseUser.email || "",

            fullName:
                firebaseUser.displayName || "",

            role:
                "user"

        };


    } catch (error) {

        console.error(
            "Không thể đọc hồ sơ người dùng:",
            error
        );


        /*
            Nếu Firestore lỗi,
            vẫn cho user đăng nhập nhưng
            mặc định role user.

            Tuyệt đối không mặc định admin.
        */

        return {

            uid:
                firebaseUser.uid,

            email:
                firebaseUser.email || "",

            fullName:
                firebaseUser.displayName || "",

            role:
                "user"

        };

    }

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async (firebaseUser) => {

        /*
            =============================================
            CHƯA ĐĂNG NHẬP
            =============================================
        */

        if (!firebaseUser) {

            hideUserInterface();

            return;

        }


        /*
            =============================================
            ĐÃ ĐĂNG NHẬP
            =============================================
        */

        try {

            const profile =
                await getUserProfile(
                    firebaseUser
                );


            showUserInterface(
                firebaseUser,
                profile
            );


        } catch (error) {

            console.error(
                "Lỗi xử lý phiên đăng nhập:",
                error
            );


            /*
                Fallback:
                vẫn cho hiện user menu
                với quyền user
            */

            showUserInterface(
                firebaseUser,
                {
                    role: "user"
                }
            );

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            /*
                Ngăn bấm logout nhiều lần
            */

            logoutButton.disabled =
                true;


            const oldText =
                logoutButton.textContent;


            logoutButton.textContent =
                "Đang đăng xuất...";


            try {

                await signOut(
                    auth
                );


                /*
                    Dọn session local
                */

                localStorage.removeItem(
                    CURRENT_USER_KEY
                );


                /*
                    Về trang login
                */

                window.location.href =
                    "./login.html";


            } catch (error) {

                console.error(
                    "Đăng xuất thất bại:",
                    error
                );


                logoutButton.disabled =
                    false;


                logoutButton.textContent =
                    oldText ||
                    "Đăng xuất";

            }

        }
    );

}