/**
 * PocketBase type definitions for n8n-backup
 * @see https://pocketbase.io/docs/
 */

/**
 * PocketBase client configuration
 */
export interface PocketBaseConfig {
  /**
   * PocketBase server URL
   * @example "http://localhost:8090"
   */
  url: string;

  /**
   * Admin email for authentication
   */
  adminEmail: string;

  /**
   * Admin password for authentication
   */
  adminPassword: string;
}

/**
 * PocketBase authentication response
 */
export interface PocketBaseAuthResponse {
  /**
   * Authentication token
   */
  token: string;

  /**
   * Authenticated admin record
   */
  admin: {
    id: string;
    email: string;
    created: string;
    updated: string;
  };
}

/**
 * PocketBase collection record
 */
export interface PocketBaseRecord {
  /**
   * Unique record ID
   */
  id: string;

  /**
   * Collection ID
   */
  collectionId: string;

  /**
   * Collection name
   */
  collectionName: string;

  /**
   * Creation timestamp
   */
  created: string;

  /**
   * Last update timestamp
   */
  updated: string;

  /**
   * Additional record data
   */
  [key: string]: unknown;
}

/**
 * PocketBase health check response
 */
export interface PocketBaseHealthResponse {
  /**
   * Health status code (200 = healthy)
   */
  code: number;

  /**
   * Health status message
   */
  message: string;

  /**
   * Additional health data
   */
  data?: Record<string, unknown>;
}

/**
 * PocketBase error response
 */
export interface PocketBaseError {
  /**
   * Error status code
   */
  status: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Additional error data
   */
  data?: Record<string, unknown>;
}
