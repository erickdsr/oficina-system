package com.distribuidora.system_oficina.config;

import java.util.Map;

public record ApiErrorResponse(
        int status,
        String code,
        String resource,
        String message,
        Map<String, Object> dependencies,
        Map<String, Object> details) {

    public ApiErrorResponse(int status, String code, String message) {
        this(status, code, null, message, null, null);
    }

    public ApiErrorResponse(int status, String code, String resource, String message, Map<String, Object> dependencies) {
        this(status, code, resource, message, dependencies, dependencies);
    }
}
