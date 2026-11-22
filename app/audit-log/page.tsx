import { Metadata } from 'next';
import AuditLogClient from './AuditLogClient';

export const metadata: Metadata = {
  title: 'Audit Log - OpenClaw',
  description: 'Review security audit events across your agents and workspace',
};

export default function AuditLogPage() {
  return <AuditLogClient />;
}
