import { Metadata } from 'next';
import { Suspense } from 'react';
import OpenClawTemplatesClient from './OpenClawTemplatesClient';

export const metadata: Metadata = {
  title: 'Templates - OpenClaw',
  description: 'Browse pre-configured templates for common agent workflows',
};

export default function OpenClawTemplatesPage() {
  return (
    <Suspense>
      <OpenClawTemplatesClient />
    </Suspense>
  );
}
