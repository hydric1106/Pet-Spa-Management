package com.petspa.controller;

import com.petspa.bridge.JavaBridge;
import javafx.concurrent.Worker;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.layout.BorderPane;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.Objects;

/**
 * MainController - Manages the JavaFX Stage and WebView.
 * 
 * This controller is responsible for:
 * - Creating and configuring the main application window
 * - Loading HTML pages into the WebView
 * - Injecting the JavaBridge into the JavaScript context
 */
@Component
public class MainController {

    private final JavaBridge javaBridge;
    
    private Stage primaryStage;
    private WebView webView;
    private WebEngine webEngine;

    // Window dimensions
    private static final double WINDOW_WIDTH = 1280;
    private static final double WINDOW_HEIGHT = 720;
    private static final String APP_TITLE = "PetSpa Management System";

    public MainController(JavaBridge javaBridge) {
        this.javaBridge = javaBridge;
    }

    /**
     * Initializes and shows the main application stage.
     */
    public void initializeStage(Stage stage) {
        this.primaryStage = stage;
        
        // Create WebView
        webView = new WebView();
        webEngine = webView.getEngine();
        
        // Enable JavaScript
        webEngine.setJavaScriptEnabled(true);
        
        // Set up the bridge injection when page loads
        webEngine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
            if (newState == Worker.State.SUCCEEDED) {
                injectJavaBridge();
            }
        });
        
        // Handle JavaScript console.log messages (for debugging)
        webEngine.setOnAlert(event -> System.out.println("[JS Alert] " + event.getData()));
        
        // Handle JavaScript errors
        webEngine.setOnError(event -> System.err.println("[JS Error] " + event.getMessage()));
        
        // Create layout
        BorderPane root = new BorderPane();
        root.setCenter(webView);
        
        // Create scene
        Scene scene = new Scene(root, WINDOW_WIDTH, WINDOW_HEIGHT);
        
        // Configure stage
        primaryStage.setTitle(APP_TITLE);
        primaryStage.setScene(scene);
        primaryStage.setMinWidth(1024);
        primaryStage.setMinHeight(600);
        
        // Try to load application icon
        try {
            URL iconUrl = getClass().getResource("/ui/assets/images/icon.png");
            if (iconUrl != null) {
                primaryStage.getIcons().add(new Image(iconUrl.toExternalForm()));
            }
        } catch (Exception e) {
            System.out.println("Application icon not found, using default");
        }
        
        // Load the login page
        loadPage("index.html");
        
        // Show the stage
        primaryStage.show();
    }

    /**
     * Loads an HTML page into the WebView.
     * 
     * @param pageName the name of the HTML file (e.g., "index.html", "dashboard-admin.html")
     */
    public void loadPage(String pageName) {
        URL resource = getClass().getResource("/ui/" + pageName);
        if (resource != null) {
            webEngine.load(resource.toExternalForm());
        } else {
            System.err.println("Page not found: " + pageName);
            // Load error page or show error
            webEngine.loadContent(getErrorPageHtml(pageName));
        }
    }

    /**
     * Injects the JavaBridge object into the JavaScript context.
     * This is called after each page load.
     */
    private void injectJavaBridge() {
        try {
            JSObject window = (JSObject) webEngine.executeScript("window");
            window.setMember("javaBridge", javaBridge);
            
            // Notify JavaScript that the bridge is ready
            webEngine.executeScript("if (typeof onBridgeReady === 'function') { onBridgeReady(); }");
            
            System.out.println("JavaBridge injected successfully");
        } catch (Exception e) {
            System.err.println("Failed to inject JavaBridge: " + e.getMessage());
        }
    }

    /**
     * Generates an error page HTML when a page is not found.
     */
    private String getErrorPageHtml(String pageName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #f5f5f5;
                    }
                    .error-container {
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 { color: #e74c3c; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>Page Not Found</h1>
                    <p>The page "%s" could not be loaded.</p>
                </div>
            </body>
            </html>
            """.formatted(pageName);
    }

    /**
     * Gets the primary stage.
     */
    public Stage getPrimaryStage() {
        return primaryStage;
    }

    /**
     * Gets the WebEngine for advanced operations.
     */
    public WebEngine getWebEngine() {
        return webEngine;
    }
}
