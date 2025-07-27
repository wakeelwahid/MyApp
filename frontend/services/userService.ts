import { ApiResponse } from "./apiService";

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  referralCode: string;
  kycStatus: "VERIFIED" | "PENDING" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  referralCode?: string;
}

class UserService {
  // Use your backend API base URL directly for local/dev
  private baseUrl = "https://931f94c7-97e4-4090-b863-b4c79e93dcd2-00-2evcizu71q6al.picard.replit.dev/api";

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any,
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = await this.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const config: RequestInit = {
        method,
        headers,
      };
      if (body && method !== "GET") {
        config.body = JSON.stringify(body);
      }
      const url = endpoint.startsWith("http")
        ? endpoint
        : `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || data.message || "API call failed",
        };
      }
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private async getToken(): Promise<string> {
    // Try AsyncStorage (React Native), then localStorage (web)
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const token =
          localStorage.getItem("auth_token") ||
          localStorage.getItem("authToken");
        if (token) return token;
      }
      if (typeof require !== "undefined") {
        try {
          const AsyncStorage =
            require("@react-native-async-storage/async-storage").default;
          const token = await AsyncStorage.getItem("auth_token");
          if (token) return token;
        } catch {}
      }
      return "";
    } catch (error) {
      console.error("Error getting token:", error);
      return "";
    }
  }

  private async setToken(token: string): Promise<void> {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("authToken", token);
      }
      if (typeof require !== "undefined") {
        try {
          const AsyncStorage =
            require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.setItem("auth_token", token);
        } catch {}
      }
    } catch (error) {
      console.error("Error setting token:", error);
    }
  }

  // Authentication APIs
  async login(
    credentials: LoginCredentials & { mobile?: string },
  ): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    // Django expects 'mobile' and 'password' keys
    const payload = {
      mobile: credentials.phone || credentials.mobile,
      password: credentials.password,
    };
    const result = await this.makeRequest<{ user: UserProfile; token: string }>(
      "/login/",
      "POST",
      payload,
    );
    if (result.success && result.data) {
      await this.setToken(result.data.token);
      // Store user data for later use
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("user_data", JSON.stringify(result.data.user));
      }
      if (typeof require !== "undefined") {
        try {
          const AsyncStorage =
            require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.setItem(
            "user_data",
            JSON.stringify(result.data.user),
          );
        } catch {}
      }
    }
    return result;
  }

  async register(
    userData: RegisterData & {
      username?: string;
      mobile?: string;
      confirmPassword?: string;
      confirm_password?: string;
      referral_code?: string;
    },
  ): Promise<ApiResponse<{ user: UserProfile; token: string }>> {
    // Django expects: username, mobile, email, password, confirm_password, referral_code
    const payload = {
      username: userData.name || userData.username,
      mobile: userData.phone || userData.mobile,
      email: userData.email || "",
      password: userData.password,
      confirm_password:
        userData.confirmPassword ||
        userData.confirm_password ||
        userData.password,
      referral_code: userData.referralCode || userData.referral_code || "",
    };
    const result = await this.makeRequest<{ user: UserProfile; token: string }>(
      "/register/",
      "POST",
      payload,
    );
    if (result.success && result.data) {
      await this.setToken(result.data.token);
      // Store user data for later use
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("user_data", JSON.stringify(result.data.user));
      }
      if (typeof require !== "undefined") {
        try {
          const AsyncStorage =
            require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.setItem(
            "user_data",
            JSON.stringify(result.data.user),
          );
        } catch {}
      }
    }
    return result;
  }

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const result = await this.makeRequest<{ success: boolean }>(
        "/logout",
        "POST",
      );
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("authToken");
      }
      return result;
    } catch (error) {
      console.error("Error during logout:", error);
      return { success: false, error: "Logout failed" };
    }
  }

  // Authentication status check
  async checkAuthStatus(): Promise<ApiResponse<{ user: UserProfile }>> {
    try {
      // Check if we have stored user data
      if (typeof localStorage !== "undefined") {
        const userData = localStorage.getItem("user_data");
        const authToken = localStorage.getItem("authToken");

        if (userData && authToken) {
          return {
            success: true,
            data: { user: JSON.parse(userData) },
          };
        }
      }

      return { success: false, error: "No authentication found" };
    } catch (error) {
      return { success: false, error: "Auth check failed" };
    }
  }

  // Profile APIs
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    if (!this.getToken()) {
      return { success: false, error: "Authentication required" };
    }
    return this.makeRequest<UserProfile>("/profile");
  }

  async updateProfile(
    profileData: Partial<UserProfile>,
  ): Promise<ApiResponse<UserProfile>> {
    if (!this.getToken()) {
      return { success: false, error: "Authentication required" };
    }
    return this.makeRequest<UserProfile>("/profile", "PUT", profileData);
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    if (!this.getToken()) {
      return { success: false, error: "Authentication required" };
    }
    return this.makeRequest<{ success: boolean }>("/change-password", "POST", {
      currentPassword,
      newPassword,
    });
  }

  // KYC APIs
  async submitKYC(kycData: {
    documentType: string;
    documentNumber: string;
    documentImages: string[];
    personalInfo: {
      fullName: string;
      dateOfBirth: string;
      address: string;
    };
  }): Promise<ApiResponse<{ kycId: string; status: string }>> {
    return this.makeRequest<{ kycId: string; status: string }>(
      "/kyc/submit",
      "POST",
      kycData,
    );
  }

  async getKYCStatus(): Promise<
    ApiResponse<{ status: string; rejectionReason?: string }>
  > {
    return this.makeRequest<{ status: string; rejectionReason?: string }>(
      "/kyc/status",
    );
  }

  // Referral APIs
  async getReferralData(): Promise<
    ApiResponse<{
      referralCode: string;
      totalReferrals: number;
      totalEarnings: number;
      referrals: Array<{
        id: string;
        name: string;
        joinedAt: string;
        status: string;
        earnings: number;
      }>;
    }>
  > {
    return this.makeRequest("/referrals");
  }

  async generateNewReferralCode(): Promise<
    ApiResponse<{ referralCode: string }>
  > {
    return this.makeRequest<{ referralCode: string }>(
      "/referrals/generate",
      "POST",
    );
  }
}

export const userService = new UserService();
