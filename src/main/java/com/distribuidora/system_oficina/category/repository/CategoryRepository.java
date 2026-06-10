package com.distribuidora.system_oficina.category.repository;

import org.springframework.stereotype.Repository;
import com.distribuidora.system_oficina.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;




@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    public Category findByName(String name);
    
}
