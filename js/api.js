/* =========================================================
   AVM PET SHOP
   FILE: js/api.js

   CHỨC NĂNG:
   - Gọi dữ liệu từ data/products.json
   - Hiển thị trạng thái HTTP
   - Tính thời gian phản hồi
   - Hiển thị JSON
   - Tạo bảng dữ liệu
   - Sao chép JSON
   - Xóa kết quả
========================================================= */

"use strict";


/* =========================================================
   1. CẤU HÌNH API
========================================================= */

const API_ENDPOINT = "./data/products.json";


/* =========================================================
   2. LẤY PHẦN TỬ HTML
========================================================= */

const sendApiRequestButton = document.querySelector(
    "#sendApiRequestButton"
);

const clearApiResultButton = document.querySelector(
    "#clearApiResultButton"
);

const copyJsonButton = document.querySelector(
    "#copyJsonButton"
);

const apiConnectionStatus = document.querySelector(
    "#apiConnectionStatus"
);

const apiHttpStatus = document.querySelector(
    "#apiHttpStatus"
);

const apiResponseTime = document.querySelector(
    "#apiResponseTime"
);

const apiRecordCount = document.querySelector(
    "#apiRecordCount"
);

const apiTableCount = document.querySelector(
    "#apiTableCount"
);

const apiJsonViewer = document.querySelector(
    "#apiJsonViewer"
);

const apiTableBody = document.querySelector(
    "#apiTableBody"
);

const apiLoading = document.querySelector(
    "#apiLoading"
);

const apiErrorMessage = document.querySelector(
    "#apiErrorMessage"
);

const apiErrorText = document.querySelector(
    "#apiErrorText"
);


/* =========================================================
   3. TRẠNG THÁI
========================================================= */

let currentApiData = [];


/* =========================================================
   4. HÀM TIỆN ÍCH
========================================================= */

function showElement(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(element) {
    if (element) {
        element.classList.add("hidden");
    }
}


function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(Number(value) || 0);
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function setConnectionStatus(type, text) {
    if (!apiConnectionStatus) {
        return;
    }

    apiConnectionStatus.textContent = text;

    apiConnectionStatus.classList.remove(
        "status-idle",
        "status-loading",
        "status-success",
        "status-error"
    );

    apiConnectionStatus.classList.add(type);
}


/* =========================================================
   5. GỬI YÊU CẦU API
========================================================= */

async function sendApiRequest() {
    setLoadingState(true);

    const startTime = performance.now();

    try {
        const response = await fetch(API_ENDPOINT, {
            cache: "no-store"
        });

        const endTime = performance.now();

        const responseDuration =
            Math.round(endTime - startTime);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status} - Không thể tải dữ liệu`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "Dữ liệu API không đúng định dạng mảng"
            );
        }

        currentApiData = data.map((product) => ({
            ...product,

            id: Number(product.id),

            price: Number(product.price),

            animal: Array.isArray(product.animal)
                ? product.animal
                : []
        }));

        updateSuccessStatus(
            response.status,
            responseDuration,
            currentApiData.length
        );

        renderJson(currentApiData);
        renderTable(currentApiData);

        copyJsonButton.disabled = false;

        hideElement(apiErrorMessage);

        setConnectionStatus(
            "status-success",
            "Kết nối thành công"
        );
    } catch (error) {
        console.error("Lỗi API Demo:", error);

        currentApiData = [];

        updateErrorStatus();

        renderError(error.message);

        setConnectionStatus(
            "status-error",
            "Kết nối thất bại"
        );
    } finally {
        setLoadingState(false);
    }
}


/* =========================================================
   6. TRẠNG THÁI LOADING
========================================================= */

function setLoadingState(isLoading) {
    if (isLoading) {
        showElement(apiLoading);
        hideElement(apiErrorMessage);

        sendApiRequestButton.disabled = true;
        clearApiResultButton.disabled = true;
        copyJsonButton.disabled = true;

        setConnectionStatus(
            "status-loading",
            "Đang kết nối"
        );

        apiHttpStatus.textContent = "...";
        apiResponseTime.textContent = "...";
        apiRecordCount.textContent = "...";
        apiTableCount.textContent = "...";

        return;
    }

    hideElement(apiLoading);

    sendApiRequestButton.disabled = false;
    clearApiResultButton.disabled = false;
}


/* =========================================================
   7. CẬP NHẬT TRẠNG THÁI THÀNH CÔNG
========================================================= */

function updateSuccessStatus(
    httpStatus,
    responseTime,
    recordCount
) {
    apiHttpStatus.textContent = `${httpStatus} OK`;

    apiResponseTime.textContent =
        `${responseTime} ms`;

    apiRecordCount.textContent =
        String(recordCount);

    apiTableCount.textContent =
        String(recordCount);

    apiHttpStatus.className = "api-status-success";
}


/* =========================================================
   8. CẬP NHẬT TRẠNG THÁI LỖI
========================================================= */

function updateErrorStatus() {
    apiHttpStatus.textContent = "ERROR";
    apiResponseTime.textContent = "---";
    apiRecordCount.textContent = "0";
    apiTableCount.textContent = "0";

    apiHttpStatus.className = "api-status-error";

    copyJsonButton.disabled = true;

    renderEmptyTable();
}


/* =========================================================
   9. HIỂN THỊ JSON
========================================================= */

function renderJson(data) {
    if (!apiJsonViewer) {
        return;
    }

    const formattedJson = JSON.stringify(
        data,
        null,
        4
    );

    apiJsonViewer.innerHTML =
        `<code>${escapeHTML(formattedJson)}</code>`;
}


/* =========================================================
   10. HIỂN THỊ LỖI
========================================================= */

function renderError(message) {
    if (apiErrorText) {
        apiErrorText.textContent = message;
    }

    showElement(apiErrorMessage);

    if (apiJsonViewer) {
        const errorJson = {
            success: false,
            endpoint: API_ENDPOINT,
            message
        };

        apiJsonViewer.innerHTML =
            `<code>${escapeHTML(
                JSON.stringify(errorJson, null, 4)
            )}</code>`;
    }
}


/* =========================================================
   11. HIỂN THỊ BẢNG DỮ LIỆU
========================================================= */

function renderTable(products) {
    if (!apiTableBody) {
        return;
    }

    apiTableBody.innerHTML = "";

    if (products.length === 0) {
        renderEmptyTable();
        return;
    }

    products.forEach((product) => {
        const row = document.createElement("tr");

        const stockClass =
            product.status === "in-stock"
                ? "table-status-in-stock"
                : "table-status-out-of-stock";

        row.innerHTML = `
            <td>
                ${escapeHTML(product.id)}
            </td>

            <td>
                <div class="api-product-cell">

                    <span class="api-product-symbol">
                        ${escapeHTML(product.symbol)}
                    </span>

                    <div>
                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <small>
                            ${escapeHTML(product.description)}
                        </small>
                    </div>

                </div>
            </td>

            <td>
                <span class="api-category-badge">
                    ${escapeHTML(product.categoryName)}
                </span>
            </td>

            <td>
                ${escapeHTML(product.animalName)}
            </td>

            <td>
                <strong class="api-price">
                    ${formatCurrency(product.price)}
                </strong>
            </td>

            <td>
                <span class="api-table-status ${stockClass}">
                    ${escapeHTML(product.statusName)}
                </span>
            </td>
        `;

        apiTableBody.appendChild(row);
    });
}


/* =========================================================
   12. BẢNG TRỐNG
========================================================= */

function renderEmptyTable() {
    if (!apiTableBody) {
        return;
    }

    apiTableBody.innerHTML = `
        <tr class="api-table-empty-row">

            <td colspan="6">

                <div class="api-table-empty">

                    <span>
                        ◇
                    </span>

                    <p>
                        Chưa có dữ liệu.
                        Hãy gửi yêu cầu API.
                    </p>

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
   13. SAO CHÉP JSON
========================================================= */

async function copyJsonData() {
    if (currentApiData.length === 0) {
        return;
    }

    const jsonText = JSON.stringify(
        currentApiData,
        null,
        4
    );

    try {
        await navigator.clipboard.writeText(
            jsonText
        );

        const oldText =
            copyJsonButton.textContent;

        copyJsonButton.textContent =
            "Đã sao chép";

        copyJsonButton.classList.add(
            "copied"
        );

        window.setTimeout(() => {
            copyJsonButton.textContent =
                oldText;

            copyJsonButton.classList.remove(
                "copied"
            );
        }, 1600);
    } catch (error) {
        console.error(
            "Không thể sao chép JSON:",
            error
        );

        fallbackCopyText(jsonText);
    }
}


/* =========================================================
   14. SAO CHÉP DỰ PHÒNG
========================================================= */

function fallbackCopyText(text) {
    const temporaryTextarea =
        document.createElement("textarea");

    temporaryTextarea.value = text;

    temporaryTextarea.setAttribute(
        "readonly",
        ""
    );

    temporaryTextarea.style.position =
        "fixed";

    temporaryTextarea.style.opacity =
        "0";

    document.body.appendChild(
        temporaryTextarea
    );

    temporaryTextarea.select();

    document.execCommand("copy");

    temporaryTextarea.remove();

    copyJsonButton.textContent =
        "Đã sao chép";

    window.setTimeout(() => {
        copyJsonButton.textContent =
            "Sao chép";
    }, 1600);
}


/* =========================================================
   15. XÓA KẾT QUẢ
========================================================= */

function clearApiResult() {
    currentApiData = [];

    apiHttpStatus.textContent = "---";
    apiResponseTime.textContent = "---";
    apiRecordCount.textContent = "0";
    apiTableCount.textContent = "0";

    apiHttpStatus.className = "";

    apiJsonViewer.innerHTML = `
        <code>{
    "message": "Nhấn Gửi yêu cầu để tải dữ liệu",
    "endpoint": "./data/products.json"
}</code>
    `;

    copyJsonButton.disabled = true;

    hideElement(apiErrorMessage);
    hideElement(apiLoading);

    renderEmptyTable();

    setConnectionStatus(
        "status-idle",
        "Chưa kết nối"
    );
}


/* =========================================================
   16. SỰ KIỆN
========================================================= */

sendApiRequestButton?.addEventListener(
    "click",
    sendApiRequest
);


clearApiResultButton?.addEventListener(
    "click",
    clearApiResult
);


copyJsonButton?.addEventListener(
    "click",
    copyJsonData
);


/* =========================================================
   17. KHỞI TẠO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        clearApiResult();
    }
);