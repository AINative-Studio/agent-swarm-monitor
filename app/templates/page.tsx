import { Metadata } from 'next';
import OpenClawTemplatesClient from './OpenClawTemplatesClient';

export const metadata: Metadata = {
  title: 'Templates - OpenClaw',
  description: 'Browse pre-configured templates for common agent workflows',
};

export default function OpenClawTemplatesPage() {
  return <OpenClawTemplatesClient />;
}
