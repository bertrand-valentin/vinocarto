package com.bva.persistence.repository;

import com.bva.persistence.entities.Appellation;
import com.bva.vinocarto_core.model.Colour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppellationRepository extends JpaRepository<Appellation, Long> {

    Appellation findByName(String name);

    List<Appellation> findAllByRegion_NameAndColour(String regionName, Colour colour);
}
