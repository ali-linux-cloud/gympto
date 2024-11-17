import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import MemberForm from './components/MemberForm';
import MemberList from './components/MemberList';
import SearchBar from './components/SearchBar';
import Modal from './components/Modal';
import FloatingActionButton from './components/FloatingActionButton';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import RenewalModal from './components/RenewalModal';
import ConfirmDialog from './components/ConfirmDialog';
import type { Member, MemberFormData } from './types/member';
import type { User } from './types/auth';
import { calculateEndDate } from './utils/memberUtils';
import { format, addDays, differenceInDays } from 'date-fns';

type FilterType = 'all' | 'active' | 'expired' | 'ending-soon';

type RenewalHistory = {
  date: string;
  duration: number;
  price: number;
  startDate: string;
  endDate: string;
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Load members when user changes
  useEffect(() => {
    if (currentUser?.id) {
      const userMembers = localStorage.getItem(`gym-members-${currentUser.id}`);
      if (userMembers) {
        setMembers(JSON.parse(userMembers));
      } else {
        // Initialize empty members array for new user
        localStorage.setItem(`gym-members-${currentUser.id}`, JSON.stringify([]));
        setMembers([]);
      }
    }
  }, [currentUser]);

  // Save members whenever they change
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`gym-members-${currentUser.id}`, JSON.stringify(members));
    }
  }, [members, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Load user's members
    const userMembers = localStorage.getItem(`gym-members-${user.id}`);
    if (userMembers) {
      setMembers(JSON.parse(userMembers));
    } else {
      setMembers([]);
    }
  };

  const handleLogout = () => {
    if (currentUser?.id) {
      // Save current members before logging out
      localStorage.setItem(`gym-members-${currentUser.id}`, JSON.stringify(members));
    }
    localStorage.removeItem('current-user');
    setCurrentUser(null);
    setMembers([]);
  };

  useEffect(() => {
    // Check for persisted login
    const savedUser = localStorage.getItem('current-user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      handleLogin(user);
    }
  }, []);

  useEffect(() => {
    // Check for subscription expiry on login
    if (currentUser && currentUser.subscriptionStatus === 'active') {
      const daysLeft = calculateDaysLeft(currentUser.subscriptionEndDate);
      if (daysLeft <= 7 && daysLeft > 0) {
        setIsRenewalModalOpen(true);
      }
    }
  }, [currentUser]);

  const calculateDaysLeft = (endDate: string | undefined) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleAddMember = (data: MemberFormData) => {
    const newMember: Member = {
      id: crypto.randomUUID(),
      ...data,
      endDate: calculateEndDate(data.startDate, data.duration),
      renewalHistory: []
    };
    setMembers([...members, newMember]);
    setIsModalOpen(false);
  };

  const handleRenewMember = (memberId: string, duration: number, price: number, startDate: string) => {
    setMembers(members.map(member => {
      if (member.id === memberId) {
        // Calculate remaining days if membership is still active
        const currentEndDate = new Date(member.endDate);
        const renewalStartDate = new Date(startDate);
        
        // If renewal starts after current end date, no days to add
        // If renewal starts before current end date, add the days between renewal start and current end
        const remainingDays = currentEndDate > renewalStartDate 
          ? differenceInDays(currentEndDate, renewalStartDate)
          : 0;

        // Add remaining days to the selected duration
        const totalDuration = duration + remainingDays;
        const newEndDate = format(addDays(renewalStartDate, totalDuration), 'yyyy-MM-dd');

        // Create renewal history entry
        const renewalEntry: RenewalHistory = {
          date: format(new Date(), 'yyyy-MM-dd'),
          duration,
          price,
          startDate,
          endDate: newEndDate
        };

        return {
          ...member,
          startDate,
          endDate: newEndDate,
          duration: totalDuration,
          price,
          renewalHistory: [...member.renewalHistory, renewalEntry]
        };
      }
      return member;
    }));
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(members.filter(member => member.id !== memberId));
  };

  if (!currentUser) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // Redirect to admin dashboard if user is admin
  if (currentUser.email === 'admin@saasfactory.com') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (!currentUser.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800/50 rounded-lg p-8 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Subscription Pending</h2>
          <p className="text-gray-300 mb-4">
            Your subscription is pending verification. Please wait while an administrator reviews your payment receipt.
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold">PowerFit Pro</h1>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <Dumbbell className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-bold text-white">PowerFit Pro</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Members</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="ending-soon">Ending Soon</option>
              </select>
              <div className="w-full sm:w-72">
                <SearchBar value={searchTerm} onChange={setSearchTerm} />
              </div>
            </div>
          </div>

          <div className="pb-20">
            <MemberList 
              members={filteredMembers}
              onRenew={handleRenewMember}
              onDelete={handleDeleteMember}
              filter={filter}
            />
          </div>

          <FloatingActionButton onClick={() => setIsModalOpen(true)} />

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add New Member"
          >
            <MemberForm onSubmit={handleAddMember} />
          </Modal>

          <RenewalModal
            isOpen={isRenewalModalOpen}
            onClose={() => setIsRenewalModalOpen(false)}
            currentUser={currentUser}
          />

          <ConfirmDialog
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
            title="Confirm Logout"
            message="Are you sure you want to log out? You will need to log in again to access your data."
          />
        </div>
      </main>
    </div>
  );
}

export default App;