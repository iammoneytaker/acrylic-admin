export interface SupabaseData {
  id?: number;
  response_date: string;
  participant_number: number;
  name_or_company: string;
  contact: string;
  email: string;
  business_registration_file: string;
  privacy_agreement: boolean;
  first_time_buyer: boolean;
  product_description: string;
  product_size: string;
  thickness: string;
  material: string;
  color: string;
  quantity: string | null;
  desired_delivery: string;
  product_image: string;
  product_drawing: string;
  inquiry: string;
  referral_source: string;
}
