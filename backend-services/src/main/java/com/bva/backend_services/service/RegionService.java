package com.bva.backend_services.service;

import com.bva.persistence.entities.Region;
import com.bva.persistence.repository.RegionRepository;
import com.bva.vinocarto_core.model.RegionDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RegionService {

    private final RegionRepository regionRepository;

    public RegionService(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    public RegionDto getRegionById(Long id) {return regionRepository.getReferenceById(id).toDto();}
    public List<RegionDto> getAllRegions() {return regionRepository.findAll().stream().map(Region::toDto).toList();};
    public RegionDto getRegionByName(String name) {return regionRepository.findByName(name.toUpperCase()).toDto();}
    public List<RegionDto> getRegionsByCountry(String regionName) {return regionRepository.findAllByCountry_Name(regionName.toUpperCase()).stream().map(Region::toDto).toList();}
}
