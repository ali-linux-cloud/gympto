import React, { useState } from 'react';
import { RefreshCw, User, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { Member } from '../types/member';
import { formatCurrency, isMembershipActive, getDaysRemaining } from '../utils/memberUtils';
import ConfirmDialog from './ConfirmDialog';
import RenewalDialog from './RenewalDialog';

interface MemberListProps {
  members: Member[];
  onRenew: (memberId: string, duration: number, price: number, startDate: string) => void;
  onDelete: (memberId: string) => void;
  filter: 'all' | 'active' | 'expired' | 'ending-soon';
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export default function MemberList({ members, onRenew, onDelete, filter }: MemberListProps) {
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [memberToRenew, setMemberToRenew] = useState<Member | null>(null);

  const filteredMembers = members.filter(member => {
    const daysLeft = getDaysRemaining(member.endDate);
    switch (filter) {
      case 'active':
        return daysLeft > 0;
      case 'expired':
        return daysLeft <= 0;
      case 'ending-soon':
        return daysLeft > 0 && daysLeft <= 7;
      default:
        return true;
    }
  });

  if (filteredMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800/50 rounded-lg p-8 max-w-md mx-auto border border-gray-700">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-white">No members found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {filter === 'all'
              ? 'Get started by adding your first member'
              : `No members found with the "${filter}" filter`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filteredMembers.map(member => {
          const daysLeft = getDaysRemaining(member.endDate);
          const isActive = daysLeft > 0;
          const isEndingSoon = isActive && daysLeft <= 7;
          const statusColor = isActive 
            ? isEndingSoon 
              ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
              : 'bg-green-500/20 text-green-500 border-green-500/50'
            : 'bg-red-500/20 text-red-500 border-red-500/50';
          
          return (
            <div
              key={member.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Header with Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(member.name)} flex items-center justify-center`}>
                    <span className="text-white font-medium text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{member.name}</h3>
                    {member.phoneNumber && (
                      <p className="text-sm text-gray-400">{member.phoneNumber}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
                    {isActive 
                      ? isEndingSoon 
                        ? 'Ending Soon'
                        : 'Active'
                      : 'Expired'}
                  </span>
                  <button
                    onClick={() => setMemberToDelete(member.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete member"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Membership Period and Price */}
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-gray-400">Membership Period</p>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Price</p>
                      <p className="text-base font-semibold text-white">{formatCurrency(member.price)}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm text-white">
                      <span className="text-gray-400">Start:</span> {format(new Date(member.startDate), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-sm text-white">
                      <span className="text-gray-400">End:</span> {format(new Date(member.endDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                {/* Days Remaining */}
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-xs text-gray-400">Days Remaining</p>
                    <button
                      onClick={() => setMemberToRenew(member)}
                      className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Renew
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-semibold text-white">{Math.max(0, daysLeft)}</span>
                    <span className="text-xs text-gray-400">days</span>
                  </div>
                  {isActive && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isEndingSoon ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                (daysLeft / member.duration) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (memberToDelete) {
            onDelete(memberToDelete);
            setMemberToDelete(null);
          }
        }}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
      />

      <RenewalDialog
        isOpen={!!memberToRenew}
        onClose={() => setMemberToRenew(null)}
        member={memberToRenew}
        onConfirm={(duration, price, startDate) => {
          if (memberToRenew) {
            onRenew(memberToRenew.id, duration, price, startDate);
            setMemberToRenew(null);
          }
        }}
      />
    </>
  );
}