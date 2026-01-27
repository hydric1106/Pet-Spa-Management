package com.petspa;

import com.petspa.config.SpringContext;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.stage.Stage;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * Main Entry Point for PetSpa Desktop Application.
 * 
 * This is a hybrid application that combines:
 * - JavaFX for the desktop window and WebView rendering
 * - Spring Boot for backend logic, DI, and database operations
 * 
 * The application flow:
 * 1. JavaFX Application.launch() is called from main()
 * 2. init() method starts the Spring Boot context
 * 3. start() method creates the JavaFX Stage with WebView
 * 4. JavaScript in WebView communicates with Java via JavaBridge
 */
public class PetSpaApplication extends Application {

    private ConfigurableApplicationContext springContext;

    /**
     * Main entry point - launches JavaFX application
     */
    public static void main(String[] args) {
        launch(args);
    }

    /**
     * Called before start() - Initialize Spring Boot context here
     */
    @Override
    public void init() throws Exception {
        // Start Spring Boot with headless mode disabled for JavaFX compatibility
        springContext = new SpringApplicationBuilder(SpringBootApp.class)
                .headless(false)
                .run();
        
        // Store context globally for access from JavaBridge and other components
        SpringContext.setApplicationContext(springContext);
    }

    /**
     * Called after init() - Create and show the JavaFX Stage
     */
    @Override
    public void start(Stage primaryStage) throws Exception {
        // Get the MainController from Spring context to load the WebView
        com.petspa.controller.MainController mainController = 
                springContext.getBean(com.petspa.controller.MainController.class);
        
        // Initialize and show the main window
        mainController.initializeStage(primaryStage);
    }

    /**
     * Called when the application is closing
     */
    @Override
    public void stop() throws Exception {
        // Close Spring context gracefully
        if (springContext != null) {
            springContext.close();
        }
        Platform.exit();
    }
}
