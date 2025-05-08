package com.bva.maria_persistence.repository;

import com.bva.maria_persistence.entities.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {

    Country findByName(String name);
}
