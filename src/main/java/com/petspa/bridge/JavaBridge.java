package com.petspa.bridge;

import com.google.gson.Gson;
import com.petspa.config.SpringContext;
import com.petspa.dto.*;
import com.petspa.service.*;
import javafx.application.Platform;
import org.springframework.stereotype.Component;

/**
 * JavaBridge - The communication bridge between JavaScript (WebView) and Java.
 * 
 * This class is injected into the WebView's JavaScript context, allowing
 * JavaScript code to call Java methods directly.
 * 
 * Usage in JavaScript:
 *   window.javaBridge.login(email, password, callbackFn);
 *   window.javaBridge.getAllCustomers(callbackFn);
 * 
 * Important Notes:
 * - All methods called from JS run on the JavaFX Application Thread
 * - Long-running operations should be executed asynchronously
 * - Results are returned as JSON strings via callback functions
 */
@Component
public class JavaBridge {

    private final Gson gson;
    
    // Services - Injected via Spring
    private final AuthService authService;
    private final UserService userService;
    private final CustomerService customerService;
    private final PetService petService;
    private final ServiceService serviceService;
    private final BookingService bookingService;
    private final ScheduleService scheduleService;
    private final ProductService productService;
    private final SalesOrderService salesOrderService;
    
    // Current logged-in user session
    private UserDTO currentUser;

    public JavaBridge(Gson gson, 
                      AuthService authService,
                      UserService userService,
                      CustomerService customerService,
                      PetService petService,
                      ServiceService serviceService,
                      BookingService bookingService,
                      ScheduleService scheduleService,
                      ProductService productService,
                      SalesOrderService salesOrderService) {
        this.gson = gson;
        this.authService = authService;
        this.userService = userService;
        this.customerService = customerService;
        this.petService = petService;
        this.serviceService = serviceService;
        this.bookingService = bookingService;
        this.scheduleService = scheduleService;
        this.productService = productService;
        this.salesOrderService = salesOrderService;
    }

    // =============================================================================
    // AUTHENTICATION
    // =============================================================================

    /**
     * Authenticates user with email and password.
     * 
     * @param email user's email
     * @param password user's password
     * @return JSON string with login result {success: boolean, user: UserDTO, message: string}
     */
    public String login(String email, String password) {
        try {
            UserDTO user = authService.authenticate(email, password);
            if (user != null) {
                this.currentUser = user;
                return createSuccessResponse(user);
            } else {
                return createErrorResponse("Invalid email or password");
            }
        } catch (Exception e) {
            return createErrorResponse("Login failed: " + e.getMessage());
        }
    }

    /**
     * Logs out the current user.
     */
    public String logout() {
        this.currentUser = null;
        return createSuccessResponse("Logged out successfully");
    }

    /**
     * Gets the current logged-in user.
     */
    public String getCurrentUser() {
        if (currentUser != null) {
            return createSuccessResponse(currentUser);
        }
        return createErrorResponse("No user logged in");
    }

    // =============================================================================
    // USER MANAGEMENT (Admin only)
    // =============================================================================

    /**
     * Gets all users (Admin and Staff accounts).
     */
    public String getAllUsers() {
        try {
            return createSuccessResponse(userService.getAllUsers());
        } catch (Exception e) {
            return createErrorResponse("Failed to get users: " + e.getMessage());
        }
    }

    /**
     * Creates a new user (Admin/Staff).
     */
    public String createUser(String userJson) {
        try {
            UserDTO userDTO = gson.fromJson(userJson, UserDTO.class);
            UserDTO created = userService.createUser(userDTO);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to create user: " + e.getMessage());
        }
    }

    /**
     * Updates an existing user.
     */
    public String updateUser(String userJson) {
        try {
            UserDTO userDTO = gson.fromJson(userJson, UserDTO.class);
            UserDTO updated = userService.updateUser(userDTO);
            return createSuccessResponse(updated);
        } catch (Exception e) {
            return createErrorResponse("Failed to update user: " + e.getMessage());
        }
    }

    /**
     * Deactivates a user account (soft delete).
     */
    public String deactivateUser(Object userIdRaw) {
        try {
            Long userId = parsePositiveLongId(userIdRaw, "userId");
            userService.deactivateUser(userId);
            return createSuccessResponse("User deactivated successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to deactivate user: " + e.getMessage());
        }
    }

    // =============================================================================
    // CUSTOMER CRM MANAGEMENT
    // =============================================================================

    /**
     * Gets all customers.
     */
    public String getAllCustomers() {
        try {
            return createSuccessResponse(customerService.getAllCustomers());
        } catch (Exception e) {
            return createErrorResponse("Failed to get customers: " + e.getMessage());
        }
    }

    /**
     * Searches customers by phone number.
     */
    public String searchCustomerByPhone(String phoneNumber) {
        try {
            return createSuccessResponse(customerService.findByPhoneNumber(phoneNumber));
        } catch (Exception e) {
            return createErrorResponse("Failed to search customer: " + e.getMessage());
        }
    }

    /**
     * Creates a new customer.
     */
    public String createCustomer(String customerJson) {
        try {
            CustomerDTO customerDTO = gson.fromJson(customerJson, CustomerDTO.class);
            CustomerDTO created = customerService.createCustomer(customerDTO);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to create customer: " + e.getMessage());
        }
    }

    /**
     * Updates an existing customer.
     */
    public String updateCustomer(String customerJson) {
        try {
            CustomerDTO customerDTO = gson.fromJson(customerJson, CustomerDTO.class);
            CustomerDTO updated = customerService.updateCustomer(customerDTO);
            return createSuccessResponse(updated);
        } catch (Exception e) {
            return createErrorResponse("Failed to update customer: " + e.getMessage());
        }
    }

    /**
     * Deletes a customer by ID.
     */
    public String deleteCustomer(Object customerIdRaw) {
        try {
            Long customerId = parsePositiveLongId(customerIdRaw, "customerId");
            customerService.deleteCustomer(customerId);
            return createSuccessResponse("Customer deleted successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to delete customer: " + e.getMessage());
        }
    }

    // =============================================================================
    // SERVICE MANAGEMENT
    // =============================================================================

    /**
     * Gets all services.
     */
    public String getAllServices() {
        try {
            return createSuccessResponse(serviceService.getAllServices());
        } catch (Exception e) {
            return createErrorResponse("Failed to get services: " + e.getMessage());
        }
    }

    /**
     * Creates a new service.
     */
    public String createService(String serviceJson) {
        try {
            ServiceDTO serviceDTO = gson.fromJson(serviceJson, ServiceDTO.class);
            ServiceDTO created = serviceService.createService(serviceDTO);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to create service: " + e.getMessage());
        }
    }

    /**
     * Updates an existing service.
     */
    public String updateService(String serviceJson) {
        try {
            ServiceDTO serviceDTO = gson.fromJson(serviceJson, ServiceDTO.class);
            ServiceDTO updated = serviceService.updateService(serviceDTO);
            return createSuccessResponse(updated);
        } catch (Exception e) {
            return createErrorResponse("Failed to update service: " + e.getMessage());
        }
    }

    /**
     * Deletes (deactivates) a service by ID.
     */
    public String deleteService(Object serviceIdRaw) {
        try {
            Long serviceId = parsePositiveLongId(serviceIdRaw, "serviceId");
            serviceService.deactivateService(serviceId);
            return createSuccessResponse("Service deleted successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to delete service: " + e.getMessage());
        }
    }

    // =============================================================================
    // RETAIL PRODUCT MANAGEMENT
    // =============================================================================

    /**
     * Gets all retail products.
     */
    public String getAllProducts() {
        try {
            return createSuccessResponse(productService.getAllProducts());
        } catch (Exception e) {
            return createErrorResponse("Failed to get products: " + e.getMessage());
        }
    }

    /**
     * Creates a retail product.
     */
    public String createProduct(String productJson) {
        try {
            ProductItemDTO dto = gson.fromJson(productJson, ProductItemDTO.class);
            ProductItemDTO created = productService.createProduct(dto);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to create product: " + e.getMessage());
        }
    }

    /**
     * Updates a retail product.
     */
    public String updateProduct(String productJson) {
        try {
            ProductItemDTO dto = gson.fromJson(productJson, ProductItemDTO.class);
            ProductItemDTO updated = productService.updateProduct(dto);
            return createSuccessResponse(updated);
        } catch (Exception e) {
            return createErrorResponse("Failed to update product: " + e.getMessage());
        }
    }

    /**
     * Deactivates a retail product.
     */
    public String deactivateProduct(Object productIdRaw) {
        try {
            Long productId = parsePositiveLongId(productIdRaw, "productId");
            productService.deactivateProduct(productId);
            return createSuccessResponse("Product deactivated successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to deactivate product: " + e.getMessage());
        }
    }

    /**
     * Deletes a retail product (hard delete).
     */
    public String deleteProduct(Object productIdRaw) {
        try {
            Long productId = parsePositiveLongId(productIdRaw, "productId");
            productService.deleteProduct(productId);
            return createSuccessResponse("Product deleted successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to delete product: " + e.getMessage());
        }
    }

    // =============================================================================
    // RETAIL SALES MANAGEMENT
    // =============================================================================

    /**
     * Creates a sales order (retail checkout).
     */
    public String createSalesOrder(String orderJson) {
        try {
            SalesOrderCreateRequestDTO request = gson.fromJson(orderJson, SalesOrderCreateRequestDTO.class);
            if (currentUser == null || currentUser.getId() == null) {
                return createErrorResponse("No user logged in");
            }

            request.setSoldByUserId(currentUser.getId());
            SalesOrderDTO created = salesOrderService.createSalesOrder(request);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to create sales order: " + e.getMessage());
        }
    }

    /**
     * Gets sales orders by date.
     */
    public String getSalesByDate(String dateStr) {
        try {
            return createSuccessResponse(salesOrderService.getSalesByDate(dateStr));
        } catch (Exception e) {
            return createErrorResponse("Failed to get sales orders: " + e.getMessage());
        }
    }

    /**
     * Gets today's retail and combined revenue summary.
     */
    public String getTodayRevenueSummary() {
        try {
            return createSuccessResponse(salesOrderService.getTodayRevenueSummary());
        } catch (Exception e) {
            return createErrorResponse("Failed to get revenue summary: " + e.getMessage());
        }
    }

    /**
     * Gets revenue chart series for the dashboard.
     * @param rangeKey week | month | year
     */
    public String getRevenueSeries(String rangeKey) {
        try {
            return createSuccessResponse(salesOrderService.getRevenueSeries(rangeKey));
        } catch (Exception e) {
            return createErrorResponse("Failed to get revenue series: " + e.getMessage());
        }
    }

    // =============================================================================
    // PET MANAGEMENT
    // =============================================================================

    /**
     * Gets all pets.
     */
    public String getAllPets() {
        try {
            return createSuccessResponse(petService.getAllPets());
        } catch (Exception e) {
            return createErrorResponse("Failed to get pets: " + e.getMessage());
        }
    }

    /**
     * Deletes a pet by ID.
     */
    public String deletePet(Object petIdRaw) {
        try {
            Long petId = parsePositiveLongId(petIdRaw, "petId");
            petService.deletePet(petId);
            return createSuccessResponse("Pet deleted successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to delete pet: " + e.getMessage());
        }
    }

    /**
     * Gets all pets for a specific customer.
     */
    public String getPetsByCustomer(Object customerIdRaw) {
        try {
            Long customerId = parsePositiveLongId(customerIdRaw, "customerId");
            return createSuccessResponse(petService.getPetsByCustomerId(customerId));
        } catch (Exception e) {
            return createErrorResponse("Failed to get pets: " + e.getMessage());
        }
    }

    /**
     * Creates a new pet for a customer.
     */
    public String createPet(String petJson) {
        try {
            PetDTO petDTO = gson.fromJson(petJson, PetDTO.class);
            PetDTO created = petService.createPet(petDTO);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to create pet: " + e.getMessage());
        }
    }

    /**
     * Updates an existing pet.
     */
    public String updatePet(String petJson) {
        try {
            PetDTO petDTO = gson.fromJson(petJson, PetDTO.class);
            PetDTO updated = petService.updatePet(petDTO);
            return createSuccessResponse(updated);
        } catch (Exception e) {
            return createErrorResponse("Failed to update pet: " + e.getMessage());
        }
    }

    // =============================================================================
    // BOOKING MANAGEMENT
    // =============================================================================

    /**
     * Gets all bookings.
     */
    public String getAllBookings() {
        try {
            return createSuccessResponse(bookingService.getAllBookings());
        } catch (Exception e) {
            return createErrorResponse("Failed to get bookings: " + e.getMessage());
        }
    }

    /**
     * Gets a booking by ID.
     */
    public String getBookingById(Object bookingIdRaw) {
        try {
            Long bookingId = parsePositiveLongId(bookingIdRaw, "bookingId");
            return createSuccessResponse(bookingService.getBookingById(bookingId));
        } catch (Exception e) {
            return createErrorResponse("Failed to get booking: " + e.getMessage());
        }
    }

    /**
     * Cancels a booking.
     */
    public String cancelBooking(Object bookingIdRaw) {
        try {
            Long bookingId = parsePositiveLongId(bookingIdRaw, "bookingId");
            return createSuccessResponse(bookingService.cancelBooking(bookingId));
        } catch (Exception e) {
            return createErrorResponse("Failed to cancel booking: " + e.getMessage());
        }
    }

    /**
     * Deletes a booking by ID.
     */
    public String deleteBooking(Object bookingIdRaw) {
        try {
            Long bookingId = parsePositiveLongId(bookingIdRaw, "bookingId");
            bookingService.deleteBooking(bookingId);
            return createSuccessResponse("Booking deleted successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to delete booking: " + e.getMessage());
        }
    }

    /**
     * Gets all bookings for a specific date.
     */
    public String getBookingsByDate(String dateStr) {
        try {
            return createSuccessResponse(bookingService.getBookingsByDate(dateStr));
        } catch (Exception e) {
            return createErrorResponse("Failed to get bookings: " + e.getMessage());
        }
    }

    /**
     * Gets bookings assigned to a specific staff member.
     */
    public String getBookingsByStaff(Object staffIdRaw, String dateStr) {
        try {
            Long staffId = parsePositiveLongId(staffIdRaw, "staffId");
            return createSuccessResponse(bookingService.getBookingsByStaffAndDate(staffId, dateStr));
        } catch (Exception e) {
            return createErrorResponse("Failed to get staff bookings: " + e.getMessage());
        }
    }

    /**
     * Creates a new booking.
     */
    public String createBooking(String bookingJson) {
        try {
            BookingDTO bookingDTO = gson.fromJson(bookingJson, BookingDTO.class);
            BookingDTO created = bookingService.createBooking(bookingDTO);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to create booking: " + e.getMessage());
        }
    }

    /**
     * Updates booking details.
     */
    public String updateBooking(String bookingJson) {
        try {
            BookingDTO bookingDTO = gson.fromJson(bookingJson, BookingDTO.class);
            BookingDTO updated = bookingService.updateBooking(bookingDTO);
            return createSuccessResponse(updated);
        } catch (Exception e) {
            return createErrorResponse("Failed to update booking: " + e.getMessage());
        }
    }

    /**
     * Updates booking status.
     */
    public String updateBookingStatus(Object bookingIdRaw, String status) {
        try {
            Long bookingId = parsePositiveLongId(bookingIdRaw, "bookingId");
            BookingDTO updated = bookingService.updateStatus(bookingId, status);
            return createSuccessResponse(updated);
        } catch (Exception e) {
            return createErrorResponse("Failed to update booking: " + e.getMessage());
        }
    }

    // =============================================================================
    // SCHEDULE MANAGEMENT
    // =============================================================================

    /**
     * Gets available staff for a specific date and time.
     */
    public String getAvailableStaff(String dateStr, String timeStr) {
        try {
            return createSuccessResponse(scheduleService.getAvailableStaff(dateStr, timeStr));
        } catch (Exception e) {
            return createErrorResponse("Failed to get available staff: " + e.getMessage());
        }
    }

    /**
     * Gets schedule for a specific staff member.
     */
    public String getStaffSchedule(Object staffIdRaw) {
        try {
            Long staffId = parsePositiveLongId(staffIdRaw, "staffId");
            return createSuccessResponse(scheduleService.getScheduleByStaffId(staffId));
        } catch (Exception e) {
            return createErrorResponse("Failed to get schedule: " + e.getMessage());
        }
    }

    /**
     * Assigns a shift to a staff member.
     */
    public String assignShift(String scheduleJson) {
        try {
            StaffScheduleDTO scheduleDTO = gson.fromJson(scheduleJson, StaffScheduleDTO.class);
            StaffScheduleDTO created = scheduleService.assignShift(scheduleDTO);
            return createSuccessResponse(created);
        } catch (Exception e) {
            return createErrorResponse("Failed to assign shift: " + e.getMessage());
        }
    }

    /**
     * Removes a schedule entry by schedule ID.
     */
    public String removeSchedule(Object scheduleIdRaw) {
        try {
            Long scheduleId = parsePositiveLongId(scheduleIdRaw, "scheduleId");
            scheduleService.removeSchedule(scheduleId);
            return createSuccessResponse("Schedule removed successfully");
        } catch (Exception e) {
            return createErrorResponse("Failed to remove schedule: " + e.getMessage());
        }
    }

    /**
     * Gets all shift types.
     */
    public String getAllShiftTypes() {
        try {
            return createSuccessResponse(scheduleService.getAllShiftTypes());
        } catch (Exception e) {
            return createErrorResponse("Failed to get shift types: " + e.getMessage());
        }
    }

    // =============================================================================
    // NAVIGATION
    // =============================================================================

    /**
     * Navigates to a different page.
     * Called from JavaScript to request page change.
     */
    public void navigateTo(String page) {
        Platform.runLater(() -> {
            // Navigation will be handled by MainController
            SpringContext.getBean(com.petspa.controller.MainController.class).loadPage(page);
        });
    }

    /**
     * Loads an HTML component file from the resources/ui/components folder.
     * @param componentName The name of the component file (e.g., "admin_sidebar.html")
     * @return The HTML content of the component
     */
    public String loadComponent(String componentName) {
        try {
            String resourcePath = "/ui/components/" + componentName;
            java.io.InputStream inputStream = getClass().getResourceAsStream(resourcePath);
            if (inputStream == null) {
                return createErrorResponse("Component not found: " + componentName);
            }
            String content = new String(inputStream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            inputStream.close();
            return createSuccessResponse(content);
        } catch (Exception e) {
            return createErrorResponse("Failed to load component: " + e.getMessage());
        }
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Creates a standardized success response.
     */
    private String createSuccessResponse(Object data) {
        ApiResponse response = new ApiResponse(true, "Success", data);
        return gson.toJson(response);
    }

    /**
     * Safely parses an ID value received from JavaScript into a positive Long.
     * JavaFX bridge values may arrive as Number, String, or other JS-backed objects.
     */
    private Long parsePositiveLongId(Object rawId, String fieldName) {
        if (rawId == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        long parsed;

        if (rawId instanceof Number number) {
            double asDouble = number.doubleValue();
            if (!Double.isFinite(asDouble) || Math.floor(asDouble) != asDouble) {
                throw new IllegalArgumentException("Invalid " + fieldName + ": " + rawId);
            }
            parsed = number.longValue();
        } else {
            String rawText = String.valueOf(rawId).trim();
            if (rawText.isEmpty()) {
                throw new IllegalArgumentException(fieldName + " is required");
            }

            try {
                if (rawText.contains(".")) {
                    double asDouble = Double.parseDouble(rawText);
                    if (!Double.isFinite(asDouble) || Math.floor(asDouble) != asDouble) {
                        throw new IllegalArgumentException("Invalid " + fieldName + ": " + rawText);
                    }
                    parsed = (long) asDouble;
                } else {
                    parsed = Long.parseLong(rawText);
                }
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("Invalid " + fieldName + ": " + rawText);
            }
        }

        if (parsed <= 0) {
            throw new IllegalArgumentException(fieldName + " must be a positive number");
        }

        return parsed;
    }

    /**
     * Creates a standardized error response.
     */
    private String createErrorResponse(String message) {
        ApiResponse response = new ApiResponse(false, message, null);
        return gson.toJson(response);
    }

    /**
     * Standard API Response wrapper.
     */
    public record ApiResponse(boolean success, String message, Object data) {}
}
