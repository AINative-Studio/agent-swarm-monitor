import { Metadata } from 'next';
import AuditLogClient from './AuditLogClient';

export const metadata: Metadata = {
  title: 'Audit Log - OpenClaw',
  description: 'View workspace activity and security events',
};

export default function AuditLogPage() {
  return <AuditLogClient />;
}
