export type FieldErrors = Record<string, string>;

export type ApiResponse<T> =
  { success: true; message: string; data: T } | { success: false; message: string; errors?: FieldErrors };

export interface InquiryReceipt {
  reference: string;
}
