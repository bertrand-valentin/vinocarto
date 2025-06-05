package com.bva.backend_services.details.controller;

import com.bva.backend_services.details.service.RegionService;
import com.bva.vinocarto_core.model.RegionDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/region")
public class RegionController {

    private final RegionService regionService;

    public RegionController(RegionService regionService) {
        this.regionService = regionService;
    }

    @RequestMapping("/{name}")
    public ResponseEntity<String> getRegion(@PathVariable String name) {
        RegionDto appellation = regionService.getRegionByName(name);
        return new ResponseEntity<>(appellation.toString(), HttpStatus.OK);
    }

    @GetMapping("/region/{name}")
    public List<RegionDto> getRegionsByCountry(@PathVariable String name) {
        return regionService.getRegionsByCountry(name);
    }
}
