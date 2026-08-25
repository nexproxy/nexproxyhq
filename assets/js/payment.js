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

    ensurePaymentState(orderData);
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
 * Ensure the order has the payment fields required
 * by the payment workflow.
 */
/**
 * Ensure the order has the payment fields required
 * by the payment workflow.
 */
function ensurePaymentState(orderData) {
    let changed = false;

    if (!orderData.paymentMethod) {
        orderData.paymentMethod = "PENDING";
        changed = true;
    }

    if (!orderData.paymentStatus) {
        orderData.paymentStatus = "UNPAID";
        changed = true;
    }

    if (!orderData.paymentReference) {
        orderData.paymentReference = "";
        changed = true;
    }

    if (!orderData.paymentSubmittedAt) {
        orderData.paymentSubmittedAt = "";
        changed = true;
    }

    if (!orderData.orderStatus) {
        orderData.orderStatus = "PENDING_PAYMENT";
        changed = true;
    }

    if (changed) {
        sessionStorage.setItem(
            "nexproxyOrder",
            JSON.stringify(orderData)
        );
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
/**
 * Populate the payment summary and current payment state.
 */
function populatePaymentSummary(orderData) {
    const orderId = document.querySelector("#payment-order-id");
    const plan = document.querySelector("#payment-plan");
    const price = document.querySelector("#payment-price");
    const statusValue = document.querySelector("#payment-status-value");
    const statusMessage = document.querySelector("#payment-status-message");
    const paymentAction = document.querySelector("#payment-action");

    if (orderId) {
        orderId.textContent = orderData.orderId || "—";
    }

    if (plan) {
        plan.textContent = orderData.planName || "—";
    }

    if (price) {
        price.textContent = formatPrice(orderData.planPrice);
    }

    if (statusValue) {
        statusValue.textContent = getPaymentStatusLabel(
            orderData.paymentStatus
        );
    }

    if (statusMessage) {
        statusMessage.textContent = getPaymentStatusMessage(
            orderData.paymentStatus
        );
    }

    if (paymentAction) {
        paymentAction.innerHTML = getPaymentActionMarkup(
            orderData.paymentStatus
        );
    }
}



/**
 * Return a customer-friendly payment status label.
 */
function getPaymentStatusLabel(paymentStatus) {
    switch (paymentStatus) {
        case "PAYMENT_SUBMITTED":
            return "Payment Submitted";

        case "PAYMENT_VERIFIED":
            return "Payment Verified";

        case "UNPAID":
        default:
            return "Awaiting Payment";
    }
}

/**
 * Return a customer-friendly payment status message.
 */
function getPaymentStatusMessage(paymentStatus) {
    switch (paymentStatus) {
        case "PAYMENT_SUBMITTED":
            return "Your payment information has been submitted and is waiting for verification.";

        case "PAYMENT_VERIFIED":
            return "Your payment has been verified. We are preparing your proxy.";

        case "UNPAID":
        default:
            return "Your order is ready for payment. Payment instructions will appear here when an approved payment method is available.";
    }
}

/**
 * Return the appropriate payment action markup.
 */
function getPaymentActionMarkup(paymentStatus) {
    switch (paymentStatus) {
        case "PAYMENT_SUBMITTED":
            return `
                <p class="payment-help-text">
                    We are reviewing your payment. Please keep your Order ID for reference.
                </p>
            `;

        case "PAYMENT_VERIFIED":
            return `
                <p class="payment-help-text">
                    Your order has moved to fulfillment.
                </p>
            `;

        case "UNPAID":
        default:
            return `
                <p class="payment-help-text">
                    No payment action is available yet. Please keep your Order ID for reference.
                </p>
            `;
    }
}


/**
 * Update and persist the payment state for the current order.
 */
function updatePaymentState(orderData, paymentStatus) {
    orderData.paymentStatus = paymentStatus;

    switch (paymentStatus) {
        case "PAYMENT_SUBMITTED":
            orderData.orderStatus = "PENDING_PAYMENT";
            break;

        case "PAYMENT_VERIFIED":
            orderData.orderStatus = "PROCESSING";
            break;

        case "UNPAID":
        default:
            orderData.orderStatus = "PENDING_PAYMENT";
            break;
    }

    sessionStorage.setItem(
        "nexproxyOrder",
        JSON.stringify(orderData)
    );

    return orderData;
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