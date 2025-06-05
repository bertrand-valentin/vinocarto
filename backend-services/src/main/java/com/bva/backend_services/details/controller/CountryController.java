package com.bva.backend_services.details.controller;

import com.bva.backend_services.details.service.CountryService;
import com.bva.vinocarto_core.model.CountryDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/country")
@CrossOrigin(origins = "*")
public class CountryController {

    private final CountryService countryService;

    public CountryController(CountryService countryService) {
        this.countryService = countryService;
    }

    @RequestMapping("/name/{name}")
    public ResponseEntity<CountryDto> getCountry(@PathVariable String name) {
        CountryDto country = countryService.getCountryByName(name);
        return new ResponseEntity<>(country, HttpStatus.OK);
    }

    @RequestMapping("/id/{id}")
    public ResponseEntity<CountryDto> getCountry(@PathVariable Long id) {
        CountryDto country = countryService.getCountryById(id);
        return new ResponseEntity<>(country, HttpStatus.OK);
    }

    @GetMapping("/all")
    public List<CountryDto> getAllCountries() {
        return countryService.getAllCountries();
    }
}
