import { Alert } from '@/components/ui/alert';

interface AllergyAlertProps {
  petName: string;
  allergies: string[];
}

export function AllergyAlert({ petName, allergies }: AllergyAlertProps) {
  return (
    <Alert variant="warning">
      ⚠️ <strong>{petName}</strong> có dị ứng với: {allergies.join(', ')}
    </Alert>
  );
}
