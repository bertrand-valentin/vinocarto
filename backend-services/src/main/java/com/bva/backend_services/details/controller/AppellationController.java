package com.bva.backend_services.details.controller;

import com.bva.backend_services.details.service.AppellationService;
import com.bva.vinocarto_core.model.AppellationDto;
import com.bva.vinocarto_core.model.Colour;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/appellation")
public class AppellationController {

    private final AppellationService appellationService;

    public AppellationController(AppellationService appellationService) {
        this.appellationService = appellationService;
    }

    @RequestMapping("/{name}")
    public ResponseEntity<String> getAppellation(@PathVariable String name) {
        AppellationDto appellation = appellationService.getAppellationByName(name);
        return new ResponseEntity<>(appellation.toString(), HttpStatus.OK);
    }

    @GetMapping("/region/{name}/{colour}")
    public List<AppellationDto> getAppellationByRegion(@PathVariable String name, @PathVariable String colour) {
        return appellationService.getAppelationsByRegionAndColour(name, Colour.valueOf(colour.toUpperCase()));
    }
}
