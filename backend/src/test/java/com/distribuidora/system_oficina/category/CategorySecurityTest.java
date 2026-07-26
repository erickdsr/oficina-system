package com.distribuidora.system_oficina.category;

import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.distribuidora.system_oficina.category.service.CategoryService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CategorySecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryService categoryService;

    @Test
    void shouldAllowAdminToDeleteCategory() throws Exception {
        mockMvc.perform(delete("/categories/{id}", 1)
                .with(user("admin@email.com").roles("ADMIN")))
                .andExpect(status().isOk());

        verify(categoryService).deleteCategory(1);
    }

    @Test
    void shouldDenySalespersonFromDeletingCategory() throws Exception {
        mockMvc.perform(delete("/categories/{id}", 1)
                        .with(user("seller@email.com").roles("SALESPERSON")))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldSoftDeleteWhenCategoryHasProducts() throws Exception {
        mockMvc.perform(delete("/categories/{id}", 10)
                        .with(user("admin@email.com").roles("ADMIN")))
                .andExpect(status().isOk());

        verify(categoryService).deleteCategory(10);
    }

    @Test
    void shouldDenyUnauthenticatedUserFromDeletingCategory() throws Exception {
        mockMvc.perform(delete("/categories/{id}", 1).with(anonymous()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAdminToForceDeleteCategory() throws Exception {
        mockMvc.perform(delete("/categories/{id}/force", 1)
                .with(user("admin@email.com").roles("ADMIN")))
                .andExpect(status().isOk());

        verify(categoryService).forceDeleteCategory(1);
    }

    @Test
    void shouldDenyManagerFromForceDeletingCategory() throws Exception {
        mockMvc.perform(delete("/categories/{id}/force", 1)
                        .with(user("manager@email.com").roles("MANAGER")))
                .andExpect(status().isForbidden());
    }
}
