package com.bva.backend_services.service;

import com.bva.persistence.entities.Detail;
import com.bva.persistence.repository.DetailRepository;
import com.bva.vinocarto_core.model.DetailDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetailService {

    private final DetailRepository detailRepository;

    public DetailService(DetailRepository detailRepository) {
        this.detailRepository = detailRepository;
    }

    public DetailDto getDetailById(Long id) {
        return detailRepository.getReferenceById(id).toDto();
    }

    public List<DetailDto> getAllDetailsWithMapReady() {
        return detailRepository.findAllByMapReadyTrue().stream().map(Detail::toDto).toList();
    }
}
