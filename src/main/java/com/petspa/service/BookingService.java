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
import java.time.LocalTime;
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
        com.petspa.model.Service selectedService = findServiceById(serviceId);
        List<User> assignedStaff = resolveAssignedStaff(dto);

        validateStaffAvailability(null, booking.getBookingDate(), booking.getBookingTime(), selectedService, assignedStaff);

        applySingleService(booking, selectedService);
        booking.setAssignedStaff(assignedStaff);

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
        com.petspa.model.Service selectedService = null;
        if (serviceId != null) {
            selectedService = findServiceById(serviceId);
        } else {
            selectedService = getPrimaryService(booking);
        }

        List<User> assignedStaff = null;
        if (dto.getStaffIds() != null || dto.getStaffId() != null) {
            assignedStaff = resolveAssignedStaff(dto);
        } else {
            assignedStaff = getAssignedStaffForValidation(booking);
        }

        if (booking.getStatus() != Booking.BookingStatus.CANCELLED) {
            validateStaffAvailability(booking.getId(), booking.getBookingDate(), booking.getBookingTime(), selectedService, assignedStaff);
        }

        if (selectedService != null && serviceId != null) {
            applySingleService(booking, selectedService);
        }

        if (dto.getStaffIds() != null || dto.getStaffId() != null) {
            booking.setAssignedStaff(assignedStaff);
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
     * Deletes a booking permanently.
     */
    @Transactional
    public void deleteBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        bookingRepository.delete(booking);
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
    private void applySingleService(Booking booking, com.petspa.model.Service service) {

        booking.getBookingDetails().clear();

        BookingDetail detail = BookingDetail.builder()
                .service(service)
                .price(service.getPrice())
                .build();
        booking.addBookingDetail(detail);
    }

    /**
     * Gets service by ID with not-found validation.
     */
    private com.petspa.model.Service findServiceById(Long serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));
    }

    /**
     * Gets the primary selected service from an existing booking.
     */
    private com.petspa.model.Service getPrimaryService(Booking booking) {
        if (booking.getBookingDetails() == null || booking.getBookingDetails().isEmpty()) {
            throw new RuntimeException("Booking must contain one service");
        }

        BookingDetail detail = booking.getBookingDetails().get(0);
        if (detail.getService() == null) {
            throw new RuntimeException("Booking service is missing");
        }

        return detail.getService();
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
     * Returns assigned staff from booking relation with legacy fallback.
     */
    private List<User> getAssignedStaffForValidation(Booking booking) {
        List<User> assigned = booking.getStaffAssignments().stream()
                .map(assignment -> assignment.getStaff())
                .filter(staff -> staff != null)
                .collect(Collectors.toList());

        if (assigned.isEmpty() && booking.getStaff() != null) {
            assigned = List.of(booking.getStaff());
        }

        return assigned;
    }

    /**
     * Validates that assigned staff are not occupied by overlapping bookings.
     */
    private void validateStaffAvailability(Long currentBookingId,
                                           LocalDate bookingDate,
                                           LocalTime bookingTime,
                                           com.petspa.model.Service selectedService,
                                           List<User> assignedStaff) {
        if (bookingDate == null || bookingTime == null || selectedService == null || assignedStaff == null || assignedStaff.isEmpty()) {
            return;
        }

        int durationMinutes = selectedService.getDurationMinutes() != null
                ? Math.max(1, selectedService.getDurationMinutes())
                : 1;
        LocalTime requestedEnd = bookingTime.plusMinutes(durationMinutes);

        for (User staff : assignedStaff) {
            if (staff == null || staff.getId() == null) {
                continue;
            }

            List<Booking> existingBookings = bookingRepository.findByAssignedStaffIdAndBookingDate(staff.getId(), bookingDate);
            for (Booking existing : existingBookings) {
                if (existing.getId() == null) {
                    continue;
                }

                if (currentBookingId != null && currentBookingId.equals(existing.getId())) {
                    continue;
                }

                if (existing.getStatus() == Booking.BookingStatus.CANCELLED) {
                    continue;
                }

                com.petspa.model.Service existingService = getPrimaryService(existing);
                int existingDuration = existingService.getDurationMinutes() != null
                        ? Math.max(1, existingService.getDurationMinutes())
                        : 1;

                LocalTime existingStart = existing.getBookingTime();
                LocalTime existingEnd = existingStart.plusMinutes(existingDuration);

                if (isOverlappingRange(bookingTime, requestedEnd, existingStart, existingEnd)) {
                    throw new RuntimeException("Staff " + staff.getFullName() +
                            " is already assigned from " + existingStart + " to " + existingEnd +
                            " on " + bookingDate);
                }
            }
        }
    }

    /**
     * Determines whether two time windows overlap. Ranges are [start, end).
     */
    private boolean isOverlappingRange(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && startB.isBefore(endA);
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
