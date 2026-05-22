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
          id: number;
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
          id: number;
          user_id: number;
          attempt_at: Date;
          ip_address: string;
          success: boolean;
        };
        Insert: {
          user_id: number;
          ip_address: string;
          success: boolean;
        };
        Update: {
          user_id?: number;
          attempt_at?: Date;
          ip_address?: string;
          success?: boolean;
        };
      };

      clients: {
        Row: {
          id: number;
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
          id: number;
          membership_id: number;
          start_date: Date;
          end_date: Date;
          is_indefinite: boolean;
          created_by: number;
          created_at: Date;
        };
        Insert: {
          membership_id: number;
          start_date: Date;
          end_date: Date;
          is_indefinite: boolean;
          created_by: number;
        };
        Update: {
          membership_id?: number;
          start_date?: Date;
          end_date?: Date;
          is_indefinite?: boolean;
          created_by?: number;
        };
      };

      membership: {
        Row: {
          id: number;
          customer_id: number;
          plan_id: number;
          status: string;
          start_date: Date;
          end_date: Date;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          customer_id: string | number;
          plan_id: string | number;
          status: string;
          start_date: Date;
          end_date: Date;
        };
        Update: {
          customer_id?: string | number;
          plan_id?: string | number;
          status?: string;
          start_date?: Date;
          end_date?: Date;
        };
      };

      membership_plans: {
        Row: {
          id: number;
          created_at: Date;
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

      cash_register_sessions: {
        Row: {
          id: number;
          created_at: Date;
          opened_by: number;
          closed_by: number | null;
          opening_balance: number;
          closing_balance: number | null;
          opened_at: Date;
          closed_at: Date | null;
          notes: string | null;
        };
        Insert: {
          opened_by: number;
          opening_balance: number;
          notes?: string | null;
        };
        Update: {
          closed_by?: number;
          closing_balance?: number;
          closed_at?: Date;
          notes?: string | null;
        };
      };

      cash_register_movements: {
        Row: {
          id: number;
          created_at: Date;
          session_id: number;
          created_by: number;
          movement_type: string;
          amount: number;
          description: string;
          reference_type: string | null;
          reference_id: number | null;
        };
        Insert: {
          session_id: number;
          created_by: number;
          movement_type: string;
          amount: number;
          description: string;
          reference_type?: string | null;
          reference_id?: number | null;
        };
        Update: {
          movement_type?: string;
          amount?: number;
          description?: string;
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

export type CashRegisterSessionRow = Database['public']['Tables']['cash_register_sessions']['Row'];
export type CashRegisterSessionInsert = Database['public']['Tables']['cash_register_sessions']['Insert'];
export type CashRegisterSessionUpdate = Database['public']['Tables']['cash_register_sessions']['Update'];

export type CashRegisterMovementRow = Database['public']['Tables']['cash_register_movements']['Row'];
export type CashRegisterMovementInsert = Database['public']['Tables']['cash_register_movements']['Insert'];
export type CashRegisterMovementUpdate = Database['public']['Tables']['cash_register_movements']['Update'];