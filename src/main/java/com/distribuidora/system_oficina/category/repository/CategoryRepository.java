package com.distribuidora.system_oficina.category.repository;

import com.distribuidora.system_oficina.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findByName(String name);
    
}
