
import { useState, useEffect } from "react";
import { userService } from "../services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure authentication state is properly synchronized
  useEffect(() => {
    const hasValidUser = user && user.id && user.mobile;
    setIsAuthenticated(hasValidUser);
    console.log("Auth state updated:", {
      hasValidUser,
      userId: user?.id,
      userName: user?.username,
      userMobile: user?.mobile
    });
  }, [user]);

  // Login validation function
  const validateCredentials = (credentials: any) => {
    if (!credentials.phone || credentials.phone.trim() === "") {
      return { valid: false, error: "📱 Mobile number जरूरी है" };
    }

    if (!credentials.password || credentials.password.trim() === "") {
      return { valid: false, error: "🔒 Password जरूरी है" };
    }

    // Remove any spaces and check if it's numeric
    const cleanPhone = credentials.phone.replace(/\s/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      return {
        valid: false,
        error: "📱 10 digit का valid mobile number डालें",
      };
    }

    if (credentials.password.length < 4) {
      return {
        valid: false,
        error: "🔒 Password कम से कम 4 characters का होना चाहिए",
      };
    }

    return { valid: true };
  };

  // Register validation function
  const validateRegistration = (userData: any) => {
    if (
      !userData.name ||
      !userData.phone ||
      !userData.password ||
      !userData.confirmPassword
    ) {
      return { valid: false, error: "सभी required fields भरना जरूरी है" };
    }

    if (userData.phone.length !== 10) {
      return { valid: false, error: "Phone number 10 digits का होना चाहिए" };
    }

    if (userData.password !== userData.confirmPassword) {
      return {
        valid: false,
        error: "Password और Confirm Password match नहीं कर रहे",
      };
    }

    if (userData.password.length < 6) {
      return {
        valid: false,
        error: "Password कम से कम 6 characters का होना चाहिए",
      };
    }

    if (userData.email && !userData.email.includes("@")) {
      return { valid: false, error: "Valid email address डालें" };
    }

    return { valid: true };
  };

  const login = async (credentials: any) => {
    try {
      setIsLoading(true);
      
      // Validate credentials first
      const validation = validateCredentials(credentials);
      if (!validation.valid) {
        setIsLoading(false);
        return { success: false, error: validation.error };
      }

      // Call login API
      const response = await userService.login({
        phone: credentials.phone.trim(),
        password: credentials.password,
      });

      console.log("Login API Response:", response);

      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        // Store JWT token and user data
        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));
        
        // Set user state
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        
        console.log("✅ Login Successful:", {
          user: userData.username,
          mobile: userData.mobile,
          token: token ? "✓ Present" : "✗ Missing"
        });
        
        return { 
          success: true, 
          user: userData,
          message: `🎉 Welcome back, ${userData.username}!`
        };
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: response.error || "Login में problem हुई। कृपया फिर से try करें।",
        };
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error. कृपया internet connection check करें।",
      };
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      
      // Validate registration data
      const validation = validateRegistration(userData);
      if (!validation.valid) {
        setIsLoading(false);
        return { success: false, error: validation.error };
      }

      // Call register API
      const response = await userService.register({
        name: userData.name.trim(),
        phone: userData.phone.trim(),
        email: userData.email?.trim() || "",
        password: userData.password,
        referralCode: userData.referralCode?.trim().toUpperCase() || "",
      });

      console.log("Register API Response:", response);

      if (response.success && response.data) {
        const { user: newUser, token } = response.data;
        
        // Store JWT token and user data
        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user_data", JSON.stringify(newUser));
        
        // Set user state
        setUser(newUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        
        console.log("✅ Registration Successful:", {
          user: newUser.username,
          mobile: newUser.mobile,
          token: token ? "✓ Present" : "✗ Missing"
        });
        
        return { 
          success: true, 
          user: newUser,
          message: `🎉 Welcome ${newUser.username}! Account successfully created.`
        };
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: response.error || "Registration failed. Please try again.",
        };
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Network error. Please check your internet connection.",
      };
    }
  };

  const logout = async () => {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove(["user_data", "auth_token"]);

      // Reset all states to initial values
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);

      console.log("🚪 Logout successful - all states cleared");
      return { success: true, message: "Successfully logged out!" };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Logout failed" };
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      if (!isAuthenticated) {
        return { success: false, error: "User not authenticated" };
      }

      const updatedUser = { ...user, ...profileData };
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: "Profile update failed" };
    }
  };

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem("user_data");
      const authToken = await AsyncStorage.getItem("auth_token");

      if (userData && authToken) {
        const user = JSON.parse(userData);
        setUser(user);
        setIsAuthenticated(true);
        
        console.log("🔄 Auth Restored:", {
          user: user.username,
          mobile: user.mobile,
          token: "✓ Valid"
        });
        
        return { success: true, user };
      }

      console.log("❌ No saved auth found");
      return { success: false };
    } catch (error) {
      console.error("Auth check error:", error);
      return { success: false };
    }
  };

  const requireAuth = () => {
    return isAuthenticated;
  };

  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await checkAuthStatus();
        if (result.success && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
    requireAuth,
  };
};
