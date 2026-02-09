import WorkingAuthService from "./WorkingAuthService";

class AdminService {
  // Admin email address - change this to your admin email
  static ADMIN_EMAIL = "bophelompopo22@gmail.com";

  /**
   * Check if the current user is an admin
   * @returns {Promise<boolean>} True if user is admin, false otherwise
   */
  static async isAdmin() {
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.email) {
        return false;
      }
      return currentUser.email.toLowerCase() === this.ADMIN_EMAIL.toLowerCase();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  /**
   * Get admin email
   * @returns {string} Admin email address
   */
  static getAdminEmail() {
    return this.ADMIN_EMAIL;
  }
}

export default AdminService;

