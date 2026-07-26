import assert from "node:assert/strict";
import test from "node:test";
import {
    clampMoney,
    normalizeMoney,
    normalizeMoneyString,
    normalizeQuantity,
    parseNumericInput,
} from "../src/utils/numeric-values.ts";

test("preserves empty editing state as zero only for calculations", () => {
    assert.equal(parseNumericInput(""), 0);
    assert.equal(normalizeMoneyString(""), "0");
});

test("does not concatenate numeric strings when summing payments", () => {
    const payments = ["100", "50"];
    const total = payments.reduce((sum, payment) => sum + normalizeMoney(payment), 0);

    assert.equal(total, 150);
});

test("calculates decimal values with money precision", () => {
    assert.equal(normalizeMoney("10.239"), 10.24);
    assert.equal(normalizeMoney("10.235"), 10.24);
});

test("clamps discount so subtotal never becomes negative", () => {
    const quantity = normalizeQuantity("2");
    const price = normalizeMoney("50");
    const subtotal = quantity * price;
    const discount = clampMoney("150", subtotal);

    assert.equal(discount, 100);
    assert.equal(Math.max(0, subtotal - discount), 0);
});

test("quantity never normalizes below one or to decimal values", () => {
    assert.equal(normalizeQuantity(""), 1);
    assert.equal(normalizeQuantity("0"), 1);
    assert.equal(normalizeQuantity("-4"), 1);
    assert.equal(normalizeQuantity("2.8"), 2);
});

test("invalid values do not produce NaN totals", () => {
    const itemTotal = Math.max(0, normalizeQuantity("abc") * normalizeMoney("Infinity") - normalizeMoney("NaN"));
    const saleTotal = Math.max(0, itemTotal - normalizeMoney("-10"));

    assert.equal(Number.isNaN(itemTotal), false);
    assert.equal(Number.isNaN(saleTotal), false);
});

test("payload-ready values are numbers, not strings", () => {
    const item = {
        quantity: normalizeQuantity("3"),
        unitPrice: normalizeMoney("19.9"),
        discount: normalizeMoney("0.5"),
    };
    const payment = { amount: normalizeMoney("59.2") };

    assert.equal(typeof item.quantity, "number");
    assert.equal(typeof item.unitPrice, "number");
    assert.equal(typeof item.discount, "number");
    assert.equal(typeof payment.amount, "number");
});
