/* ==================================================
   DỰ ÁN CUỐI KHÓA - AVM PET SHOP
   FILE: js/main.js
================================================== */

"use strict";


/* ==================================================
   1. LẤY CÁC PHẦN TỬ CẦN DÙNG
================================================== */

const header = document.querySelector("#header");
const menuButton = document.querySelector("#menuButton");
const navbar = document.querySelector("#navbar");
const navLinks = document.querySelectorAll(".nav-link");
const currentYear = document.querySelector("#currentYear");


/* ==================================================
   2. HIỂN THỊ NĂM HIỆN TẠI Ở FOOTER
================================================== */

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


/* ==================================================
   3. HIỆU ỨNG HEADER KHI CUỘN
================================================== */

function handleHeaderScroll() {
    if (!header) {
        return;
    }

    if (window.scrollY > 40) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

window.addEventListener("scroll", handleHeaderScroll);

handleHeaderScroll();


/* ==================================================
   4. MENU MOBILE
================================================== */

function openMobileMenu() {
    if (!menuButton || !navbar) {
        return;
    }

    navbar.classList.add("open");
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.textContent = "✕";
}


function closeMobileMenu() {
    if (!menuButton || !navbar) {
        return;
    }

    navbar.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "☰";
}


function toggleMobileMenu() {
    if (!navbar) {
        return;
    }

    const isOpen = navbar.classList.contains("open");

    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}


if (menuButton) {
    menuButton.addEventListener("click", toggleMobileMenu);
}


/* ==================================================
   5. ĐÓNG MENU SAU KHI BẤM LINK
================================================== */

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        closeMobileMenu();
    });
});


/* ==================================================
   6. ĐÓNG MENU KHI BẤM RA NGOÀI
================================================== */

document.addEventListener("click", (event) => {
    if (!navbar || !menuButton) {
        return;
    }

    const clickedInsideNavbar = navbar.contains(event.target);
    const clickedMenuButton = menuButton.contains(event.target);

    if (!clickedInsideNavbar && !clickedMenuButton) {
        closeMobileMenu();
    }
});


/* ==================================================
   7. ĐÓNG MENU KHI PHÓNG TO MÀN HÌNH
================================================== */

window.addEventListener("resize", () => {
    if (window.innerWidth > 1050) {
        closeMobileMenu();
    }
});


/* ==================================================
   8. HIỆU ỨNG XUẤT HIỆN KHI CUỘN
================================================== */

const revealItems = document.querySelectorAll(
    ".project-card, .category-card, .feature-card, .cta-container"
);


revealItems.forEach((item) => {
    item.classList.add("reveal");
});


const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        });
    },
    {
        threshold: 0.15
    }
);


revealItems.forEach((item) => {
    revealObserver.observe(item);
});


/* ==================================================
   9. HIỆU ỨNG XUẤT HIỆN LẦN LƯỢT
================================================== */

function applyStaggerDelay(selector) {
    const items = document.querySelectorAll(selector);

    items.forEach((item, index) => {
        item.style.transitionDelay = `${index * 80}ms`;
    });
}


applyStaggerDelay(".project-card");
applyStaggerDelay(".category-card");
applyStaggerDelay(".feature-card");


/* ==================================================
   10. CHÀO NGƯỜI DÙNG THEO THỜI GIAN
================================================== */

const welcomeMessage = document.querySelector("#welcomeMessage");


function getWelcomeMessage() {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 11) {
        return "Chào buổi sáng, Pet Lover!";
    }

    if (currentHour >= 11 && currentHour < 18) {
        return "Chào buổi chiều, Pet Lover!";
    }

    return "Chào buổi tối, Pet Lover!";
}


if (welcomeMessage) {
    welcomeMessage.textContent = getWelcomeMessage();
}


/* ==================================================
   11. LƯU TRẠNG THÁI NGƯỜI DÙNG GIẢ LẬP
================================================== */

const demoUser = {
    name: "Pet Lover",
    role: "guest",
    loggedIn: false
};


localStorage.setItem(
    "avmDemoUser",
    JSON.stringify(demoUser)
);


/* ==================================================
   12. KIỂM TRA DỮ LIỆU LOCAL STORAGE
================================================== */

function getStoredUser() {
    const storedUser = localStorage.getItem("avmDemoUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Không thể đọc dữ liệu người dùng:", error);
        return null;
    }
}


const storedUser = getStoredUser();

console.log("AVM Pet Shop user:", storedUser);


/* ==================================================
   13. HIỆU ỨNG NÚT HỖ TRỢ
================================================== */

const supportButton = document.querySelector(".support-floating");


if (supportButton) {
    supportButton.addEventListener("mouseenter", () => {
        supportButton.setAttribute(
            "title",
            "Mở trang Pet Support"
        );
    });
}


/* ==================================================
   14. KIỂM TRA CÁC FILE TRANG KHÁC
================================================== */

const pageLinks = document.querySelectorAll(
    'a[href$=".html"]'
);


pageLinks.forEach((link) => {
    link.addEventListener("click", () => {
        const destination = link.getAttribute("href");

        console.log(
            `Đang chuyển đến: ${destination}`
        );
    });
});


/* ==================================================
   15. THÔNG BÁO TRANG ĐÃ SẴN SÀNG
================================================== */

document.addEventListener("DOMContentLoaded", () => {
    console.log(
        "Dự án cuối khóa AVM Pet Shop đã tải thành công."
    );
});