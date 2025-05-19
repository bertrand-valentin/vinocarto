package com.bva.persistence.repository;

import com.bva.persistence.entities.Detail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetailRepository extends JpaRepository<Detail, Long> {

    public List<Detail> findAllByMapReadyTrue();
}
