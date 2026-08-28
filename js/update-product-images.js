/* =========================================================
   AVM PET SHOP
   FILE: js/update-product-images.js

   MỤC ĐÍCH:
   Tự động thêm field "image" cho 15 sản phẩm Firestore.
========================================================= */

"use strict";


/* =========================================================
   FIREBASE IMPORT
========================================================= */

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
   PRODUCT IMAGE MAP
========================================================= */

const productImageMap = {

    "LUXPAW":
        "./images/Luxpaw.png",

    "AVM Aqua Mineral":
        "./images/Avm Aqua Mineral.png",

    "AVM Water Clean":
        "./images/AVM Water Clean.png",

    "AVM Electro Balance":
        "./images/AVM Electro Balance.png",

    "AVM Digestive Pro":
        "./images/AVM Digestive Pro.png",

    "AVM Calcium D3":
        "./images/AVM Calcium D3.png",

    "AVM Pet Shampoo":
        "./images/AVM Pet Shampoo.png",

    "AVM Bio Environment":
        "./images/AVM Bio Environment.png",

    "AVM Joint Support":
        "./images/AVM Joint Support.png",

    "AVM Immunity Plus":
        "./images/AVM Immunity Plus.png",

    "AVM Skin Care":
        "./images/AVM Skin Care.png",

    "AVM Oral Care":
        "./images/AVM Oral Care.png",

    "AVM Fly Control":
        "./images/AVM Fly Control.png",

    "AVM Respiratory Care":
        "./images/AVM Respiratory Care.png",

    "AVM Growth Max":
        "./images/AVM Growth Max.png"

};


/* =========================================================
   UPDATE PRODUCT IMAGES
========================================================= */

async function updateProductImages() {

    console.log(
        "🚀 Bắt đầu cập nhật ảnh sản phẩm..."
    );


    try {

        const productsSnapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        let updatedCount = 0;
        let skippedCount = 0;


        for (
            const productDocument
            of productsSnapshot.docs
        ) {

            const product =
                productDocument.data();


            const productName =
                product.name?.trim();


            if (
                !productName
            ) {

                console.warn(
                    "⚠️ Sản phẩm không có tên:",
                    productDocument.id
                );

                skippedCount++;

                continue;

            }


            const imagePath =
                productImageMap[
                    productName
                ];


            if (
                !imagePath
            ) {

                console.warn(
                    "⚠️ Không tìm thấy ảnh cho:",
                    productName
                );

                skippedCount++;

                continue;

            }


            await updateDoc(
                doc(
                    db,
                    "products",
                    productDocument.id
                ),
                {
                    image:
                        imagePath
                }
            );


            console.log(
                "✅ Đã cập nhật:",
                productName,
                "→",
                imagePath
            );


            updatedCount++;

        }


        console.log(
            "================================="
        );

        console.log(
            `✅ Thành công: ${updatedCount} sản phẩm`
        );

        console.log(
            `⚠️ Bỏ qua: ${skippedCount} sản phẩm`
        );

        console.log(
            "================================="
        );


        alert(
            `Đã cập nhật ảnh cho ${updatedCount} sản phẩm.`
        );


    } catch (error) {

        console.error(
            "❌ Lỗi cập nhật ảnh sản phẩm:",
            error
        );


        alert(
            "Không thể cập nhật ảnh. Mở Console để xem lỗi."
        );

    }

}


/* =========================================================
   RUN
========================================================= */

updateProductImages();