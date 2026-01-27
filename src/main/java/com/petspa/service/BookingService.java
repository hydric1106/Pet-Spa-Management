package com.petspa.service;

import com.petspa.dto.BookingDTO;
import com.petspa.dto.BookingDetailDTO;
import com.petspa.model.*;
import com.petspa.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Booking Service - Manages bookings/appointments.
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final CustomerRepository customerRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Gets all bookings for a specific date.
     */
    public List<BookingDTO> getBookingsByDate(String dateStr) {
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        return bookingRepository.findByBookingDate(date).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets bookings for a staff member on a specific date.
     */
    public List<BookingDTO> getBookingsByStaffAndDate(Long staffId, String dateStr) {
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        return bookingRepository.findByStaffIdAndBookingDate(staffId, date).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets bookings for a customer.
     */
    public List<BookingDTO> getBookingsByCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets a booking by ID.
     */
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
        
        User staff = null;
        if (dto.getStaffId() != null) {
            staff = userRepository.findById(dto.getStaffId())
                    .orElseThrow(() -> new RuntimeException("Staff not found: " + dto.getStaffId()));
        }

        Booking booking = Booking.builder()
                .customer(customer)
                .pet(pet)
                .staff(staff)
                .bookingDate(dto.getBookingDate())
                .bookingTime(dto.getBookingTime())
                .status(Booking.BookingStatus.PENDING)
                .build();

        // Add services
        if (dto.getServices() != null) {
            for (BookingDetailDTO detailDTO : dto.getServices()) {
                com.petspa.model.Service service = serviceRepository.findById(detailDTO.getServiceId())
                        .orElseThrow(() -> new RuntimeException("Service not found: " + detailDTO.getServiceId()));
                
                BookingDetail detail = BookingDetail.builder()
                        .service(service)
                        .price(service.getPrice())
                        .build();
                
                booking.addBookingDetail(detail);
            }
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
    public BookingDTO cancelBooking(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelReason(reason);
        Booking saved = bookingRepository.save(booking);
        return toDTO(saved);
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

        return BookingDTO.builder()
                .id(booking.getId())
                .customerId(booking.getCustomer().getId())
                .customerName(booking.getCustomer().getFullName())
                .customerPhone(booking.getCustomer().getPhoneNumber())
                .petId(booking.getPet().getId())
                .petName(booking.getPet().getName())
                .petSpecies(booking.getPet().getSpecies())
                .staffId(booking.getStaff() != null ? booking.getStaff().getId() : null)
                .staffName(booking.getStaff() != null ? booking.getStaff().getFullName() : null)
                .bookingDate(booking.getBookingDate())
                .bookingTime(booking.getBookingTime())
                .status(booking.getStatus().name())
                .cancelReason(booking.getCancelReason())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
                .services(detailDTOs)
                .build();
    }
}
