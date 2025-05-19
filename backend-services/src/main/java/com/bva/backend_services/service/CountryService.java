package com.bva.backend_services.service;

import com.bva.persistence.entities.Country;
import com.bva.persistence.repository.CountryRepository;
import com.bva.vinocarto_core.model.CountryDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CountryService {

    private final CountryRepository countryRepository;

    public CountryService(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    public CountryDto getCountryById(Long id) {return countryRepository.getReferenceById(id).toDto();}
    public List<CountryDto> getAllCountries() {return countryRepository.findAll().stream().map(Country::toDto).toList();};
    public CountryDto getCountryByName(String name) {return countryRepository.findByName(name.toUpperCase()).toDto();}
}
