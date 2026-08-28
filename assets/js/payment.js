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
    initPaymentForm(orderData);
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
 * Initialize the payment submission form.
 */
function initPaymentForm(orderData) {
    const paymentForm = document.querySelector("#payment-form");

    if (!paymentForm) {
        return;
    }

    paymentForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const paymentMethod =
            paymentForm.paymentMethod.value.trim();

        const paymentReference =
            paymentForm.paymentReference.value.trim();

        const submitButton =
            document.querySelector("#submit-payment");

        const message =
            document.querySelector("#payment-form-message");

        if (!paymentMethod || !paymentReference) {
            if (message) {
                message.textContent =
                    "Please enter your payment method and reference.";
            }
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.setAttribute("aria-busy", "true");
        }

        if (message) {
            message.textContent =
                "Submitting your payment information...";
        }

        try {
            const supabasePublishableKey =
                window.NEXPROXY_SUPABASE_PUBLISHABLE_KEY;

            if (!supabasePublishableKey) {
                throw new Error(
                    "Supabase configuration is unavailable."
                );
            }

            const response = await fetch(
                "https://fzvxuhumtebqlpwqpkvt.supabase.co/functions/v1/dynamic-action",
                {
                    method: "POST",
                    headers: {
                        "apikey": supabasePublishableKey,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action: "submit_payment",
                        orderId: orderData.orderId,
                        email: orderData.email,
                        paymentMethod,
                        paymentReference
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result?.error ||
                    "Unable to submit your payment."
                );
            }

            updatePaymentState(
                orderData,
                "PAYMENT_SUBMITTED"
            );

            orderData.paymentMethod = paymentMethod;
            orderData.paymentReference = paymentReference;
            orderData.paymentSubmittedAt =
                new Date().toISOString();

            sessionStorage.setItem(
                "nexproxyOrder",
                JSON.stringify(orderData)
            );

            populatePaymentSummary(orderData);

        } catch (error) {
            console.error(
                "Unable to submit payment.",
                error
            );

            if (message) {
                message.textContent =
                    "We could not submit your payment right now. Please try again.";
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.removeAttribute("aria-busy");
            }
        }
    });
}


/**
 * Ensure the order has the payment and fulfillment fields
 * required by the order lifecycle.
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

    if (!orderData.fulfillment) {
        orderData.fulfillment = {
            status: "NOT_ASSIGNED",
            proxyAssigned: false,
            deliveryMethod: "",
            assignedAt: "",
            deliveredAt: ""
        };
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
                <form id="payment-form">

                    <div class="form-group">
                        <label for="payment-method">
                            Payment Method
                        </label>

                        <select
                            id="payment-method"
                            name="paymentMethod"
                            required
                        >
                            <option value="">
                                Select payment method
                            </option>

                            <option value="USDT">
                                USDT
                            </option>

                            <option value="ACH">
                                ACH
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="payment-reference">
                            Payment Reference
                        </label>

                        <input
                            type="text"
                            id="payment-reference"
                            name="paymentReference"
                            placeholder="Enter your payment reference"
                            required
                        >
                    </div>

                    <button
                        type="submit"
                        class="btn btn-primary"
                        id="submit-payment"
                    >
                        Submit Payment
                    </button>

                    <p
                        id="payment-form-message"
                        class="payment-help-text"
                        aria-live="polite"
                    ></p>

                </form>
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
 * Update and persist the fulfillment state for the current order.
 */
function updateFulfillmentState(orderData, fulfillmentStatus) {
    if (!orderData.fulfillment) {
        orderData.fulfillment = {
            status: "NOT_ASSIGNED",
            proxyAssigned: false,
            deliveryMethod: "",
            assignedAt: "",
            deliveredAt: ""
        };
    }

    orderData.fulfillment.status = fulfillmentStatus;

    switch (fulfillmentStatus) {
        case "ASSIGNED":
            orderData.fulfillment.proxyAssigned = true;
            orderData.orderStatus = "PROXY_ASSIGNED";

            if (!orderData.fulfillment.assignedAt) {
                orderData.fulfillment.assignedAt =
                    new Date().toISOString();
            }
            break;

        case "DELIVERED":
            orderData.fulfillment.proxyAssigned = true;
            orderData.orderStatus = "DELIVERED";

            if (!orderData.fulfillment.deliveredAt) {
                orderData.fulfillment.deliveredAt =
                    new Date().toISOString();
            }
            break;

        case "NOT_ASSIGNED":
        default:
            orderData.fulfillment.status = "NOT_ASSIGNED";
            orderData.fulfillment.proxyAssigned = false;
            orderData.orderStatus = "PROCESSING";
            break;
    }

    sessionStorage.setItem(
        "nexproxyOrder",
        JSON.stringify(orderData)
    );

    return orderData;
}


/**
 * Set and persist the delivery method for the current order.
 */
function setDeliveryMethod(orderData, deliveryMethod) {
    const normalizedMethod = String(deliveryMethod)
        .trim()
        .toUpperCase();

    if (!["TELEGRAM", "EMAIL"].includes(normalizedMethod)) {
        return orderData;
    }

    if (!orderData.fulfillment) {
        orderData.fulfillment = {
            status: "NOT_ASSIGNED",
            proxyAssigned: false,
            deliveryMethod: "",
            assignedAt: "",
            deliveredAt: ""
        };
    }

    orderData.fulfillment.deliveryMethod = normalizedMethod;

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