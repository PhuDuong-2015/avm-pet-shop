/* =========================================================
   AVM PET SHOP
   FILE: js/admin.js

   CHỨC NĂNG:
   - Kiểm tra quyền admin
   - Đọc sản phẩm từ Firestore
   - Thêm sản phẩm
   - Sửa sản phẩm
   - Xóa sản phẩm
   - Tìm kiếm và lọc
   - Dashboard thống kê
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
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    collection,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   TRẠNG THÁI ỨNG DỤNG
========================================================= */

const adminState = {
    products: [],
    filteredProducts: [],
    currentUser: null,
    editingProductId: null,
    deletingProductId: null,
    unsubscribeProducts: null,

    isImportingProducts: false
};


/* =========================================================
   HTML ELEMENTS
========================================================= */

const htmlElement =
    document.documentElement;

const userNameElement =
    document.querySelector("#userName");

const logoutButton =
    document.querySelector("#logoutButton");


/* Dashboard */

const totalProductsCount =
    document.querySelector("#totalProductsCount");

const inStockProductsCount =
    document.querySelector("#inStockProductsCount");

const outOfStockProductsCount =
    document.querySelector("#outOfStockProductsCount");

const categoryCount =
    document.querySelector("#categoryCount");


/* Toolbar */

const adminProductSearch =
    document.querySelector("#adminProductSearch");

const adminCategoryFilter =
    document.querySelector("#adminCategoryFilter");

const adminStatusFilter =
    document.querySelector("#adminStatusFilter");


/* Product area */

const adminLoading =
    document.querySelector("#adminLoading");

const adminError =
    document.querySelector("#adminError");

const adminErrorText =
    document.querySelector("#adminErrorText");

const retryAdminButton =
    document.querySelector("#retryAdminButton");

const adminTableWrapper =
    document.querySelector("#adminTableWrapper");

const adminProductsTableBody =
    document.querySelector("#adminProductsTableBody");

const adminEmpty =
    document.querySelector("#adminEmpty");


/* Add product buttons */

const openAddProductButton =
    document.querySelector("#openAddProductButton");

const addProductButton =
    document.querySelector("#addProductButton");

const emptyAddProductButton =
    document.querySelector("#emptyAddProductButton");

const importProductsButton =
    document.querySelector("#importProductsButton");


/* Product form modal */

const productFormModal =
    document.querySelector("#productFormModal");

const closeProductFormModalButton =
    document.querySelector("#closeProductFormModalButton");

const cancelProductFormButton =
    document.querySelector("#cancelProductFormButton");

const productFormModalTitle =
    document.querySelector("#productFormModalTitle");

const adminProductForm =
    document.querySelector("#adminProductForm");

const editingProductIdInput =
    document.querySelector("#editingProductId");

const adminProductName =
    document.querySelector("#adminProductName");

const adminProductCategory =
    document.querySelector("#adminProductCategory");

const adminProductCategoryName =
    document.querySelector("#adminProductCategoryName");

const adminProductPrice =
    document.querySelector("#adminProductPrice");

const adminProductStatus =
    document.querySelector("#adminProductStatus");

const adminProductSymbol =
    document.querySelector("#adminProductSymbol");

const adminProductAccent =
    document.querySelector("#adminProductAccent");

const adminProductDescription =
    document.querySelector("#adminProductDescription");

const descriptionCharacterCount =
    document.querySelector("#descriptionCharacterCount");

const saveProductButton =
    document.querySelector("#saveProductButton");

const saveProductButtonText =
    document.querySelector("#saveProductButtonText");

const saveProductLoader =
    document.querySelector("#saveProductLoader");

const adminFormMessage =
    document.querySelector("#adminFormMessage");


/* Delete modal */

const deleteProductModal =
    document.querySelector("#deleteProductModal");

const deleteProductName =
    document.querySelector("#deleteProductName");

const cancelDeleteProductButton =
    document.querySelector("#cancelDeleteProductButton");

const confirmDeleteProductButton =
    document.querySelector("#confirmDeleteProductButton");

const deleteProductButtonText =
    document.querySelector("#deleteProductButtonText");

const deleteProductLoader =
    document.querySelector("#deleteProductLoader");


/* Toast */

const adminToast =
    document.querySelector("#adminToast");

const adminToastIcon =
    document.querySelector("#adminToastIcon");

const adminToastTitle =
    document.querySelector("#adminToastTitle");

const adminToastMessage =
    document.querySelector("#adminToastMessage");


/* Error elements */

const adminFieldErrors = {
    name:
        document.querySelector("#adminProductNameError"),

    category:
        document.querySelector("#adminProductCategoryError"),

    categoryName:
        document.querySelector("#adminProductCategoryNameError"),

    price:
        document.querySelector("#adminProductPriceError"),

    symbol:
        document.querySelector("#adminProductSymbolError"),

    animal:
        document.querySelector("#adminProductAnimalError"),

    description:
        document.querySelector("#adminProductDescriptionError")
};


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function showElement(element) {
    element?.classList.remove("hidden");
}


function hideElement(element) {
    element?.classList.add("hidden");
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(Number(value) || 0);
}


function formatDate(timestamp) {
    if (!timestamp?.toDate) {
        return "Chưa cập nhật";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(timestamp.toDate());
}


function getAnimalLabel(animalCode) {
    const labels = {
        dog: "Chó",
        cat: "Mèo",
        poultry: "Gia cầm",
        pig: "Heo",
        aquaculture: "Thủy sản"
    };

    return labels[animalCode] || animalCode;
}


function getSelectedAnimals() {
    return [
        ...document.querySelectorAll(
            'input[name="adminAnimal"]:checked'
        )
    ].map((checkbox) => checkbox.value);
}


function setSelectedAnimals(animals = []) {
    document
        .querySelectorAll('input[name="adminAnimal"]')
        .forEach((checkbox) => {
            checkbox.checked =
                animals.includes(checkbox.value);
        });
}


/* =========================================================
   KIỂM TRA QUYỀN ADMIN
========================================================= */

htmlElement.classList.add("admin-checking");


onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("./login.html");
        return;
    }

    try {
        const userSnapshot =
            await getDoc(
                doc(db, "users", user.uid)
            );

        if (!userSnapshot.exists()) {
            await signOut(auth);

            alert(
                "Không tìm thấy hồ sơ tài khoản."
            );

            window.location.replace(
                "./login.html"
            );

            return;
        }

        const userProfile =
            userSnapshot.data();

        if (userProfile.role !== "admin") {
            alert(
                "Tài khoản của bạn không có quyền quản trị."
            );

            window.location.replace(
                "./index.html"
            );

            return;
        }

        adminState.currentUser = {
            uid: user.uid,
            email: user.email,
            ...userProfile
        };

        if (userNameElement) {
            userNameElement.textContent =
                userProfile.fullName ||
                user.email ||
                "Quản trị viên";
        }

        htmlElement.classList.remove(
            "admin-checking"
        );

        startProductsListener();

    } catch (error) {
        console.error(
            "Lỗi kiểm tra quyền admin:",
            error
        );

        alert(
            "Không thể kiểm tra quyền quản trị."
        );

        window.location.replace("./index.html");
    }
});


/* =========================================================
   ĐĂNG XUẤT
========================================================= */

logoutButton?.addEventListener(
    "click",
    async () => {
        const accepted = window.confirm(
            "Bạn có chắc muốn đăng xuất?"
        );

        if (!accepted) {
            return;
        }

        logoutButton.disabled = true;
        logoutButton.textContent =
            "Đang đăng xuất...";

        try {
            if (adminState.unsubscribeProducts) {
                adminState.unsubscribeProducts();
            }

            await signOut(auth);

            localStorage.removeItem(
                "avmCurrentUser"
            );

            window.location.replace(
                "./login.html"
            );

        } catch (error) {
            console.error(
                "Lỗi đăng xuất:",
                error
            );

            logoutButton.disabled = false;
            logoutButton.textContent =
                "Đăng xuất";

            showToast(
                "error",
                "Không thể đăng xuất",
                "Vui lòng thử lại."
            );
        }
    }
);


/* =========================================================
   ĐỌC SẢN PHẨM THỜI GIAN THỰC
========================================================= */

function startProductsListener() {
    showElement(adminLoading);
    hideElement(adminError);
    hideElement(adminTableWrapper);
    hideElement(adminEmpty);

    const productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
    );

    adminState.unsubscribeProducts = onSnapshot(
        productsQuery,

        async (snapshot) => {
            console.log(
                "Số sản phẩm Firestore:",
                snapshot.size
            );

            /*
                Firestore chưa có sản phẩm:
                tự động nhập từ products.json
            */

            if (
                snapshot.empty &&
                !adminState.isImportingProducts
            ) {
                hideElement(adminLoading);

                await importSampleProducts();

                return;
            }

            adminState.products =
                snapshot.docs.map((productDocument) => ({
                    id: productDocument.id,
                    ...productDocument.data()
                }));

            adminState.isImportingProducts = false;

            hideElement(adminLoading);
            hideElement(adminError);

            applyAdminFilters();
            updateDashboard();
        },

        (error) => {
            console.error(
                "Lỗi đọc collection products:",
                error
            );

            hideElement(adminLoading);
            hideElement(adminTableWrapper);
            hideElement(adminEmpty);

            adminErrorText.textContent =
                `${error.code || "unknown"}: ${error.message}`;

            showElement(adminError);
        }
    );
}


/* =========================================================
   LỌC SẢN PHẨM
========================================================= */

function applyAdminFilters() {
    const keyword =
        adminProductSearch
            ?.value
            .trim()
            .toLowerCase() || "";

    const category =
        adminCategoryFilter?.value || "all";

    const status =
        adminStatusFilter?.value || "all";


    adminState.filteredProducts =
        adminState.products.filter((product) => {
            const matchesKeyword =
                !keyword ||
                [
                    product.name,
                    product.description,
                    product.categoryName,
                    product.animalName
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(keyword);

            const matchesCategory =
                category === "all" ||
                product.category === category;

            const matchesStatus =
                status === "all" ||
                product.status === status;

            return (
                matchesKeyword &&
                matchesCategory &&
                matchesStatus
            );
        });

    renderAdminProducts();
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {
    const products =
        adminState.products;

    const inStockCount =
        products.filter(
            (product) =>
                product.status === "in-stock"
        ).length;

    const outOfStockCount =
        products.filter(
            (product) =>
                product.status === "out-of-stock"
        ).length;

    const categories =
        new Set(
            products
                .map((product) => product.category)
                .filter(Boolean)
        );


    totalProductsCount.textContent =
        String(products.length);

    inStockProductsCount.textContent =
        String(inStockCount);

    outOfStockProductsCount.textContent =
        String(outOfStockCount);

    categoryCount.textContent =
        String(categories.size);
}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderAdminProducts() {
    if (!adminProductsTableBody) {
        return;
    }

    adminProductsTableBody.innerHTML = "";

    if (
        adminState.filteredProducts.length === 0
    ) {
        hideElement(adminTableWrapper);
        showElement(adminEmpty);
        return;
    }

    hideElement(adminEmpty);
    showElement(adminTableWrapper);


    adminState.filteredProducts.forEach(
        (product) => {
            const row =
                document.createElement("tr");

            const animalName =
                product.animalName ||
                (product.animal || [])
                    .map(getAnimalLabel)
                    .join(", ");

            const stockClass =
                product.status === "in-stock"
                    ? "admin-status-in-stock"
                    : "admin-status-out-of-stock";

            const statusName =
                product.status === "in-stock"
                    ? "Còn hàng"
                    : "Tạm hết hàng";


            row.innerHTML = `
                <td>
                    <div class="admin-product-cell">

                        <span class="admin-product-symbol product-accent-${escapeHTML(
                            product.accent || "blue"
                        )}">
                            ${escapeHTML(
                                product.symbol || "AVM"
                            )}
                        </span>

                        <div>
                            <strong>
                                ${escapeHTML(product.name)}
                            </strong>

                            <small>
                                ID: ${escapeHTML(product.id)}
                            </small>
                        </div>

                    </div>
                </td>

                <td>
                    <span class="admin-category-badge">
                        ${escapeHTML(
                            product.categoryName ||
                            product.category
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(animalName)}
                </td>

                <td>
                    <strong class="admin-product-price">
                        ${formatCurrency(product.price)}
                    </strong>
                </td>

                <td>
                    <span class="admin-product-status ${stockClass}">
                        ${statusName}
                    </span>
                </td>

                <td>
                    <span class="admin-updated-date">
                        ${formatDate(
                            product.updatedAt ||
                            product.createdAt
                        )}
                    </span>
                </td>

                <td>
                    <div class="admin-table-actions">

                        <button
                            type="button"
                            class="admin-edit-button"
                            data-product-id="${escapeHTML(product.id)}"
                        >
                            Sửa
                        </button>

                        <button
                            type="button"
                            class="admin-delete-button"
                            data-product-id="${escapeHTML(product.id)}"
                        >
                            Xóa
                        </button>

                    </div>
                </td>
            `;


            row
                .querySelector(".admin-edit-button")
                .addEventListener(
                    "click",
                    () => openEditProductModal(
                        product.id
                    )
                );


            row
                .querySelector(".admin-delete-button")
                .addEventListener(
                    "click",
                    () => openDeleteProductModal(
                        product.id
                    )
                );


            adminProductsTableBody.appendChild(
                row
            );
        }
    );
}


/* =========================================================
   MỞ MODAL THÊM SẢN PHẨM
========================================================= */

function openAddProductModal() {
    adminState.editingProductId = null;

    productFormModalTitle.textContent =
        "Thêm sản phẩm";

    saveProductButtonText.textContent =
        "Thêm sản phẩm";

    adminProductForm.reset();

    editingProductIdInput.value = "";

    adminProductStatus.value =
        "in-stock";

    adminProductAccent.value =
        "blue";

    descriptionCharacterCount.textContent =
        "0";

    clearAdminFormErrors();
    hideAdminFormMessage();

    showElement(productFormModal);

    document.body.classList.add(
        "modal-open"
    );

    adminProductName.focus();
}


/* =========================================================
   MỞ MODAL SỬA SẢN PHẨM
========================================================= */

function openEditProductModal(productId) {
    const product =
        adminState.products.find(
            (item) => item.id === productId
        );

    if (!product) {
        showToast(
            "error",
            "Không tìm thấy sản phẩm",
            "Dữ liệu có thể đã thay đổi."
        );

        return;
    }

    adminState.editingProductId =
        product.id;

    editingProductIdInput.value =
        product.id;

    productFormModalTitle.textContent =
        "Chỉnh sửa sản phẩm";

    saveProductButtonText.textContent =
        "Lưu thay đổi";


    adminProductName.value =
        product.name || "";

    adminProductCategory.value =
        product.category || "";

    adminProductCategoryName.value =
        product.categoryName || "";

    adminProductPrice.value =
        Number(product.price) || 0;

    adminProductStatus.value =
        product.status || "in-stock";

    adminProductSymbol.value =
        product.symbol || "";

    adminProductAccent.value =
        product.accent || "blue";

    adminProductDescription.value =
        product.description || "";

    descriptionCharacterCount.textContent =
        String(
            adminProductDescription.value.length
        );

    setSelectedAnimals(
        Array.isArray(product.animal)
            ? product.animal
            : []
    );

    clearAdminFormErrors();
    hideAdminFormMessage();

    showElement(productFormModal);

    document.body.classList.add(
        "modal-open"
    );
}


/* =========================================================
   ĐÓNG MODAL FORM
========================================================= */

function closeProductFormModal() {
    hideElement(productFormModal);

    document.body.classList.remove(
        "modal-open"
    );

    adminState.editingProductId = null;

    adminProductForm.reset();

    clearAdminFormErrors();
    hideAdminFormMessage();
}


/* =========================================================
   VALIDATION
========================================================= */

function clearAdminFormErrors() {
    Object.values(adminFieldErrors)
        .forEach((element) => {
            if (element) {
                element.textContent = "";
            }
        });
}


function setAdminFieldError(field, message) {
    if (adminFieldErrors[field]) {
        adminFieldErrors[field].textContent =
            message;
    }
}


function validateAdminProductForm() {
    clearAdminFormErrors();

    const name =
        adminProductName.value.trim();

    const category =
        adminProductCategory.value;

    const categoryName =
        adminProductCategoryName.value.trim();

    const price =
        Number(adminProductPrice.value);

    const symbol =
        adminProductSymbol.value
            .trim()
            .toUpperCase();

    const animals =
        getSelectedAnimals();

    const description =
        adminProductDescription.value.trim();

    let valid = true;


    if (name.length < 3) {
        setAdminFieldError(
            "name",
            "Tên sản phẩm phải có ít nhất 3 ký tự."
        );

        valid = false;
    }


    if (!category) {
        setAdminFieldError(
            "category",
            "Vui lòng chọn danh mục."
        );

        valid = false;
    }


    if (categoryName.length < 2) {
        setAdminFieldError(
            "categoryName",
            "Vui lòng nhập tên danh mục hiển thị."
        );

        valid = false;
    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {
        setAdminFieldError(
            "price",
            "Giá sản phẩm không hợp lệ."
        );

        valid = false;
    }


    if (
        symbol.length < 1 ||
        symbol.length > 3
    ) {
        setAdminFieldError(
            "symbol",
            "Ký hiệu phải từ 1 đến 3 ký tự."
        );

        valid = false;
    }


    if (animals.length === 0) {
        setAdminFieldError(
            "animal",
            "Chọn ít nhất một đối tượng vật nuôi."
        );

        valid = false;
    }


    if (
        description.length < 10 ||
        description.length > 500
    ) {
        setAdminFieldError(
            "description",
            "Mô tả phải từ 10 đến 500 ký tự."
        );

        valid = false;
    }


    return valid;
}


/* =========================================================
   TẠO OBJECT SẢN PHẨM
========================================================= */

function buildProductData() {
    const animals =
        getSelectedAnimals();

    const status =
        adminProductStatus.value;

    return {
        name:
            adminProductName.value.trim(),

        category:
            adminProductCategory.value,

        categoryName:
            adminProductCategoryName.value.trim(),

        price:
            Number(adminProductPrice.value),

        status,

        statusName:
            status === "in-stock"
                ? "Còn hàng"
                : "Tạm hết hàng",

        symbol:
            adminProductSymbol.value
                .trim()
                .toUpperCase(),

        accent:
            adminProductAccent.value,

        animal:
            animals,

        animalName:
            animals
                .map(getAnimalLabel)
                .join(", "),

        description:
            adminProductDescription.value.trim(),

        updatedAt:
            serverTimestamp(),

        updatedBy:
            adminState.currentUser?.uid || null
    };
}


/* =========================================================
   THÊM / SỬA SẢN PHẨM
========================================================= */

async function saveProduct(event) {
    event.preventDefault();

    hideAdminFormMessage();

    if (!validateAdminProductForm()) {
        return;
    }

    setSaveProductLoading(true);

    try {
        const productData =
            buildProductData();


        if (adminState.editingProductId) {
            await updateDoc(
                doc(
                    db,
                    "products",
                    adminState.editingProductId
                ),
                productData
            );

            closeProductFormModal();

            showToast(
                "success",
                "Cập nhật thành công",
                "Thông tin sản phẩm đã được lưu."
            );

            return;
        }


        await addDoc(
            collection(db, "products"),
            {
                ...productData,

                createdAt:
                    serverTimestamp(),

                createdBy:
                    adminState.currentUser?.uid ||
                    null
            }
        );


        closeProductFormModal();

        showToast(
            "success",
            "Thêm sản phẩm thành công",
            "Sản phẩm mới đã được lưu vào Firestore."
        );

    } catch (error) {
        console.error(
            "Lỗi lưu sản phẩm:",
            error
        );

        showAdminFormMessage(
            "error",
            getFirestoreErrorMessage(error)
        );

    } finally {
        setSaveProductLoading(false);
    }
}


/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteProductModal(productId) {
    const product =
        adminState.products.find(
            (item) => item.id === productId
        );

    if (!product) {
        return;
    }

    adminState.deletingProductId =
        product.id;

    deleteProductName.textContent =
        product.name;

    showElement(deleteProductModal);

    document.body.classList.add(
        "modal-open"
    );
}


function closeDeleteProductModal() {
    hideElement(deleteProductModal);

    document.body.classList.remove(
        "modal-open"
    );

    adminState.deletingProductId = null;
}


/* =========================================================
   XÓA SẢN PHẨM
========================================================= */

async function deleteProduct() {
    if (!adminState.deletingProductId) {
        return;
    }

    setDeleteLoading(true);

    try {
        await deleteDoc(
            doc(
                db,
                "products",
                adminState.deletingProductId
            )
        );

        closeDeleteProductModal();

        showToast(
            "success",
            "Đã xóa sản phẩm",
            "Sản phẩm đã được xóa khỏi Firestore."
        );

    } catch (error) {
        console.error(
            "Lỗi xóa sản phẩm:",
            error
        );

        showToast(
            "error",
            "Không thể xóa",
            getFirestoreErrorMessage(error)
        );

    } finally {
        setDeleteLoading(false);
    }
}


/* =========================================================
   LOADING STATES
========================================================= */

function setSaveProductLoading(isLoading) {
    saveProductButton.disabled =
        isLoading;

    saveProductLoader.classList.toggle(
        "hidden",
        !isLoading
    );

    if (isLoading) {
        saveProductButtonText.textContent =
            "Đang lưu...";

        return;
    }

    saveProductButtonText.textContent =
        adminState.editingProductId
            ? "Lưu thay đổi"
            : "Thêm sản phẩm";
}


function setDeleteLoading(isLoading) {
    confirmDeleteProductButton.disabled =
        isLoading;

    deleteProductLoader.classList.toggle(
        "hidden",
        !isLoading
    );

    deleteProductButtonText.textContent =
        isLoading
            ? "Đang xóa..."
            : "Xóa sản phẩm";
}


/* =========================================================
   FORM MESSAGE
========================================================= */

function showAdminFormMessage(type, message) {
    adminFormMessage.textContent =
        message;

    adminFormMessage.classList.remove(
        "hidden",
        "auth-message-success",
        "auth-message-error"
    );

    adminFormMessage.classList.add(
        type === "success"
            ? "auth-message-success"
            : "auth-message-error"
    );
}


function hideAdminFormMessage() {
    adminFormMessage.classList.add(
        "hidden"
    );
}


/* =========================================================
   FIRESTORE ERROR MESSAGE
========================================================= */

function getFirestoreErrorMessage(error) {
    const messages = {
        "permission-denied":
            "Bạn không có quyền thay đổi dữ liệu.",

        "unavailable":
            "Firestore đang tạm thời không khả dụng.",

        "not-found":
            "Không tìm thấy dữ liệu sản phẩm.",

        "failed-precondition":
            "Dữ liệu chưa đáp ứng điều kiện Firestore."
    };

    return messages[error.code] ||
        "Không thể xử lý dữ liệu. Vui lòng thử lại.";
}


/* =========================================================
   TOAST
========================================================= */

let toastTimeout = null;


function showToast(type, title, message) {
    window.clearTimeout(toastTimeout);

    adminToast.classList.remove(
        "hidden",
        "admin-toast-success",
        "admin-toast-error"
    );

    adminToast.classList.add(
        type === "success"
            ? "admin-toast-success"
            : "admin-toast-error"
    );

    adminToastIcon.textContent =
        type === "success"
            ? "✓"
            : "!";

    adminToastTitle.textContent =
        title;

    adminToastMessage.textContent =
        message;


    toastTimeout = window.setTimeout(
        () => {
            adminToast.classList.add(
                "hidden"
            );
        },
        3200
    );
}


/* =========================================================
   CHARACTER COUNT
========================================================= */

adminProductDescription?.addEventListener(
    "input",
    () => {
        const length =
            adminProductDescription.value.length;

        descriptionCharacterCount.textContent =
            String(length);

        if (length > 500) {
            adminProductDescription.value =
                adminProductDescription.value.slice(
                    0,
                    500
                );

            descriptionCharacterCount.textContent =
                "500";
        }
    }
);


/* =========================================================
   TỰ ĐỘNG ĐIỀN TÊN DANH MỤC
========================================================= */

adminProductCategory?.addEventListener(
    "change",
    () => {
        const categoryNames = {
            medicine: "Thuốc thú y",
            nutrition: "Dinh dưỡng",
            digestive: "Tiêu hóa",
            environment: "Môi trường",
            accessory: "Phụ kiện"
        };

        adminProductCategoryName.value =
            categoryNames[
                adminProductCategory.value
            ] || "";
    }
);


/* =========================================================
   FILTER EVENTS
========================================================= */

let adminSearchTimer = null;


adminProductSearch?.addEventListener(
    "input",
    () => {
        window.clearTimeout(
            adminSearchTimer
        );

        adminSearchTimer =
            window.setTimeout(
                applyAdminFilters,
                220
            );
    }
);


adminCategoryFilter?.addEventListener(
    "change",
    applyAdminFilters
);


adminStatusFilter?.addEventListener(
    "change",
    applyAdminFilters
);
/* =========================================================
   NHẬP SẢN PHẨM MẪU VÀO FIRESTORE
========================================================= */
async function importSampleProducts() {
    if (adminState.isImportingProducts) {
        return;
    }

    adminState.isImportingProducts = true;

    console.log("Bắt đầu nhập sản phẩm mẫu...");

    try {
        const response = await fetch(
            "./data/products.json",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Không đọc được products.json: ${response.status}`
            );
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error(
                "products.json phải chứa một mảng sản phẩm."
            );
        }

        if (products.length === 0) {
            throw new Error(
                "products.json đang không có sản phẩm."
            );
        }

        const batch = writeBatch(db);

        products.forEach((product) => {
            const productReference = doc(
                collection(db, "products")
            );

            batch.set(productReference, {
                name: product.name || "Sản phẩm AVM",

                category:
                    product.category || "medicine",

                categoryName:
                    product.categoryName || "Thuốc thú y",

                animal:
                    Array.isArray(product.animal)
                        ? product.animal
                        : [],

                animalName:
                    product.animalName || "Vật nuôi",

                price:
                    Number(product.price) || 0,

                status:
                    product.status || "in-stock",

                statusName:
                    product.status === "out-of-stock"
                        ? "Tạm hết hàng"
                        : "Còn hàng",

                description:
                    product.description ||
                    "Sản phẩm chăm sóc thú y AVM.",

                symbol:
                    product.symbol || "AVM",

                accent:
                    product.accent || "blue",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp(),

                createdBy:
                    adminState.currentUser?.uid || "",

                updatedBy:
                    adminState.currentUser?.uid || ""
            });
        });

        await batch.commit();

        console.log(
            `Đã nhập ${products.length} sản phẩm vào Firestore`
        );

        showToast(
            "success",
            "Đã nhập dữ liệu",
            `${products.length} sản phẩm đã được thêm vào Firestore.`
        );

    } catch (error) {
        console.error(
            "Lỗi nhập sản phẩm mẫu:",
            error
        );

        showToast(
            "error",
            "Không thể nhập sản phẩm",
            error.message
        );

        adminState.isImportingProducts = false;
    }
}

/* =========================================================
   BUTTON EVENTS
========================================================= */

[
    openAddProductButton,
    addProductButton,
    emptyAddProductButton
].forEach((button) => {
    button?.addEventListener(
        "click",
        openAddProductModal
    );
});


closeProductFormModalButton?.addEventListener(
    "click",
    closeProductFormModal
);


cancelProductFormButton?.addEventListener(
    "click",
    closeProductFormModal
);


adminProductForm?.addEventListener(
    "submit",
    saveProduct
);


cancelDeleteProductButton?.addEventListener(
    "click",
    closeDeleteProductModal
);


confirmDeleteProductButton?.addEventListener(
    "click",
    deleteProduct
);


retryAdminButton?.addEventListener(
    "click",
    startProductsListener
);


/* =========================================================
   CLICK NGOÀI MODAL
========================================================= */

productFormModal?.addEventListener(
    "click",
    (event) => {
        if (event.target === productFormModal) {
            closeProductFormModal();
        }
    }
);


deleteProductModal?.addEventListener(
    "click",
    (event) => {
        if (event.target === deleteProductModal) {
            closeDeleteProductModal();
        }
    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (
            productFormModal &&
            !productFormModal.classList.contains(
                "hidden"
            )
        ) {
            closeProductFormModal();
        }

        if (
            deleteProductModal &&
            !deleteProductModal.classList.contains(
                "hidden"
            )
        ) {
            closeDeleteProductModal();
        }
    }
);
importProductsButton?.addEventListener(
    "click",
    importSampleProducts
);