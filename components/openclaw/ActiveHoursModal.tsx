'use client';

import { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type {
  ActiveHours,
  DayOfWeek,
  DaySchedule,
  COMMON_TIMEZONES,
  DAYS_OF_WEEK,
} from '@/types/agent-configuration';
import { COMMON_TIMEZONES as TIMEZONES, DAYS_OF_WEEK as DAYS } from '@/types/agent-configuration';

interface ActiveHoursModalProps {
  open: boolean;
  onClose: () => void;
  activeHours: ActiveHours;
  onSave: (activeHours: ActiveHours) => void;
}

const DEFAULT_TIME_RANGE = { enabled: true, startTime: '09:00', endTime: '17:00' };

export default function ActiveHoursModal({
  open,
  onClose,
  activeHours,
  onSave,
}: ActiveHoursModalProps) {
  const [timezone, setTimezone] = useState(activeHours.timezone || 'America/New_York');
  const [schedule, setSchedule] = useState<Partial<Record<DayOfWeek, DaySchedule>>>(
    activeHours.schedule || {}
  );

  const handleDayToggle = useCallback((day: DayOfWeek, enabled: boolean) => {
    setSchedule((prev) => {
      if (enabled) {
        return {
          ...prev,
          [day]: prev[day] || DEFAULT_TIME_RANGE,
        };
      } else {
        const newSchedule = { ...prev };
        delete newSchedule[day];
        return newSchedule;
      }
    });
  }, []);

  const handleTimeChange = useCallback(
    (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => {
      setSchedule((prev) => {
        const daySchedule = prev[day];
        if (!daySchedule) return prev;
        return {
          ...prev,
          [day]: {
            ...daySchedule,
            [field]: value,
          },
        };
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    onSave({
      enabled: true,
      timezone,
      schedule,
    });
    onClose();
  }, [timezone, schedule, onSave, onClose]);

  const formatTimeForDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const parseTimeFromDisplay = (time12: string): string => {
    // This is a simplified version - in production you'd use a proper time picker
    return time12;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configure Active Hours
          </DialogTitle>
          <DialogDescription>
            Set specific hours when the agent should actively run heartbeats. Outside these hours,
            heartbeats will be paused automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timezone Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 max-h-[200px]">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value} className="text-gray-900 text-sm">
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Days Schedule */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Weekly Schedule
            </Label>
            <div className="space-y-2 border border-gray-200 rounded-lg p-3">
              {DAYS.map((day) => {
                const daySchedule = schedule[day.value];
                const isEnabled = !!daySchedule;

                return (
                  <div
                    key={day.value}
                    className="flex items-center gap-3 py-2 border-b last:border-b-0 border-gray-100"
                  >
                    <div className="flex items-center gap-2 w-32">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleDayToggle(day.value, checked)}
                        aria-label={`Enable ${day.label}`}
                      />
                      <span className="text-sm font-medium text-gray-700">{day.label}</span>
                    </div>

                    {isEnabled && daySchedule && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={daySchedule.startTime}
                          onChange={(e) =>
                            handleTimeChange(day.value, 'startTime', e.target.value)
                          }
                          className="bg-white border-gray-200 text-gray-900 h-9 text-sm"
                        />
                        <span className="text-gray-500 text-sm">to</span>
                        <Input
                          type="time"
                          value={daySchedule.endTime}
                          onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                          className="bg-white border-gray-200 text-gray-900 h-9 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {Object.keys(schedule).length > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-900 font-medium mb-1">Active Hours Summary</p>
              <p className="text-xs text-blue-700">
                Agent will run heartbeats on {Object.keys(schedule).length} day
                {Object.keys(schedule).length !== 1 ? 's' : ''} per week in {timezone} timezone.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={Object.keys(schedule).length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Active Hours
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
