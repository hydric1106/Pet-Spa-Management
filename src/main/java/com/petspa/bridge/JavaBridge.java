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
    
    // Current logged-in user session
    private UserDTO currentUser;

    public JavaBridge(Gson gson, 
                      AuthService authService,
                      UserService userService,
                      CustomerService customerService,
                      PetService petService,
                      ServiceService serviceService,
                      BookingService bookingService,
                      ScheduleService scheduleService) {
        this.gson = gson;
        this.authService = authService;
        this.userService = userService;
        this.customerService = customerService;
        this.petService = petService;
        this.serviceService = serviceService;
        this.bookingService = bookingService;
        this.scheduleService = scheduleService;
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
    public String deactivateUser(Long userId) {
        try {
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

    // =============================================================================
    // PET MANAGEMENT
    // =============================================================================

    /**
     * Gets all pets for a specific customer.
     */
    public String getPetsByCustomer(Long customerId) {
        try {
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
    // SERVICE MANAGEMENT
    // =============================================================================

    /**
     * Gets all active services.
     */
    public String getAllServices() {
        try {
            return createSuccessResponse(serviceService.getAllActiveServices());
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

    // =============================================================================
    // BOOKING MANAGEMENT
    // =============================================================================

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
    public String getBookingsByStaff(Long staffId, String dateStr) {
        try {
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
     * Updates booking status.
     */
    public String updateBookingStatus(Long bookingId, String status) {
        try {
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
    public String getStaffSchedule(Long staffId) {
        try {
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
