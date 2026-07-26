import assert from "node:assert/strict";
import test from "node:test";
import {
    buildAuthorizationHeader,
    normalizeAccessToken,
    shouldClearAuthenticationForStatus,
} from "../src/services/auth-token.ts";

test("normalizes access token without Bearer prefix", () => {
    assert.equal(normalizeAccessToken("Bearer abc.def.ghi"), "abc.def.ghi");
    assert.equal(normalizeAccessToken("abc.def.ghi"), "abc.def.ghi");
});

test("builds a single Authorization Bearer header", () => {
    assert.equal(buildAuthorizationHeader("abc.def.ghi"), "Bearer abc.def.ghi");
    assert.equal(buildAuthorizationHeader("Bearer abc.def.ghi"), "Bearer abc.def.ghi");
});

test("does not generate Bearer Bearer headers", () => {
    assert.notEqual(buildAuthorizationHeader("Bearer abc.def.ghi"), "Bearer Bearer abc.def.ghi");
});

test("only 401 clears authentication", () => {
    assert.equal(shouldClearAuthenticationForStatus(401), true);
    assert.equal(shouldClearAuthenticationForStatus(403), false);
    assert.equal(shouldClearAuthenticationForStatus(409), false);
    assert.equal(shouldClearAuthenticationForStatus(500), false);
});
