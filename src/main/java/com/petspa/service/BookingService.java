package com.petspa.service;

import com.petspa.dto.BookingDTO;
import com.petspa.dto.BookingDetailDTO;
import com.petspa.model.Booking;
import com.petspa.model.BookingDetail;
import com.petspa.model.Customer;
import com.petspa.model.Pet;
import com.petspa.model.User;
import com.petspa.repository.BookingRepository;
import com.petspa.repository.CustomerRepository;
import com.petspa.repository.PetRepository;
import com.petspa.repository.ServiceRepository;
import com.petspa.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Booking Service - Manages bookings/appointments.
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Gets all bookings.
     */
    @Transactional(readOnly = true)
    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets all bookings for a specific date.
     */
    @Transactional(readOnly = true)
    public List<BookingDTO> getBookingsByDate(String dateStr) {
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        return bookingRepository.findByBookingDate(date).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets bookings for a staff member on a specific date.
     */
    @Transactional(readOnly = true)
    public List<BookingDTO> getBookingsByStaffAndDate(Long staffId, String dateStr) {
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        return bookingRepository.findByAssignedStaffIdAndBookingDate(staffId, date).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets bookings for a customer.
     */
    @Transactional(readOnly = true)
    public List<BookingDTO> getBookingsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets a booking by ID.
     */
    @Transactional(readOnly = true)
    public BookingDTO getBookingById(Long id) {
        return bookingRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));
    }

    /**
     * Creates a new booking.
     */
    @Transactional
    public BookingDTO createBooking(BookingDTO dto) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getCustomerId()));

        Pet pet = petRepository.findById(dto.getPetId())
                .orElseThrow(() -> new RuntimeException("Pet not found: " + dto.getPetId()));

        if (pet.getOwner() == null || !pet.getOwner().getId().equals(customer.getId())) {
            throw new RuntimeException("Selected pet does not belong to the selected customer");
        }

        if (dto.getBookingDate() == null || dto.getBookingTime() == null) {
            throw new RuntimeException("Booking date and time are required");
        }

        Booking booking = Booking.builder()
                .customer(customer)
                .pet(pet)
                .bookingDate(dto.getBookingDate())
                .bookingTime(dto.getBookingTime())
                .status(Booking.BookingStatus.PENDING)
                .build();

        Long serviceId = resolveSingleServiceId(dto, true);
        applySingleService(booking, serviceId);
        booking.setAssignedStaff(resolveAssignedStaff(dto));

        Booking saved = bookingRepository.save(booking);
        return toDTO(saved);
    }

    /**
     * Updates booking fields (customer, pet, date/time, service, staff assignments, status).
     */
    @Transactional
    public BookingDTO updateBooking(BookingDTO dto) {
        if (dto.getId() == null) {
            throw new RuntimeException("Booking ID is required");
        }

        Booking booking = bookingRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Booking not found: " + dto.getId()));

        if (dto.getCustomerId() != null) {
            Customer customer = customerRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found: " + dto.getCustomerId()));
            booking.setCustomer(customer);
        }

        if (dto.getPetId() != null) {
            Pet pet = petRepository.findById(dto.getPetId())
                    .orElseThrow(() -> new RuntimeException("Pet not found: " + dto.getPetId()));
            booking.setPet(pet);
        }

        if (booking.getCustomer() != null && booking.getPet() != null) {
            if (booking.getPet().getOwner() == null || !booking.getPet().getOwner().getId().equals(booking.getCustomer().getId())) {
                throw new RuntimeException("Selected pet does not belong to the selected customer");
            }
        }

        if (dto.getBookingDate() != null) {
            booking.setBookingDate(dto.getBookingDate());
        }

        if (dto.getBookingTime() != null) {
            booking.setBookingTime(dto.getBookingTime());
        }

        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            booking.setStatus(Booking.BookingStatus.valueOf(dto.getStatus()));
        }

        Long serviceId = resolveSingleServiceId(dto, false);
        if (serviceId != null) {
            applySingleService(booking, serviceId);
        }

        if (dto.getStaffIds() != null || dto.getStaffId() != null) {
            booking.setAssignedStaff(resolveAssignedStaff(dto));
        }

        Booking saved = bookingRepository.save(booking);
        return toDTO(saved);
    }

    /**
     * Updates booking status.
     */
    @Transactional
    public BookingDTO updateStatus(Long bookingId, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        booking.setStatus(Booking.BookingStatus.valueOf(status));
        Booking saved = bookingRepository.save(booking);
        return toDTO(saved);
    }

    /**
     * Cancels a booking.
     */
    @Transactional
    public BookingDTO cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        return toDTO(saved);
    }

    /**
     * Resolves the single selected service ID from legacy/new payload fields.
     */
    private Long resolveSingleServiceId(BookingDTO dto, boolean required) {
        if (dto.getServiceId() != null) {
            return dto.getServiceId();
        }

        List<BookingDetailDTO> serviceDetails = dto.getServices();
        if (serviceDetails == null || serviceDetails.isEmpty()) {
            if (required) {
                throw new RuntimeException("Exactly one service is required");
            }
            return null;
        }

        if (serviceDetails.size() != 1) {
            throw new RuntimeException("Exactly one service is allowed per booking");
        }

        Long serviceId = serviceDetails.get(0).getServiceId();
        if (serviceId == null) {
            throw new RuntimeException("Service ID is required");
        }

        return serviceId;
    }

    /**
     * Replaces booking service details with one selected service.
     */
    private void applySingleService(Booking booking, Long serviceId) {
        com.petspa.model.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));

        booking.getBookingDetails().clear();

        BookingDetail detail = BookingDetail.builder()
                .service(service)
                .price(service.getPrice())
                .build();
        booking.addBookingDetail(detail);
    }

    /**
     * Resolves unique valid staff users from DTO payload.
     */
    private List<User> resolveAssignedStaff(BookingDTO dto) {
        List<Long> candidateIds = new ArrayList<>();
        if (dto.getStaffIds() != null) {
            candidateIds.addAll(dto.getStaffIds());
        } else if (dto.getStaffId() != null) {
            candidateIds.add(dto.getStaffId());
        }

        if (candidateIds.isEmpty()) {
            return List.of();
        }

        Set<Long> uniqueIds = new LinkedHashSet<>();
        List<User> resolved = new ArrayList<>();
        for (Long staffId : candidateIds) {
            if (staffId == null || !uniqueIds.add(staffId)) {
                continue;
            }

            User staff = userRepository.findById(staffId)
                    .orElseThrow(() -> new RuntimeException("Staff not found: " + staffId));
            if (staff.getRole() != User.Role.STAFF) {
                throw new RuntimeException("User is not a staff account: " + staffId);
            }
            resolved.add(staff);
        }
        return resolved;
    }

    /**
     * Converts Booking entity to BookingDTO.
     */
    private BookingDTO toDTO(Booking booking) {
        List<BookingDetailDTO> detailDTOs = booking.getBookingDetails().stream()
                .map(detail -> BookingDetailDTO.builder()
                        .id(detail.getId())
                        .bookingId(booking.getId())
                        .serviceId(detail.getService().getId())
                        .serviceName(detail.getService().getName())
                        .price(detail.getPrice())
                        .durationMinutes(detail.getService().getDurationMinutes())
                        .build())
                .collect(Collectors.toList());

        List<Long> assignmentStaffIds = booking.getStaffAssignments().stream()
                .map(assignment -> assignment.getStaff().getId())
                .collect(Collectors.toList());

        List<String> assignmentStaffNames = booking.getStaffAssignments().stream()
                .map(assignment -> assignment.getStaff().getFullName())
                .collect(Collectors.toList());

        if (assignmentStaffIds.isEmpty() && booking.getStaff() != null) {
            assignmentStaffIds = List.of(booking.getStaff().getId());
            assignmentStaffNames = List.of(booking.getStaff().getFullName());
        }

        Long primaryStaffId = assignmentStaffIds.isEmpty() ? null : assignmentStaffIds.get(0);
        String primaryStaffName = assignmentStaffNames.isEmpty() ? null : assignmentStaffNames.get(0);
        Long serviceId = detailDTOs.isEmpty() ? null : detailDTOs.get(0).getServiceId();

        return BookingDTO.builder()
                .id(booking.getId())
                .customerId(booking.getCustomer().getId())
                .customerName(booking.getCustomer().getFullName())
                .customerPhone(booking.getCustomer().getPhoneNumber())
                .petId(booking.getPet().getId())
                .petName(booking.getPet().getName())
                .petSpecies(booking.getPet().getSpecies())
                .staffId(primaryStaffId)
                .staffName(primaryStaffName)
                .staffIds(assignmentStaffIds)
                .staffNames(assignmentStaffNames)
                .bookingDate(booking.getBookingDate())
                .bookingTime(booking.getBookingTime())
                .status(booking.getStatus().name())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
                .serviceId(serviceId)
                .services(detailDTOs)
                .build();
    }
}
