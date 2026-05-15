export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedAttachmentMimeType = (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number];

export const ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const ATTACHMENT_TYPES = ['xray', 'photo', 'lab_result', 'pdf', 'other'] as const;

export type AttachmentTypeValue = (typeof ATTACHMENT_TYPES)[number];

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentTypeValue, string> = {
  xray: 'X-quang',
  photo: 'Ảnh chụp',
  lab_result: 'Kết quả xét nghiệm',
  pdf: 'Tài liệu PDF',
  other: 'Khác',
};

export const MIME_TO_ATTACHMENT_TYPE: Record<AllowedAttachmentMimeType, AttachmentTypeValue> = {
  'image/jpeg': 'photo',
  'image/png': 'photo',
  'image/webp': 'photo',
  'application/pdf': 'pdf',
};

export const MIME_TO_EXT: Record<AllowedAttachmentMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
