package com.distribuidora.system_oficina.config;

import java.util.Map;

public class ResourceInUseException extends RuntimeException {

    private final String code;
    private final String resource;
    private final Map<String, Object> dependencies;

    public ResourceInUseException(String code, String resource, String message, Map<String, Object> dependencies) {
        super(message);
        this.code = code;
        this.resource = resource;
        this.dependencies = dependencies;
    }

    public String getCode() {
        return code;
    }

    public String getResource() {
        return resource;
    }

    public Map<String, Object> getDependencies() {
        return dependencies;
    }
}
