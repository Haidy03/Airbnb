export interface EarningsDashboard {
  totalEarnings: number;
  pendingPayouts: number;
  thisMonthEarnings: number;
  chartData: MonthlyChartData[];
  recentTransactions: Transaction[];
}

export interface MonthlyChartData {
  month: string;
  year: number;
  amount: number;
}

export interface Transaction {
  bookingId: number;
  guestName: string;
  propertyTitle: string;
  date: Date;
  amount: number;
  status: 'Paid' | 'Pending';
}