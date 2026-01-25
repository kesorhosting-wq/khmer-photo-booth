export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          function_type: Database["public"]["Enums"]["category_function"]
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          function_type?: Database["public"]["Enums"]["category_function"]
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          function_type?: Database["public"]["Enums"]["category_function"]
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          product_account_id: string | null
          product_file_id: string | null
          product_id: string
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          product_account_id?: string | null
          product_file_id?: string | null
          product_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          product_account_id?: string | null
          product_file_id?: string | null
          product_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_account_id_fkey"
            columns: ["product_account_id"]
            isOneToOne: false
            referencedRelation: "product_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_file_id_fkey"
            columns: ["product_file_id"]
            isOneToOne: false
            referencedRelation: "product_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_accounts: {
        Row: {
          account_details: string[]
          created_at: string
          id: string
          is_sold: boolean
          product_id: string
          sold_at: string | null
          sold_to_user_id: string | null
          updated_at: string
        }
        Insert: {
          account_details?: string[]
          created_at?: string
          id?: string
          is_sold?: boolean
          product_id: string
          sold_at?: string | null
          sold_to_user_id?: string | null
          updated_at?: string
        }
        Update: {
          account_details?: string[]
          created_at?: string
          id?: string
          is_sold?: boolean
          product_id?: string
          sold_at?: string | null
          sold_to_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_accounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          facebook_url: string | null
          id: string
          image_custom_height: number | null
          image_custom_width: number | null
          image_fit: string | null
          image_url: string
          name: string
          order_url: string | null
          price: string | null
          telegram_url: string | null
          tiktok_url: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          id?: string
          image_custom_height?: number | null
          image_custom_width?: number | null
          image_fit?: string | null
          image_url: string
          name: string
          order_url?: string | null
          price?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          id?: string
          image_custom_height?: number | null
          image_custom_width?: number | null
          image_fit?: string | null
          image_url?: string
          name?: string
          order_url?: string | null
          price?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          body_bg_color: string | null
          body_bg_image_url: string | null
          body_text_color: string | null
          category_active_bg_color: string | null
          category_bg_color: string | null
          category_font: string | null
          category_text_color: string | null
          created_at: string | null
          dialog_bg_color: string | null
          dialog_bg_image_url: string | null
          dialog_border_color: string | null
          dialog_button_bg_color: string | null
          dialog_button_text_color: string | null
          dialog_close_icon_color: string | null
          dialog_description_color: string | null
          dialog_facebook_icon_color: string | null
          dialog_facebook_icon_url: string | null
          dialog_price_color: string | null
          dialog_telegram_icon_color: string | null
          dialog_telegram_icon_url: string | null
          dialog_tiktok_icon_color: string | null
          dialog_tiktok_icon_url: string | null
          dialog_title_color: string | null
          favicon_url: string | null
          footer_bg_color: string | null
          footer_description: string | null
          footer_facebook_icon_url: string | null
          footer_facebook_url: string | null
          footer_payment_icon_url: string | null
          footer_payment_text: string | null
          footer_telegram_icon_url: string | null
          footer_telegram_url: string | null
          footer_text: string | null
          footer_text_color: string | null
          footer_tiktok_icon_url: string | null
          footer_tiktok_url: string | null
          header_bg_url: string | null
          id: string
          loading_image_url: string | null
          logo_height: number | null
          logo_position_bottom: number | null
          logo_position_left: number | null
          logo_position_right: number | null
          logo_position_top: number | null
          logo_url: string | null
          logo_width: number | null
          page_title: string | null
          product_button_bg_color: string | null
          product_button_text_color: string | null
          product_card_bg_color: string | null
          product_card_bg_image_url: string | null
          product_card_border_color: string | null
          product_card_shine_color: string | null
          product_card_shine_speed: number | null
          product_description_color: string | null
          product_name_color: string | null
          product_price_color: string | null
          products_title_color: string | null
          site_name: string | null
          site_name_color: string | null
          site_name_font: string | null
          site_name_font_size: number | null
          updated_at: string | null
        }
        Insert: {
          body_bg_color?: string | null
          body_bg_image_url?: string | null
          body_text_color?: string | null
          category_active_bg_color?: string | null
          category_bg_color?: string | null
          category_font?: string | null
          category_text_color?: string | null
          created_at?: string | null
          dialog_bg_color?: string | null
          dialog_bg_image_url?: string | null
          dialog_border_color?: string | null
          dialog_button_bg_color?: string | null
          dialog_button_text_color?: string | null
          dialog_close_icon_color?: string | null
          dialog_description_color?: string | null
          dialog_facebook_icon_color?: string | null
          dialog_facebook_icon_url?: string | null
          dialog_price_color?: string | null
          dialog_telegram_icon_color?: string | null
          dialog_telegram_icon_url?: string | null
          dialog_tiktok_icon_color?: string | null
          dialog_tiktok_icon_url?: string | null
          dialog_title_color?: string | null
          favicon_url?: string | null
          footer_bg_color?: string | null
          footer_description?: string | null
          footer_facebook_icon_url?: string | null
          footer_facebook_url?: string | null
          footer_payment_icon_url?: string | null
          footer_payment_text?: string | null
          footer_telegram_icon_url?: string | null
          footer_telegram_url?: string | null
          footer_text?: string | null
          footer_text_color?: string | null
          footer_tiktok_icon_url?: string | null
          footer_tiktok_url?: string | null
          header_bg_url?: string | null
          id?: string
          loading_image_url?: string | null
          logo_height?: number | null
          logo_position_bottom?: number | null
          logo_position_left?: number | null
          logo_position_right?: number | null
          logo_position_top?: number | null
          logo_url?: string | null
          logo_width?: number | null
          page_title?: string | null
          product_button_bg_color?: string | null
          product_button_text_color?: string | null
          product_card_bg_color?: string | null
          product_card_bg_image_url?: string | null
          product_card_border_color?: string | null
          product_card_shine_color?: string | null
          product_card_shine_speed?: number | null
          product_description_color?: string | null
          product_name_color?: string | null
          product_price_color?: string | null
          products_title_color?: string | null
          site_name?: string | null
          site_name_color?: string | null
          site_name_font?: string | null
          site_name_font_size?: number | null
          updated_at?: string | null
        }
        Update: {
          body_bg_color?: string | null
          body_bg_image_url?: string | null
          body_text_color?: string | null
          category_active_bg_color?: string | null
          category_bg_color?: string | null
          category_font?: string | null
          category_text_color?: string | null
          created_at?: string | null
          dialog_bg_color?: string | null
          dialog_bg_image_url?: string | null
          dialog_border_color?: string | null
          dialog_button_bg_color?: string | null
          dialog_button_text_color?: string | null
          dialog_close_icon_color?: string | null
          dialog_description_color?: string | null
          dialog_facebook_icon_color?: string | null
          dialog_facebook_icon_url?: string | null
          dialog_price_color?: string | null
          dialog_telegram_icon_color?: string | null
          dialog_telegram_icon_url?: string | null
          dialog_tiktok_icon_color?: string | null
          dialog_tiktok_icon_url?: string | null
          dialog_title_color?: string | null
          favicon_url?: string | null
          footer_bg_color?: string | null
          footer_description?: string | null
          footer_facebook_icon_url?: string | null
          footer_facebook_url?: string | null
          footer_payment_icon_url?: string | null
          footer_payment_text?: string | null
          footer_telegram_icon_url?: string | null
          footer_telegram_url?: string | null
          footer_text?: string | null
          footer_text_color?: string | null
          footer_tiktok_icon_url?: string | null
          footer_tiktok_url?: string | null
          header_bg_url?: string | null
          id?: string
          loading_image_url?: string | null
          logo_height?: number | null
          logo_position_bottom?: number | null
          logo_position_left?: number | null
          logo_position_right?: number | null
          logo_position_top?: number | null
          logo_url?: string | null
          logo_width?: number | null
          page_title?: string | null
          product_button_bg_color?: string | null
          product_button_text_color?: string | null
          product_card_bg_color?: string | null
          product_card_bg_image_url?: string | null
          product_card_border_color?: string | null
          product_card_shine_color?: string | null
          product_card_shine_speed?: number | null
          product_description_color?: string | null
          product_name_color?: string | null
          product_price_color?: string | null
          products_title_color?: string | null
          site_name?: string | null
          site_name_color?: string | null
          site_name_font?: string | null
          site_name_font_size?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      category_function: "link" | "account" | "upload"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      category_function: ["link", "account", "upload"],
    },
  },
} as const
