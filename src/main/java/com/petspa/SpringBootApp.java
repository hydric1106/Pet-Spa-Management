package com.petspa;

import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot Configuration Class.
 * 
 * This class is separate from PetSpaApplication because:
 * - PetSpaApplication extends javafx.application.Application
 * - SpringBootApplication annotation should be on a dedicated config class
 * 
 * Component scanning will automatically detect all @Service, @Repository,
 * @Controller, and @Component classes under com.petspa package.
 */
@SpringBootApplication
public class SpringBootApp {
    // Spring Boot configuration - component scanning starts from this package
}
