"use strict";

import {
    db
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   TỰ ĐỘNG XÁC ĐỊNH TAG THEO NỘI DUNG SẢN PHẨM
========================================================= */

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


function detectSupportTags(product) {
    const text = normalizeText([
        product.name,
        product.category,
        product.description,
        product.shortDescription,
        product.benefit,
        product.usage
    ].join(" "));

    const tags = new Set();


    /* =========================
       DIGESTIVE
    ========================= */

    if (
        text.includes("tieu hoa") ||
        text.includes("duong ruot") ||
        text.includes("enzyme") ||
        text.includes("probiotic") ||
        text.includes("gut") ||
        text.includes("digestive")
    ) {
        tags.add("digestive");
    }


    /* =========================
       NUTRITION
    ========================= */

    if (
        text.includes("vitamin") ||
        text.includes("khoang") ||
        text.includes("dinh duong") ||
        text.includes("dien giai") ||
        text.includes("tang trong") ||
        text.includes("nutrition") ||
        text.includes("growth")
    ) {
        tags.add("nutrition");
    }


    /* =========================
       RESPIRATORY
    ========================= */

    if (
        text.includes("ho hap") ||
        text.includes("ho") ||
        text.includes("phoi") ||
        text.includes("respiratory")
    ) {
        tags.add("respiratory");
    }


    /* =========================
       SKIN
    ========================= */

    if (
        text.includes("da") ||
        text.includes("long") ||
        text.includes("skin") ||
        text.includes("shampoo")
    ) {
        tags.add("skin");
    }


    /* =========================
       ENVIRONMENT
    ========================= */

    if (
        text.includes("moi truong") ||
        text.includes("nguon nuoc") ||
        text.includes("sat trung") ||
        text.includes("clo2") ||
        text.includes("water") ||
        text.includes("environment")
    ) {
        tags.add("environment");
    }


    /* =========================
       JOINT
    ========================= */

    if (
        text.includes("canxi") ||
        text.includes("calcium") ||
        text.includes("xuong") ||
        text.includes("khop") ||
        text.includes("joint")
    ) {
        tags.add("joint");
    }


    return Array.from(tags);
}


function detectAnimals(product) {
    const text = normalizeText([
        product.name,
        product.category,
        product.description,
        product.shortDescription,
        product.benefit,
        product.usage
    ].join(" "));

    const animals = new Set();


    if (
        text.includes("cho") ||
        text.includes("dog")
    ) {
        animals.add("dog");
    }


    if (
        text.includes("meo") ||
        text.includes("cat")
    ) {
        animals.add("cat");
    }


    if (
        text.includes("ga") ||
        text.includes("gia cam") ||
        text.includes("poultry")
    ) {
        animals.add("poultry");
    }


    if (
        text.includes("heo") ||
        text.includes("lon") ||
        text.includes("pig")
    ) {
        animals.add("pig");
    }


    if (
        text.includes("tom") ||
        text.includes("ca") ||
        text.includes("thuy san") ||
        text.includes("aquaculture")
    ) {
        animals.add("aquaculture");
    }


    /*
        Nếu không xác định được vật nuôi,
        cho phép dùng chung.
    */

    if (animals.size === 0) {
        animals.add("dog");
        animals.add("cat");
        animals.add("poultry");
        animals.add("pig");
    }


    return Array.from(animals);
}


/* =========================================================
   UPDATE FIRESTORE
========================================================= */

async function updateAllProducts() {
    try {
        console.log(
            "Đang đọc sản phẩm từ Firestore..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        console.log(
            `Tìm thấy ${snapshot.size} sản phẩm.`
        );


        let updatedCount = 0;


        for (const productDoc of snapshot.docs) {
            const product =
                productDoc.data();


            const supportTags =
                detectSupportTags(
                    product
                );


            const animals =
                detectAnimals(
                    product
                );


            await updateDoc(
                doc(
                    db,
                    "products",
                    productDoc.id
                ),
                {
                    supportTags,
                    animals
                }
            );


            updatedCount++;


            console.log(
                `Đã cập nhật: ${product.name}`,
                {
                    supportTags,
                    animals
                }
            );
        }


        alert(
            `Hoàn tất! Đã cập nhật ${updatedCount} sản phẩm.`
        );


        console.log(
            "HOÀN TẤT CẬP NHẬT FIRESTORE"
        );

    } catch (error) {
        console.error(
            "Lỗi cập nhật products:",
            error
        );


        alert(
            "Có lỗi xảy ra. Mở F12 → Console để xem."
        );
    }
}


/* =========================================================
   BUTTON
========================================================= */

const updateButton =
    document.querySelector(
        "#updateProductTagsButton"
    );


updateButton?.addEventListener(
    "click",
    async () => {

        const accepted =
            confirm(
                "Bạn có muốn tự động thêm animals và supportTags cho toàn bộ sản phẩm không?"
            );


        if (!accepted) {
            return;
        }


        updateButton.disabled =
            true;


        updateButton.textContent =
            "Đang cập nhật...";


        await updateAllProducts();


        updateButton.disabled =
            false;


        updateButton.textContent =
            "Cập nhật Product Tags";

    }
);