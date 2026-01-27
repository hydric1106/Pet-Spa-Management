package com.petspa.config;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Static holder for Spring ApplicationContext.
 * 
 * This allows non-Spring-managed classes (like JavaFX controllers)
 * to access Spring beans when needed.
 */
@Component
public class SpringContext {

    private static ApplicationContext context;

    /**
     * Sets the Spring ApplicationContext.
     * Called during application initialization.
     */
    public static void setApplicationContext(ApplicationContext applicationContext) {
        context = applicationContext;
    }

    /**
     * Gets a Spring bean by its class type.
     * 
     * @param beanClass the class of the bean to retrieve
     * @return the bean instance
     */
    public static <T> T getBean(Class<T> beanClass) {
        if (context == null) {
            throw new IllegalStateException("Spring context has not been initialized yet!");
        }
        return context.getBean(beanClass);
    }

    /**
     * Gets a Spring bean by its name.
     * 
     * @param beanName the name of the bean
     * @return the bean instance
     */
    public static Object getBean(String beanName) {
        if (context == null) {
            throw new IllegalStateException("Spring context has not been initialized yet!");
        }
        return context.getBean(beanName);
    }

    /**
     * Gets the ApplicationContext directly.
     */
    public static ApplicationContext getApplicationContext() {
        return context;
    }
}
