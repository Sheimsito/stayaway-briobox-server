// This is the type for the database for maintaining the consistency of the data
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          lastName: string;
          age: number;
          email: string;
          password: string;
          resetPasswordJti: string;
          isDeleted: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
        Insert: {
          name: string;
          lastName: string;
          age: number;
          email: string;
          password: string;
        };
        Update: {
          name?: string;
          lastName?: string;
          age?: number;
          email?: string;
          password?: string;
          resetPasswordJti?: string;
          isDeleted?: boolean;
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





