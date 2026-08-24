"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initPaymentPage();
});

/**
 * Initialize the payment page.
 */
function initPaymentPage() {
    const orderData = getStoredOrder();

    if (!orderData) {
        redirectToOrderForm();
        return;
    }

    populatePaymentSummary(orderData);
}

/**
 * Retrieve the saved order from sessionStorage.
 */
function getStoredOrder() {
    const storedOrder = sessionStorage.getItem("nexproxyOrder");

    if (!storedOrder) {
        return null;
    }

    try {
        return JSON.parse(storedOrder);
    } catch (error) {
        console.error("Unable to read stored order data.", error);
        sessionStorage.removeItem("nexproxyOrder");
        return null;
    }
}

/**
 * Redirect visitors back to the order form.
 */
function redirectToOrderForm() {
    window.location.href = "../order/";
}

/**
 * Populate the payment summary.
 */
function populatePaymentSummary(orderData) {
    const orderId = document.querySelector("#payment-order-id");
    const plan = document.querySelector("#payment-plan");
    const price = document.querySelector("#payment-price");

    if (orderId) {
        orderId.textContent = orderData.orderId || "—";
    }

    if (plan) {
        plan.textContent = orderData.planName || "—";
    }

    if (price) {
        price.textContent = formatPrice(orderData.planPrice);
    }
}

/**
 * Format the order price for display.
 */
function formatPrice(price) {
    if (!price || price === "custom") {
        return "Custom";
    }

    return `$${price}`;
}