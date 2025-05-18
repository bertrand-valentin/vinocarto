package com.bva.backend_services.controller;

import com.bva.backend_services.service.DetailService;
import com.bva.vinocarto_core.model.CountryDto;
import com.bva.vinocarto_core.model.DetailDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/detail")
@CrossOrigin(origins = "*")
public class DetailController {

    private final DetailService detailService;

    public DetailController(DetailService detailService) {
        this.detailService = detailService;
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<DetailDto> getDetail(@PathVariable Long id) {
        DetailDto detail = detailService.getDetailById(id);
        return new ResponseEntity<>(detail, HttpStatus.OK);
    }

    @GetMapping("/all")
    public List<DetailDto> getAllDetails() {return detailService.getAllDetails();}
}
