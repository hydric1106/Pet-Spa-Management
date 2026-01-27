USE pbl3;

-- =================================================================================
-- PET SPA DATABASE MIGRATION 
-- =================================================================================

-- 1. SETUP & CLEANUP
-- ---------------------------------------------------------------------------------
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in order of dependency
DROP TABLE IF EXISTS booking_details;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS staff_schedule;
DROP TABLE IF EXISTS shift_types;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS customers; -- New table for CRM data
DROP TABLE IF EXISTS users;     -- Now strictly for Admin/Staff logins

SET FOREIGN_KEY_CHECKS = 1;

-- 2. CREATE TABLES
-- ---------------------------------------------------------------------------------

-- Bảng Users: CHỈ DÀNH CHO QUẢN LÝ VÀ NHÂN VIÊN (Người có quyền đăng nhập)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- Chỉ còn: 'ADMIN', 'STAFF'
    is_active BOOLEAN DEFAULT TRUE, -- Khóa tài khoản nhân viên thay vì xóa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Customers: KHÁCH HÀNG (Dữ liệu CRM, không có mật khẩu/đăng nhập)
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- Dùng SĐT để tra cứu khách
    email VARCHAR(100), -- Có thể null nếu khách không cung cấp
    address TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Services
CREATE TABLE services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Pets: Thuộc về Customers
CREATE TABLE pets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL, -- Liên kết với bảng CUSTOMERS
    name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    species VARCHAR(50),
    breed VARCHAR(50),
    age INT,
    weight FLOAT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Xóa khách hàng -> Xóa luôn hồ sơ thú cưng của họ
    FOREIGN KEY (owner_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Shift Types
CREATE TABLE shift_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Staff Schedule
CREATE TABLE staff_schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    shift_type_id INT NOT NULL,
    day_of_week INT NOT NULL,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_type_id) REFERENCES shift_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_schedule (staff_id, day_of_week, shift_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Bookings
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL, -- Khách hàng (người mua)
    pet_id BIGINT NOT NULL,      -- Thú cưng được làm dịch vụ
    staff_id BIGINT,             -- Nhân viên thực hiện (User)
    
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', 
    cancel_reason TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    
    total_price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Booking Details
CREATE TABLE booking_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SEED DATA
-- ---------------------------------------------------------------------------------

-- Tạo Account Login (Chỉ Admin và Staff)
INSERT INTO users (email, password, full_name, phone_number, role) VALUES 
('admin@petspa.com', '123456', 'Quản Trị Viên', '0901234567', 'ADMIN'),
('staff1@petspa.com', '123456', 'Nhân Viên A (Cắt Tỉa)', '0909999999', 'STAFF'),
('staff2@petspa.com', '123456', 'Nhân Viên B (Tắm)', '0908888888', 'STAFF');

-- Tạo Khách hàng mẫu (Không có login info)
INSERT INTO customers (full_name, phone_number, email, address) VALUES 
('Nguyễn Văn Khách', '0912345678', 'khach@gmail.com', '123 Đường ABC, Đà Nẵng'),
('Trần Thị B', '0987654321', NULL, '456 Đường XYZ, Đà Nẵng');

-- Tạo Dịch vụ
INSERT INTO services (name, description, price, duration_minutes) VALUES 
('Tắm Thú Cưng', 'Tắm sạch, sấy khô', 150000, 45),
('Cắt Tỉa Lông', 'Cắt tạo kiểu', 300000, 90),
('Combo Tắm + Cắt', 'Tiết kiệm hơn', 400000, 120);

-- Tạo Thú cưng (Gắn với Customer ID = 1)
INSERT INTO pets (owner_id, name, species, breed, age, weight) VALUES 
(1, 'Milu', 'Dog', 'Poodle', 2, 5.5),
(1, 'Mimi', 'Cat', 'Anh Lông Ngắn', 1, 3.2);

-- Phân lịch làm việc cho Staff
INSERT INTO shift_types (name, start_time, end_time) VALUES 
('Morning', '08:00:00', '12:00:00'),
('Afternoon', '13:00:00', '17:00:00');

INSERT INTO staff_schedule (staff_id, shift_type_id, day_of_week) VALUES 
(2, 1, 2); -- Staff A làm sáng Thứ 2

-- Tạo Booking mẫu
-- Khách hàng ID=1, Pet ID=1, Staff ID=2
INSERT INTO bookings (customer_id, pet_id, staff_id, booking_date, booking_time, status, total_price) VALUES 
(1, 1, 2, CURDATE() + INTERVAL 1 DAY, '09:00:00', 'CONFIRMED', 450000); 

INSERT INTO booking_details (booking_id, service_id, price) VALUES 
(1, 1, 150000), 
(1, 2, 300000);