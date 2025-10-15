import React from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, Calendar, Filter } from 'lucide-react'
import { 
  syncTransactionsToIncome, 
  filterByDateRange, 
  getIncomeByRouter, 
  getIncomeBySite,
  getIncomeByPaymentType,
  getIncomeByUserType,
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  getYearlyStats,
  getExpensesByPaymentMethod,
  getExpensesByCategory,
  getExpensesBySubcategory
} from '../services/accounting'
import { useStore } from '../store/useStore'

// Expense categories with subcategories
const EXPENSE_CATEGORIES = {
  'Infrastructure & Equipment': [
    'Network Equipment (Routers, Switches, Access Points)',
    'Servers and Hardware',
    'Cables and Fiber Optics',
    'Installation Equipment',
    'UPS and Power Backup',
    'Tools and Testing Equipment'
  ],
  'Operations and Maintenance': [
    'Equipment Repairs',
    'Network Maintenance',
    'Site Maintenance',
    'Vehicle Maintenance',
    'Preventive Maintenance',
    'Emergency Repairs'
  ],
  'Staff and Wages': [
    'Salaries and Wages',
    'Overtime Pay',
    'Bonuses and Incentives',
    'Benefits and Insurance',
    'Training and Development',
    'Contractor Fees'
  ],
  'Internet and Bandwidth': [
    'Upstream Internet Service',
    'Bandwidth Costs',
    'Peering Agreements',
    'Transit Costs',
    'Backup Connectivity'
  ],
  'Office and Administration': [
    'Office Rent',
    'Utilities (Electricity, Water)',
    'Office Supplies',
    'Software Licenses',
    'Communication (Phone, Email)',
    'Insurance'
  ],
  'Licensing and Compliance': [
    'Business Licenses',
    'Regulatory Fees',
    'Permits',
    'Legal Fees',
    'Compliance Audits',
    'Certifications'
  ],
  'Marketing and Customer Acquisition': [
    'Advertising',
    'Promotional Materials',
    'Customer Onboarding',
    'Sales Commissions',
    'Marketing Campaigns',
    'Branding and Design'
  ],
  'Miscellaneous/Others': [
    'Bank Charges',
    'Taxes',
    'Donations',
    'Entertainment',
    'Travel',
    'Other Expenses'
  ]
}

export default function Accounting(){
  const [activeTab, setActiveTab] = React.useState('overview')
  const [income, setIncome] = React.useState([])
  const [expenses, setExpenses] = React.useState([])
  const [syncing, setSyncing] = React.useState(false)
  
  // Report filters
  const [reportPeriod, setReportPeriod] = React.useState('all') // all, today, week, month, year, custom
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [reportType, setReportType] = React.useState('income') // income or expenses
  const [reportView, setReportView] = React.useState('summary') // summary, router, site, payment, usertype, timeline, category, subcategory
  
  // Expense modal
  const [expenseModal, setExpenseModal] = React.useState(false)
  const [expenseForm, setExpenseForm] = React.useState({
    description: '',
    amount: '',
    category: '',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    transactionType: '',
    mpesaCode: '',
    mpesaMessage: '',
    bankReference: '',
    notes: ''
  })
  const [availableSubcategories, setAvailableSubcategories] = React.useState([])
  
  // Selection modals
  const [categoryModal, setCategoryModal] = React.useState(false)
  const [subcategoryModal, setSubcategoryModal] = React.useState(false)
  const [paymentModal, setPaymentModal] = React.useState(false)
  
  // Report filter modals
  const [reportTypeModal, setReportTypeModal] = React.useState(false)
  const [reportPeriodModal, setReportPeriodModal] = React.useState(false)
  const [reportViewModal, setReportViewModal] = React.useState(false)
  
  // Load data from localStorage
  const loadData = React.useCallback(() => {
    try {
      const storedIncome = localStorage.getItem('fastnet:income')
      const storedExpenses = localStorage.getItem('fastnet:expenses')
      if (storedIncome) setIncome(JSON.parse(storedIncome))
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses))
    } catch (e) {
      console.error('Error loading accounting data:', e)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-sync transactions to income on first load
  React.useEffect(() => {
    const hasAutoSynced = localStorage.getItem('fastnet:accounting:autoSynced')
    if (!hasAutoSynced) {
      const count = syncTransactionsToIncome()
      if (count > 0) {
        localStorage.setItem('fastnet:accounting:autoSynced', 'true')
        loadData() // Reload to show synced income
        const addToast = useStore.getState().addToast
        addToast(`Synced ${count} processed transactions to income`, 'success')
      }
    }
  }, [loadData])

  // Manual sync function
  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      const count = syncTransactionsToIncome()
      loadData()
      setSyncing(false)
      const addToast = useStore.getState().addToast
      if (count > 0) {
        addToast(`Synced ${count} new transactions to income`, 'success')
      } else {
        addToast('All transactions already synced', 'info')
      }
    }, 500)
  }

  // Open expense modal
  const openExpenseModal = () => {
    setExpenseForm({
      description: '',
      amount: '',
      category: '',
      subcategory: '',
      date: new Date().toISOString().split('T')[0],
      transactionType: '',
      mpesaCode: '',
      mpesaMessage: '',
      bankReference: '',
      notes: ''
    })
    setAvailableSubcategories([])
    setExpenseModal(true)
  }

  // Handle category selection from modal
  const selectCategory = (category) => {
    setExpenseForm(prev => ({ ...prev, category, subcategory: '' }))
    setAvailableSubcategories(EXPENSE_CATEGORIES[category] || [])
    setCategoryModal(false)
  }

  // Handle subcategory selection from modal
  const selectSubcategory = (subcategory) => {
    setExpenseForm(prev => ({ ...prev, subcategory }))
    setSubcategoryModal(false)
  }

  // Handle payment method selection from modal
  const selectPaymentMethod = (method) => {
    setExpenseForm(prev => ({ 
      ...prev, 
      transactionType: method,
      mpesaCode: '',
      mpesaMessage: '',
      bankReference: ''
    }))
    setPaymentModal(false)
  }

  // Report filter selection functions
  const selectReportType = (type) => {
    setReportType(type)
    setReportView('summary') // Reset view when switching report type
    setReportTypeModal(false)
  }

  const selectReportPeriod = (period) => {
    setReportPeriod(period)
    setReportPeriodModal(false)
  }

  const selectReportView = (view) => {
    setReportView(view)
    setReportViewModal(false)
  }

  // Extract M-Pesa transaction code from message
  const extractMpesaCode = (message) => {
    if (!message) return ''
    
    // Common M-Pesa code patterns
    // Pattern 1: Code at the beginning (e.g., "SH12AB34CD Confirmed...")
    const pattern1 = /^([A-Z0-9]{10})\s/i
    // Pattern 2: After "confirmed" or "received" (e.g., "...confirmed. Code: SH12AB34CD...")
    const pattern2 = /(?:code|ref|reference|transaction)[\s:]+([A-Z0-9]{10})/i
    // Pattern 3: Standard format (e.g., "...ref no. SH12AB34CD on...")
    const pattern3 = /\b([A-Z]{2}\d{2}[A-Z]{2}\d{2}[A-Z]{2})\b/i
    
    let match = message.match(pattern1) || message.match(pattern2) || message.match(pattern3)
    return match ? match[1].toUpperCase() : ''
  }

  // Extract bank reference from message
  const extractBankReference = (message) => {
    if (!message) return ''
    
    // Common bank reference patterns
    // Pattern 1: Transaction reference (e.g., "Ref: TXN123456789" or "Reference: 123456789")
    const pattern1 = /(?:ref(?:erence)?|transaction|txn)[\s:#]+([A-Z0-9]{8,20})/i
    // Pattern 2: FT numbers (e.g., "FT123456789")
    const pattern2 = /\b(FT\d{9,})\b/i
    // Pattern 3: Generic reference number
    const pattern3 = /\b([A-Z]{2,4}\d{8,})\b/i
    
    let match = message.match(pattern1) || message.match(pattern2) || message.match(pattern3)
    return match ? match[1].toUpperCase() : ''
  }

  // Handle M-Pesa message change with auto-extraction
  const handleMpesaMessageChange = (message) => {
    setExpenseForm(prev => ({ ...prev, mpesaMessage: message }))
    
    // Auto-extract code if not already filled
    if (!expenseForm.mpesaCode || expenseForm.mpesaCode.trim() === '') {
      const extractedCode = extractMpesaCode(message)
      if (extractedCode) {
        setExpenseForm(prev => ({ ...prev, mpesaCode: extractedCode, mpesaMessage: message }))
      }
    }
  }

  // Handle bank reference change with auto-extraction
  const handleBankReferenceInput = (value) => {
    setExpenseForm(prev => ({ ...prev, bankReference: value.toUpperCase() }))
  }

  // Auto-extract from notes if bank reference is being filled
  const handleNotesChange = (notes) => {
    setExpenseForm(prev => ({ ...prev, notes }))
    
    // Auto-extract bank reference if transaction type is bank and field is empty
    if (expenseForm.transactionType === 'bank' && (!expenseForm.bankReference || expenseForm.bankReference.trim() === '')) {
      const extractedRef = extractBankReference(notes)
      if (extractedRef) {
        setExpenseForm(prev => ({ ...prev, bankReference: extractedRef, notes }))
      }
    }
  }

  // Save expense
  const saveExpense = () => {
    const addToast = useStore.getState().addToast
    
    // Validation
    if (!expenseForm.description.trim()) {
      addToast('Please enter a description', 'error')
      return
    }
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      addToast('Please enter a valid amount', 'error')
      return
    }
    if (!expenseForm.category) {
      addToast('Please select a category', 'error')
      return
    }
    if (!expenseForm.subcategory) {
      addToast('Please select a subcategory', 'error')
      return
    }
    if (!expenseForm.transactionType) {
      addToast('Please select a transaction type', 'error')
      return
    }
    
    // Validate transaction-specific fields
    if (expenseForm.transactionType === 'mpesa') {
      if (!expenseForm.mpesaCode.trim()) {
        addToast('Please enter M-Pesa transaction code', 'error')
        return
      }
      if (!expenseForm.mpesaMessage.trim()) {
        addToast('Please enter M-Pesa message', 'error')
        return
      }
    }
    if (expenseForm.transactionType === 'bank' && !expenseForm.bankReference.trim()) {
      addToast('Please enter bank reference number', 'error')
      return
    }

    try {
      const newExpense = {
        id: Date.now(),
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        subcategory: expenseForm.subcategory,
        date: expenseForm.date,
        transactionType: expenseForm.transactionType,
        mpesaCode: expenseForm.mpesaCode,
        mpesaMessage: expenseForm.mpesaMessage,
        bankReference: expenseForm.bankReference,
        notes: expenseForm.notes,
        createdAt: new Date().toISOString()
      }

      const existingExpenses = JSON.parse(localStorage.getItem('fastnet:expenses') || '[]')
      const updatedExpenses = [...existingExpenses, newExpense]
      localStorage.setItem('fastnet:expenses', JSON.stringify(updatedExpenses))
      
      setExpenses(updatedExpenses)
      setExpenseModal(false)
      addToast('Expense added successfully', 'success')
    } catch (error) {
      console.error('Error saving expense:', error)
      addToast('Failed to save expense', 'error')
    }
  }

  // Get filtered income based on selected period
  const getFilteredIncome = React.useCallback(() => {
    let filtered = [...income]
    const today = new Date()
    
    switch(reportPeriod) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0]
        filtered = income.filter(item => item.date === todayStr)
        break
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        filtered = filterByDateRange(income, weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
        break
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        filtered = filterByDateRange(income, monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
        break
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        filtered = filterByDateRange(income, yearStart.toISOString().split('T')[0], today.toISOString().split('T')[0])
        break
      case 'custom':
        if (startDate || endDate) {
          filtered = filterByDateRange(income, startDate, endDate)
        }
        break
      default:
        break
    }
    
    return filtered
  }, [income, reportPeriod, startDate, endDate])

  // Get filtered expenses based on selected period
  const getFilteredExpenses = React.useCallback(() => {
    let filtered = [...expenses]
    const today = new Date()
    
    switch(reportPeriod) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0]
        filtered = expenses.filter(item => item.date === todayStr)
        break
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        filtered = filterByDateRange(expenses, weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
        break
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        filtered = filterByDateRange(expenses, monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
        break
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        filtered = filterByDateRange(expenses, yearStart.toISOString().split('T')[0], today.toISOString().split('T')[0])
        break
      case 'custom':
        if (startDate || endDate) {
          filtered = filterByDateRange(expenses, startDate, endDate)
        }
        break
      default:
        break
    }
    
    return filtered
  }, [expenses, reportPeriod, startDate, endDate])

  // Calculate totals
  const filteredIncome = getFilteredIncome()
  const filteredExpenses = getFilteredExpenses()
  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
  const netProfit = totalIncome - totalExpenses

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Accounting & Finance</h2>
          <p className="text-sm text-slate-500 mt-1">Track income, expenses, and financial activities</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Transactions'}
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase mb-1">Total Income</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">${totalIncome.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">${totalExpenses.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase mb-1">Net Profit</div>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-fastnet' : 'text-red-600 dark:text-red-400'}`}>
                ${netProfit.toFixed(2)}
              </div>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-fastnet" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase mb-1">Profit Margin</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'overview' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('income')} 
          className={`px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'income' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
        >
          Income
        </button>
        <button 
          onClick={() => setActiveTab('expenses')} 
          className={`px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'expenses' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
        >
          Expenses
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'reports' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
        >
          Reports
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Auto-sync Info */}
          <Card>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Automatic Income Tracking</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  All processed client payments (PPPoE & Hotspot) are automatically added to your income records. 
                  Use the "Sync Transactions" button to manually sync any new payments.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Income Entries</span>
                <span className="font-semibold">{income.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Expense Entries</span>
                <span className="font-semibold">{expenses.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                <span className="text-sm text-slate-600 dark:text-slate-300">Net Balance</span>
                <span className={`font-semibold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${netProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                <span className="text-sm text-slate-600 dark:text-slate-300">Client Payments (Auto-synced)</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {income.filter(i => i.transactionRef).length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Income Tab */}
      {activeTab === 'income' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Income Records</h3>
            <button className="px-4 py-2 bg-fastnet text-white rounded-lg hover:bg-fastnet/90 transition-colors text-sm">
              Add Income
            </button>
          </div>
          {income.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No income records yet</p>
              <p className="text-sm mt-1">Start tracking your income to see financial insights</p>
            </div>
          ) : (
            <div className="space-y-2">
              {income.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-slate-500">{item.date}</div>
                      {item.transactionRef && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono">
                          {item.transactionRef}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-green-600 dark:text-green-400">+${item.amount.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{item.category}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Expense Records</h3>
            <button 
              onClick={openExpenseModal}
              className="px-4 py-2 bg-fastnet text-white rounded-lg hover:bg-fastnet/90 transition-colors text-sm"
            >
              Add Expense
            </button>
          </div>
          {expenses.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No expense records yet</p>
              <p className="text-sm mt-1">Start tracking your expenses to monitor spending</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="text-xs text-slate-500">{item.date}</div>
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                        {item.subcategory}
                      </span>
                      {item.transactionType && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.transactionType === 'cash' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          item.transactionType === 'mpesa' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}>
                          {item.transactionType === 'mpesa' ? 'M-Pesa' : 
                           item.transactionType === 'bank' ? 'Bank' : 'Cash'}
                          {item.mpesaCode && ` (${item.mpesaCode})`}
                          {item.bankReference && ` (${item.bankReference})`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-red-600 dark:text-red-400">-${item.amount.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{item.category}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Report Filters */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-fastnet" />
                <h3 className="text-lg font-semibold">Report Filters</h3>
              </div>
              
              {/* Period Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <button
                    type="button"
                    onClick={() => setReportTypeModal(true)}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>{reportType === 'income' ? 'Income Reports' : 'Expense Reports'}</span>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time Period</label>
                  <button
                    type="button"
                    onClick={() => setReportPeriodModal(true)}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>
                      {reportPeriod === 'all' ? 'All Time' :
                       reportPeriod === 'today' ? 'Today' :
                       reportPeriod === 'week' ? 'Last 7 Days' :
                       reportPeriod === 'month' ? 'Last Month' :
                       reportPeriod === 'year' ? 'This Year' :
                       'Custom Range'}
                    </span>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Report View</label>
                  <button
                    type="button"
                    onClick={() => setReportViewModal(true)}
                    className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>
                      {reportView === 'summary' ? 'Summary' :
                       reportView === 'router' ? 'By Router' :
                       reportView === 'site' ? 'By Site' :
                       reportView === 'payment' ? (reportType === 'income' ? 'By Payment Type' : 'By Payment Method') :
                       reportView === 'usertype' ? 'By User Type' :
                       reportView === 'category' ? 'By Category' :
                       reportView === 'subcategory' ? 'By Subcategory' :
                       'Timeline'}
                    </span>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {reportPeriod === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              {reportType === 'income' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Filtered Income</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">${totalIncome.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Transactions</div>
                    <div className="text-2xl font-bold text-fastnet">{filteredIncome.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Average</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ${filteredIncome.length > 0 ? (totalIncome / filteredIncome.length).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Filtered Expenses</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">${totalExpenses.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Transactions</div>
                    <div className="text-2xl font-bold text-fastnet">{filteredExpenses.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Average</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ${filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Summary View */}
          {reportView === 'summary' && reportType === 'income' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Income Summary</h3>
              {filteredIncome.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Income</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">${totalIncome.toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Transactions</div>
                      <div className="text-2xl font-bold text-fastnet">{filteredIncome.length}</div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Highest Transaction</span>
                      <span className="font-semibold">${Math.max(...filteredIncome.map(i => i.amount)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Lowest Transaction</span>
                      <span className="font-semibold">${Math.min(...filteredIncome.map(i => i.amount)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Average Transaction</span>
                      <span className="font-semibold">${(totalIncome / filteredIncome.length).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* By Router View - Income only */}
          {reportView === 'router' && reportType === 'income' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Income by Router</h3>
              {filteredIncome.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {getIncomeByRouter(filteredIncome).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.router}</div>
                        <div className="text-sm text-slate-500">{item.count} transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">avg ${(item.total / item.count).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* By Site View - Income only */}
          {reportView === 'site' && reportType === 'income' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Income by Site</h3>
              {filteredIncome.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {getIncomeBySite(filteredIncome).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.site}</div>
                        <div className="text-sm text-slate-500">{item.count} transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">avg ${(item.total / item.count).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* By Payment Type View - Income */}
          {reportView === 'payment' && reportType === 'income' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Income by Payment Type</h3>
              {filteredIncome.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {getIncomeByPaymentType(filteredIncome).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.type}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${item.type === 'Mobile Money' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                            {item.count}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">{((item.count / filteredIncome.length) * 100).toFixed(1)}% of transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{((item.total / totalIncome) * 100).toFixed(1)}% of income</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* By User Type View - Income only */}
          {reportView === 'usertype' && reportType === 'income' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Income by User Type</h3>
              {filteredIncome.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {getIncomeByUserType(filteredIncome).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.userType}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${item.userType === 'pppoe' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'}`}>
                            {item.count}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">{((item.count / filteredIncome.length) * 100).toFixed(1)}% of transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{((item.total / totalIncome) * 100).toFixed(1)}% of income</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Timeline View - Income */}
          {reportView === 'timeline' && reportType === 'income' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Income Timeline</h3>
              {filteredIncome.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-4">
                  {/* Timeline Type Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button 
                      onClick={() => setReportPeriod('all')}
                      className="px-3 py-1 rounded text-sm bg-slate-200 dark:bg-slate-800"
                    >
                      Daily
                    </button>
                  </div>

                  {/* Timeline Data */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getDailyStats(filteredIncome).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium text-sm">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-xs text-slate-500">{item.count} transactions</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 dark:text-green-400">${item.total.toFixed(2)}</div>
                          <div className="text-xs text-slate-500">avg ${(item.total / item.count).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* EXPENSE REPORT VIEWS */}

          {/* Expense Summary View */}
          {reportView === 'summary' && reportType === 'expenses' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Expense Summary</h3>
              {filteredExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Expenses</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">${totalExpenses.toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Transactions</div>
                      <div className="text-2xl font-bold text-fastnet">{filteredExpenses.length}</div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Highest Expense</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">${Math.max(...filteredExpenses.map(e => e.amount)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Lowest Expense</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">${Math.min(...filteredExpenses.map(e => e.amount)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="text-sm">Average Expense</span>
                      <span className="font-semibold">${(totalExpenses / filteredExpenses.length).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* By Payment Method View - Expenses */}
          {reportView === 'payment' && reportType === 'expenses' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Expenses by Payment Method</h3>
              {filteredExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {getExpensesByPaymentMethod(filteredExpenses).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.method}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            item.method === 'Cash' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                            item.method === 'M-Pesa' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 
                            'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          }`}>
                            {item.count}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">{((item.count / filteredExpenses.length) * 100).toFixed(1)}% of transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{((item.total / totalExpenses) * 100).toFixed(1)}% of expenses</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* By Category View - Expenses */}
          {reportView === 'category' && reportType === 'expenses' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
              {filteredExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {getExpensesByCategory(filteredExpenses).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.category}</div>
                        <div className="text-sm text-slate-500">{item.count} transactions • {((item.total / totalExpenses) * 100).toFixed(1)}% of total</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">avg ${(item.total / item.count).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* By Subcategory View - Expenses */}
          {reportView === 'subcategory' && reportType === 'expenses' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Expenses by Subcategory</h3>
              {filteredExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-2">
                  {getExpensesBySubcategory(filteredExpenses).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.subcategory}</div>
                        <div className="text-xs text-slate-500 mt-1">{item.category}</div>
                        <div className="text-sm text-slate-500 mt-1">{item.count} transactions • {((item.total / totalExpenses) * 100).toFixed(1)}% of total</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">avg ${(item.total / item.count).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Timeline View - Expenses */}
          {reportView === 'timeline' && reportType === 'expenses' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Expense Timeline</h3>
              {filteredExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No data for selected period</div>
              ) : (
                <div className="space-y-4">
                  {/* Timeline Type Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button 
                      onClick={() => setReportPeriod('all')}
                      className="px-3 py-1 rounded text-sm bg-slate-200 dark:bg-slate-800"
                    >
                      Daily
                    </button>
                  </div>

                  {/* Timeline Data */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getDailyStats(filteredExpenses).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium text-sm">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-xs text-slate-500">{item.count} transactions</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600 dark:text-red-400">${item.total.toFixed(2)}</div>
                          <div className="text-xs text-slate-500">avg ${(item.total / item.count).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Add Expense">
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Router purchase for Site A"
              className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <button
              type="button"
              onClick={() => setCategoryModal(true)}
              className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className={expenseForm.category ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}>
                {expenseForm.category || 'Select a category'}
              </span>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Subcategory Selection - Only show when category is selected */}
          {expenseForm.category && (
            <div>
              <label className="block text-sm font-medium mb-1">Subcategory *</label>
              <button
                type="button"
                onClick={() => setSubcategoryModal(true)}
                className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className={expenseForm.subcategory ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}>
                  {expenseForm.subcategory || 'Select a subcategory'}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method *</label>
            <button
              type="button"
              onClick={() => setPaymentModal(true)}
              className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className={expenseForm.transactionType ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}>
                {expenseForm.transactionType === 'mpesa' ? 'M-Pesa' : 
                 expenseForm.transactionType === 'bank' ? 'Bank Transfer' :
                 expenseForm.transactionType === 'cash' ? 'Cash' :
                 'Select payment method'}
              </span>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* M-Pesa Fields - Only show when M-Pesa is selected */}
          {expenseForm.transactionType === 'mpesa' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  M-Pesa Transaction Code * 
                  <span className="text-xs text-slate-500 font-normal ml-2">(Auto-extracted from message)</span>
                </label>
                <input
                  type="text"
                  value={expenseForm.mpesaCode}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, mpesaCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., SH12AB34CD or paste message below"
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 font-mono"
                />
                <div className="mt-1 text-xs text-slate-500">
                  Paste your M-Pesa message below to auto-extract the code
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">M-Pesa Message *</label>
                <textarea
                  value={expenseForm.mpesaMessage}
                  onChange={(e) => handleMpesaMessageChange(e.target.value)}
                  placeholder="Paste the full M-Pesa confirmation message here..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 resize-none text-sm"
                />
                {expenseForm.mpesaCode && (
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Transaction code extracted: {expenseForm.mpesaCode}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bank Reference - Only show when Bank is selected */}
          {expenseForm.transactionType === 'bank' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Bank Reference Number * 
                <span className="text-xs text-slate-500 font-normal ml-2">(Auto-extracted from notes)</span>
              </label>
              <input
                type="text"
                value={expenseForm.bankReference}
                onChange={(e) => handleBankReferenceInput(e.target.value)}
                placeholder="e.g., TXN123456789 or FT123456789"
                className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 font-mono"
              />
              {expenseForm.bankReference && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Reference extracted: {expenseForm.bankReference}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-500">
                Paste bank confirmation message in notes below to auto-extract reference
              </div>
            </div>
          )}

          {/* Cash Confirmation - Show when Cash is selected */}
          {expenseForm.transactionType === 'cash' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-300">Cash Payment</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">Ensure proper receipt documentation for cash transactions.</div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Notes (Optional)
              {expenseForm.transactionType === 'bank' && (
                <span className="text-xs text-slate-500 font-normal ml-2"> - Paste bank message here</span>
              )}
            </label>
            <textarea
              value={expenseForm.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={
                expenseForm.transactionType === 'bank' 
                  ? "Paste bank confirmation message here to auto-extract reference number..." 
                  : "Additional details about this expense..."
              }
              rows={3}
              className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setExpenseModal(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveExpense}
              className="px-4 py-2 bg-fastnet text-white rounded-lg hover:bg-fastnet/90 transition-colors text-sm"
            >
              Add Expense
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Selection Modal */}
      <Modal open={categoryModal} onClose={() => setCategoryModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Category</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.keys(EXPENSE_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => selectCategory(category)}
                className="w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="font-medium">{category}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {EXPENSE_CATEGORIES[category].length} subcategories
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Subcategory Selection Modal */}
      <Modal open={subcategoryModal} onClose={() => setSubcategoryModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Subcategory</h2>
          <div className="text-sm text-slate-500 mb-2">
            Category: <span className="font-medium text-slate-700 dark:text-slate-300">{expenseForm.category}</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableSubcategories.map((subcategory) => (
              <button
                key={subcategory}
                onClick={() => selectSubcategory(subcategory)}
                className="w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="font-medium">{subcategory}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Payment Method</h2>
          <div className="space-y-2">
            <button
              onClick={() => selectPaymentMethod('cash')}
              className="w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium">Cash</div>
                  <div className="text-xs text-slate-500">Physical cash payment</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => selectPaymentMethod('mpesa')}
              className="w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">M-Pesa</div>
                  <div className="text-xs text-slate-500">Mobile money transfer</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => selectPaymentMethod('bank')}
              className="w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Bank Transfer</div>
                  <div className="text-xs text-slate-500">Direct bank payment</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Type Selection Modal */}
      <Modal open={reportTypeModal} onClose={() => setReportTypeModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Report Type</h2>
          <div className="space-y-2">
            <button
              onClick={() => selectReportType('income')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportType === 'income' ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">Income Reports</div>
              <div className="text-xs text-slate-500 mt-1">Track revenue and client payments</div>
            </button>
            <button
              onClick={() => selectReportType('expenses')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportType === 'expenses' ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">Expense Reports</div>
              <div className="text-xs text-slate-500 mt-1">Track spending and costs</div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Period Selection Modal */}
      <Modal open={reportPeriodModal} onClose={() => setReportPeriodModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Time Period</h2>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Time', desc: 'Show all records' },
              { value: 'today', label: 'Today', desc: 'Only today\'s data' },
              { value: 'week', label: 'Last 7 Days', desc: 'Past week' },
              { value: 'month', label: 'Last Month', desc: 'Past 30 days' },
              { value: 'year', label: 'This Year', desc: 'Current year' },
              { value: 'custom', label: 'Custom Range', desc: 'Choose specific dates' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => selectReportPeriod(period.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportPeriod === period.value ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{period.label}</div>
                <div className="text-xs text-slate-500 mt-1">{period.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Report View Selection Modal */}
      <Modal open={reportViewModal} onClose={() => setReportViewModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Report View</h2>
          <div className="text-sm text-slate-500 mb-2">
            Report Type: <span className="font-medium text-slate-700 dark:text-slate-300">
              {reportType === 'income' ? 'Income' : 'Expenses'}
            </span>
          </div>
          <div className="space-y-2">
            {reportType === 'income' ? (
              <>
                <button
                  onClick={() => selectReportView('summary')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'summary' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">Summary</div>
                  <div className="text-xs text-slate-500 mt-1">Overall income overview</div>
                </button>
                <button
                  onClick={() => selectReportView('router')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'router' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">By Router</div>
                  <div className="text-xs text-slate-500 mt-1">Income grouped by router</div>
                </button>
                <button
                  onClick={() => selectReportView('site')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'site' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">By Site</div>
                  <div className="text-xs text-slate-500 mt-1">Income grouped by site</div>
                </button>
                <button
                  onClick={() => selectReportView('payment')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'payment' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">By Payment Type</div>
                  <div className="text-xs text-slate-500 mt-1">Income grouped by payment method</div>
                </button>
                <button
                  onClick={() => selectReportView('usertype')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'usertype' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">By User Type</div>
                  <div className="text-xs text-slate-500 mt-1">PPPoE vs Hotspot breakdown</div>
                </button>
                <button
                  onClick={() => selectReportView('timeline')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'timeline' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">Timeline</div>
                  <div className="text-xs text-slate-500 mt-1">Daily income breakdown</div>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => selectReportView('summary')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'summary' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">Summary</div>
                  <div className="text-xs text-slate-500 mt-1">Overall expense overview</div>
                </button>
                <button
                  onClick={() => selectReportView('payment')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'payment' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">By Payment Method</div>
                  <div className="text-xs text-slate-500 mt-1">Cash, M-Pesa, Bank breakdown</div>
                </button>
                <button
                  onClick={() => selectReportView('category')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'category' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">By Category</div>
                  <div className="text-xs text-slate-500 mt-1">Expenses grouped by category</div>
                </button>
                <button
                  onClick={() => selectReportView('subcategory')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'subcategory' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">By Subcategory</div>
                  <div className="text-xs text-slate-500 mt-1">Detailed subcategory breakdown</div>
                </button>
                <button
                  onClick={() => selectReportView('timeline')}
                  className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${reportView === 'timeline' ? 'bg-fastnet/10 border-fastnet' : ''}`}
                >
                  <div className="font-medium">Timeline</div>
                  <div className="text-xs text-slate-500 mt-1">Daily expense breakdown</div>
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
