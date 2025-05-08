package com.bva.backend_services.controller;

import com.bva.backend_services.service.CountryService;
import com.bva.vinocarto_core.model.CountryDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/country")
public class CountryController {

    private final CountryService countryService;

    public CountryController(CountryService countryService) {
        this.countryService = countryService;
    }

    @RequestMapping("/{name}")
    public ResponseEntity<String> getCountry(@PathVariable String name) {
        CountryDto country = countryService.getCountryByName(name);
        return new ResponseEntity<>(country.toString(), HttpStatus.OK);
    }

    @GetMapping("/all")
    public List<CountryDto> getAllCountries() {
        return countryService.getAllCountries();
    }
}
