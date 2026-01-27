package com.petspa.service;

import com.petspa.dto.ServiceDTO;
import com.petspa.model.Service;
import com.petspa.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service Service - Manages spa services.
 * 
 * Note: Named "ServiceService" because "Service" is the entity name.
 */
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ServiceService {

    private final ServiceRepository serviceRepository;

    /**
     * Gets all services.
     */
    public List<ServiceDTO> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets all active services.
     */
    public List<ServiceDTO> getAllActiveServices() {
        return serviceRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets a service by ID.
     */
    public ServiceDTO getServiceById(Long id) {
        return serviceRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Service not found: " + id));
    }

    /**
     * Creates a new service.
     */
    @Transactional
    public ServiceDTO createService(ServiceDTO dto) {
        Service service = Service.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .durationMinutes(dto.getDurationMinutes())
                .isActive(true)
                .build();

        Service saved = serviceRepository.save(service);
        return toDTO(saved);
    }

    /**
     * Updates an existing service.
     */
    @Transactional
    public ServiceDTO updateService(ServiceDTO dto) {
        Service service = serviceRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Service not found: " + dto.getId()));

        service.setName(dto.getName());
        service.setDescription(dto.getDescription());
        service.setPrice(dto.getPrice());
        service.setDurationMinutes(dto.getDurationMinutes());
        
        if (dto.getIsActive() != null) {
            service.setIsActive(dto.getIsActive());
        }

        Service saved = serviceRepository.save(service);
        return toDTO(saved);
    }

    /**
     * Deactivates a service (soft delete).
     */
    @Transactional
    public void deactivateService(Long id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found: " + id));
        
        service.setIsActive(false);
        serviceRepository.save(service);
    }

    /**
     * Converts Service entity to ServiceDTO.
     */
    private ServiceDTO toDTO(Service service) {
        return ServiceDTO.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .durationMinutes(service.getDurationMinutes())
                .isActive(service.getIsActive())
                .build();
    }
}
