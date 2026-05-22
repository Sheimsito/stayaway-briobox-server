export enum UserRole {
  EMPLEADO = 'empleado',
  ADMIN = 'admin',
  VISITANTE = 'visitante'
}

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
          role: UserRole;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          name: string;
          email: string;
          password: string;
          role: UserRole;
        };
        Update: {
          name?: string;
          email?: string;
          password?: string;
          resetPasswordJti?: string;
          is_deleted?: boolean;
          role?: UserRole;
        };
      };

      login_attempts: {
        Row: {
          id: string;
          user_id: string;
          attempt_at: Date;
          ip_address: string;
          success: boolean;
        };
        Insert: {
          user_id: string;
          ip_address: string;
          success: boolean;
        };
        Update: {
          user_id?: string;
          attempt_at?: Date;
          ip_address?: string;
          success?: boolean;
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

      membership_freeze: {
        Row: {
          id: string;
          membership_id: string;
          start_date: Date;
          end_date: Date;
          is_indefinite: boolean;
          created_by: string;
          created_at: Date;
        };
        Insert: {
          membership_id: string;
          start_date: Date;
          end_date: Date;
          is_indefinite: boolean;
          created_by: string;
        };
        Update: {
          membership_id?: string;
          start_date?: Date;
          end_date?: Date;
          is_indefinite?: boolean;
          created_by?: string;
        };
      };

      membership: {
        Row: {
          id: string;
          customer_id: string;
          plan_id: string;
          status: string;
          start_date: Date;
          end_date: Date;
          is_deleted: boolean;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          customer_id: string;
          plan_id: string;
          status: string;
          start_date: Date;
          end_date: Date;
        };
        Update: {
          customer_id?: string;
          plan_id?: string;
          status?: string;
          start_date?: Date;
          end_date?: Date;
          is_deleted?: boolean;
        };
      };

      membership_plans: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          price: number;
          duration_days: number;
          is_active: boolean;
        };
        Insert: {
          name: string;
          price: number;
          duration_days: number;
        };
        Update: {
          name?: string;
          price?: number;
          duration_days?: number;
          is_active?: boolean;
        };
       };
      
      payments: {
        Row: {
          id: number;
          created_at: Date;
          created_by: number | null;
          customer_id: number;
          total_amount: number;
          reference_type: string | null;
          reference_id: number | null;
          notes: string | null;
        };
        Insert: {
          created_by: number | null;
          customer_id: number;
          total_amount: number;
          reference_type?: string | null;
          reference_id?: number | null;
          notes?: string | null;
        };
        Update: {
          notes?: string | null;
          reference_type?: string | null;
        };
      };

      payment_splits: {
        Row: {
          id: number;
          payment_id: number;
          payment_method: string;
          amount: number;
        };
        Insert: {
          payment_id: number;
          payment_method: string;
          amount: number;
        };
        Update: {
          payment_method?: string;
          amount?: number;
        };
      };
    };
  };
}

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type LoginAttemptRow = Database['public']['Tables']['login_attempts']['Row'];
export type LoginAttemptInsert = Database['public']['Tables']['login_attempts']['Insert'];
export type LoginAttemptUpdate = Database['public']['Tables']['login_attempts']['Update'];

export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type MembershipRow = Database['public']['Tables']['membership']['Row'];
export type MembershipInsert = Database['public']['Tables']['membership']['Insert'];
export type MembershipUpdate = Database['public']['Tables']['membership']['Update'];

export type MembershipPlanRow = Database['public']['Tables']['membership_plans']['Row'];
export type MembershipPlanInsert = Database['public']['Tables']['membership_plans']['Insert'];
export type MembershipPlanUpdate = Database['public']['Tables']['membership_plans']['Update'];

export type MembershipFreezeRow = Database['public']['Tables']['membership_freeze']['Row'];
export type MembershipFreezeInsert = Database['public']['Tables']['membership_freeze']['Insert'];
export type MembershipFreezeUpdate = Database['public']['Tables']['membership_freeze']['Update'];

export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type PaymentSplitRow = Database['public']['Tables']['payment_splits']['Row'];
export type PaymentSplitInsert = Database['public']['Tables']['payment_splits']['Insert'];
export type PaymentSplitUpdate = Database['public']['Tables']['payment_splits']['Update'];
