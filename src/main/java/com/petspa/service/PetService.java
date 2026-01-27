package com.petspa.service;

import com.petspa.dto.PetDTO;
import com.petspa.model.Customer;
import com.petspa.model.Pet;
import com.petspa.repository.CustomerRepository;
import com.petspa.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Pet Service - Manages pet data.
 */
@Service
@RequiredArgsConstructor
public class PetService {

    private final PetRepository petRepository;
    private final CustomerRepository customerRepository;

    /**
     * Gets all pets for a customer.
     */
    public List<PetDTO> getPetsByCustomerId(Long customerId) {
        return petRepository.findByOwnerId(customerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets a pet by ID.
     */
    public PetDTO getPetById(Long id) {
        return petRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Pet not found: " + id));
    }

    /**
     * Creates a new pet.
     */
    @Transactional
    public PetDTO createPet(PetDTO dto) {
        Customer owner = customerRepository.findById(dto.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getOwnerId()));

        Pet pet = Pet.builder()
                .owner(owner)
                .name(dto.getName())
                .species(dto.getSpecies())
                .breed(dto.getBreed())
                .age(dto.getAge())
                .weight(dto.getWeight())
                .notes(dto.getNotes())
                .build();

        Pet saved = petRepository.save(pet);
        return toDTO(saved);
    }

    /**
     * Updates an existing pet.
     */
    @Transactional
    public PetDTO updatePet(PetDTO dto) {
        Pet pet = petRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Pet not found: " + dto.getId()));

        pet.setName(dto.getName());
        pet.setSpecies(dto.getSpecies());
        pet.setBreed(dto.getBreed());
        pet.setAge(dto.getAge());
        pet.setWeight(dto.getWeight());
        pet.setNotes(dto.getNotes());

        Pet saved = petRepository.save(pet);
        return toDTO(saved);
    }

    /**
     * Deletes a pet.
     */
    @Transactional
    public void deletePet(Long id) {
        if (!petRepository.existsById(id)) {
            throw new RuntimeException("Pet not found: " + id);
        }
        petRepository.deleteById(id);
    }

    /**
     * Converts Pet entity to PetDTO.
     */
    private PetDTO toDTO(Pet pet) {
        return PetDTO.builder()
                .id(pet.getId())
                .ownerId(pet.getOwner().getId())
                .ownerName(pet.getOwner().getFullName())
                .name(pet.getName())
                .species(pet.getSpecies())
                .breed(pet.getBreed())
                .age(pet.getAge())
                .weight(pet.getWeight())
                .notes(pet.getNotes())
                .createdAt(pet.getCreatedAt())
                .build();
    }
}
