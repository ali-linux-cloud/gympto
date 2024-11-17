import React, { useState, useEffect } from 'react';
import { format, addDays, differenceInDays, isFuture } from 'date-fns';
import DatePicker from 'react-datepicker';
import { X, Calendar, History } from 'lucide-react';
import type { Member } from '../types/member';
import { DURATION_OPTIONS } from '../constants/membership';
import { formatCurrency } from '../utils/memberUtils';

interface RenewalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number, price: number, startDate: string) => void;
  member: Member | null;
}

export default function RenewalDialog({ isOpen, onClose, onConfirm, member }: RenewalDialogProps) {
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [remainingDays, setRemainingDays] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (member) {
      const endDate = new Date(member.endDate);
      const today = new Date();
      
      // If membership is still active, calculate remaining days from start date
      if (isFuture(endDate)) {
        const daysLeft = differenceInDays(endDate, today);
        setRemainingDays(daysLeft);
        // Set start date to today by default for active memberships
        setStartDate(today);
      } else {
        setRemainingDays(0);
        setStartDate(today);
      }

      setPrice(member.price); // Set last used price as default
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(duration, price, format(startDate, 'yyyy-MM-dd'));
  };

  // Calculate preview end date by adding duration to start date
  const previewEndDate = addDays(startDate, duration);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="my-8 bg-gray-800 rounded-xl shadow-xl max-w-md w-full relative">
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="flex justify-between items-start mb-4 pr-8">
              <div>
                <h2 className="text-xl font-semibold text-white">Renew Membership</h2>
                <p className="text-gray-400 text-sm">Renewing membership for {member.name}</p>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <History size={16} />
                History
              </button>
            </div>

            {showHistory && member.renewalHistory.length > 0 && (
              <div className="mb-4 bg-gray-900/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Renewal History</h3>
                <div className="space-y-3">
                  {member.renewalHistory.map((renewal, index) => (
                    <div key={index} className="text-sm border-l-2 border-blue-500/30 pl-3">
                      <p className="text-gray-300">
                        Renewed on {format(new Date(renewal.date), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-gray-400">
                        {renewal.duration} days for {formatCurrency(renewal.price)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {format(new Date(renewal.startDate), 'dd/MM/yyyy')} to{' '}
                        {format(new Date(renewal.endDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remainingDays > 0 && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="text-blue-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-blue-300 font-medium">Active Membership</p>
                    <p className="text-sm text-blue-200">
                      Current membership has {remainingDays} days remaining. These days will be added to your renewal period.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholderText="Select start date"
                />
                {remainingDays > 0 ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Adding to current end date: {format(new Date(member.endDate), 'dd/MM/yyyy')}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    Previous end date: {format(new Date(member.endDate), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">New Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Base renewal end date: {format(previewEndDate, 'dd/MM/yyyy')}
                  {remainingDays > 0 && ` (+${remainingDays} days from current membership)`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Price (DA)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="100"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
