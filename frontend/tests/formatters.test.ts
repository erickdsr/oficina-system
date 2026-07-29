import assert from "node:assert/strict";
import test from "node:test";
import { formatCpf, formatCnpj, formatCpfCnpj, formatPhone } from "../src/utils/formatters.ts";

test("formatCpf formats 11 digit documents", () => {
    assert.equal(formatCpf("31245678920"), "312.456.789-20");
    assert.equal(formatCpf("312.456.789-20"), "312.456.789-20");
});

test("formatCnpj formats 14 digit documents", () => {
    assert.equal(formatCnpj("12458998000110"), "12.458.998/0001-10");
    assert.equal(formatCpfCnpj("12458998000110"), "12.458.998/0001-10");
});

test("formatPhone formats fixed and mobile phone numbers", () => {
    assert.equal(formatPhone("19932348800"), "(19) 93234-8800");
    assert.equal(formatPhone("1932348800"), "(19) 3234-8800");
});

test("formatters handle empty values", () => {
    assert.equal(formatCpfCnpj(null), "Nao informado");
    assert.equal(formatPhone(undefined), "Nao informado");
});
