import { Metadata } from 'next';
import RecursiveIntelligenceClient from './RecursiveIntelligenceClient';

export const metadata: Metadata = {
  title: 'Recursive Intelligence - OpenClaw',
  description: 'Real-time health of the five recursive intelligence loops',
};

export default function RecursiveIntelligencePage() {
  return <RecursiveIntelligenceClient />;
}
