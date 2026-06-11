package com.distribuidora.system_oficina.category.repository;

import com.distribuidora.system_oficina.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    public Category findByName(String name);
    
}
