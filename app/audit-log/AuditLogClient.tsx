'use client';

import { motion } from 'framer-motion';
import { Clock, Construction } from 'lucide-react';
import { fadeUp } from '@/lib/openclaw-utils';

export default function AuditLogClient() {
  return (
    <div className="space-y-8">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          View workspace activity and security events
        </p>
      </motion.div>

      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-20 px-6 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EFEC] mb-5">
          <Construction className="h-7 w-7 text-[#8C8C8C]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Coming Soon</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          The audit log will provide a full history of workspace activity
          including agent actions, team changes, and security events.
        </p>
        <div className="flex items-center gap-1.5 mt-6 text-xs text-[#8C8C8C]">
          <Clock className="h-3.5 w-3.5" />
          <span>Expected in a future release</span>
        </div>
      </motion.div>
    </div>
  );
}
