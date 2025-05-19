package com.bva.persistence.repository;

import com.bva.persistence.entities.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionRepository extends JpaRepository<Region, Long> {

    Region findByName(String name);

    List<Region> findAllByCountry_Name(String countryName);
}
