
package com.example.ecommerce.dto.auth;

public class ApiResponse {

    private boolean success;
    private String message;

    // Populated on a successful login so the client can identify the
    // signed-in user for user-scoped calls (e.g. the cart endpoints).
    private Long userId;
    private String username;
    private String email;

    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public ApiResponse(boolean success, String message, Long userId, String username, String email) {
        this.success = success;
        this.message = message;
        this.userId = userId;
        this.username = username;
        this.email = email;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }
}
