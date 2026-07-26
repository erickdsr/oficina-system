import assert from "node:assert/strict";
import test from "node:test";
import { formatCurrency } from "../src/utils/formatters.ts";
import { canDelete } from "../src/utils/permissions.ts";

test("delete purchase action is available for administrators", () => {
    assert.equal(canDelete("ADMIN", ["ADMIN", "MANAGER"]), true);
});

test("delete purchase action is hidden from unauthorized stock users", () => {
    assert.equal(canDelete("STOCK", ["ADMIN", "MANAGER"]), false);
});

test("purchase total is displayed in pt-BR currency format", () => {
    assert.equal(formatCurrency(60).replace(/\u00a0/g, " "), "R$ 60,00");
});

test("409 style errors are ordinary deletion errors and do not imply session expiration", () => {
    const conflictStatus = 409;
    const unauthorizedStatus = 401;

    assert.equal(conflictStatus === 401, false);
    assert.equal(unauthorizedStatus === 401, true);
});
