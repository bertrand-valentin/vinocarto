package com.bva.backend_services.service;

import com.bva.maria_persistence.entities.Appellation;
import com.bva.maria_persistence.repository.AppellationRepository;
import com.bva.vinocarto_core.model.AppellationDto;
import com.bva.vinocarto_core.model.Colour;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppellationService {

    private final AppellationRepository appellationRepository;

    public AppellationService(AppellationRepository appellationRepository) {
        this.appellationRepository = appellationRepository;
    }

    public AppellationDto getAppellationById(Long id) {return appellationRepository.getReferenceById(id).toDto();}
    public List<AppellationDto> getAllAppellations() {return appellationRepository.findAll().stream().map(Appellation::toDto).toList();};
    public AppellationDto getAppellationByName(String name) {return appellationRepository.findByName(name.toUpperCase()).toDto();}
    public List<AppellationDto> getAppelationsByRegionAndColour(String regionName, Colour colour) {return appellationRepository.findAllByRegion_NameAndColour(regionName.toUpperCase(), colour).stream().map(Appellation::toDto).toList();}
}
