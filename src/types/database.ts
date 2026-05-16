// This is the type for the database for maintaining the consistency of the data
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password: string;
          resetPasswordJti: string;
          is_deleted: boolean;
          role: string;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          name: string;
          email: string;
          password: string;
          role: string;
        };
        Update: {
          name?: string;
          email?: string;
          password?: string;
          resetPasswordJti?: string;
          is_deleted?: boolean;
          role?: string;
        };
      };

      clients: {
        Row: {
          id: string;
          first_name: string;
          middle_name: string;
          paternal_last_name: string;
          maternal_last_name: string;
          age: number;
          email: string;
          phone: string;
          address: string;
          is_deleted: boolean;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          first_name: string;
          middle_name: string;
          paternal_last_name: string;
          maternal_last_name: string;
          age: number;
          email: string;
          phone: string;
          address: string;
        };
        Update: {
          first_name?: string;
          middle_name?: string;
          paternal_last_name?: string;
          maternal_last_name?: string;
          age?: number;
          email?: string;
          phone?: string;
          address?: string;
          is_deleted?: boolean;
        };
      };
    };
  };
}

// Helper types for easy access (extracted from Database schema)

// User
export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Client
export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];





