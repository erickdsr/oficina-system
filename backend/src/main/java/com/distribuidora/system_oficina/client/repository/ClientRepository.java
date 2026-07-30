package com.distribuidora.system_oficina.client.repository;

import com.distribuidora.system_oficina.client.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository <Client, Integer> {

    interface CityFilterOptionProjection {
        String getState();
        String getCity();
        long getClientCount();
    }

    List<Client> findByName(String name);
    Optional<Client> findByCpfCnpj(String cpfCnpj); 
    List<Client> findByStatus(Boolean status); 
    long countByStatus(Boolean status);

    @Query("""
            select
                upper(trim(c.state)) as state,
                lower(trim(c.city)) as city,
                count(c.id) as clientCount
            from Client c
            where c.city is not null
              and trim(c.city) <> ''
              and c.state is not null
              and trim(c.state) <> ''
              and (:statesEmpty = true or upper(trim(c.state)) in :states)
              and (:status is null or c.status = :status)
            group by upper(trim(c.state)), lower(trim(c.city))
            order by upper(trim(c.state)) asc, lower(trim(c.city)) asc
            """)
    List<CityFilterOptionProjection> findCityFilterOptions(
            @Param("states") List<String> states,
            @Param("statesEmpty") boolean statesEmpty,
            @Param("status") Boolean status);
}
