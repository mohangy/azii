import React from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import mockTransactions from '../data/mockTransactions.json'
import { addIncomeFromTransaction } from '../services/accounting'

export default function Transactions(){
  const [filterType, setFilterType] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState('')
  const [selectedTransaction, setSelectedTransaction] = React.useState(null)
  
  // Filter modals
  const [typeModal, setTypeModal] = React.useState(false)
  const [statusModal, setStatusModal] = React.useState(false)

  const handleTransactionClick = (transaction) => {
    console.log('Transaction clicked:', transaction)
    setSelectedTransaction(transaction)
  }

  const selectType = (type) => {
    setFilterType(type)
    setTypeModal(false)
  }

  const selectStatus = (status) => {
    setFilterStatus(status)
    setStatusModal(false)
  }

  // Merge persisted transactions with mock data
  const [transactions, setTransactions] = React.useState([])
  React.useEffect(()=>{
    let persisted = []
    try{ const s = localStorage.getItem('fastnet:transactions'); persisted = s ? JSON.parse(s) : [] }catch(e){}
    const allTransactions = [...persisted, ...mockTransactions]
    setTransactions(allTransactions)
    
    // Auto-sync processed transactions to income
    allTransactions.forEach(transaction => {
      if (transaction.status === 'Processed') {
        addIncomeFromTransaction(transaction)
      }
    })
  },[])

  // Filter transactions based on type and status
  const filtered = React.useMemo(()=>{
    return transactions.filter(t => {
      if(filterType && t.type !== filterType) return false
      if(filterStatus && t.status !== filterStatus) return false
      return true
    })
  },[transactions, filterType, filterStatus])

  // Get unique transaction types for filter
  const transactionTypes = React.useMemo(()=>{
    return [...new Set(transactions.map(t => t.type).filter(Boolean))]
  },[transactions])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Transactions <span className="text-sm text-slate-500">({filtered.length})</span></h2>
          <div className="text-sm text-slate-500">Showing {filtered.length} of {transactions.length}</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setTypeModal(true)}
            className="px-3 py-1.5 border rounded text-sm dark:bg-slate-800 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 min-w-[140px]"
          >
            <span>{filterType || 'All types'}</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => setStatusModal(true)}
            className="px-3 py-1.5 border rounded text-sm dark:bg-slate-800 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 min-w-[140px]"
          >
            <span>{filterStatus || 'All status'}</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <div className="py-8 text-center text-slate-500">No transactions found</div>
          </Card>
        ) : (
          filtered.map(t => (
            <Card key={t.ref} className="cursor-pointer hover:ring-2 hover:ring-fastnet/20 transition-all" onClick={() => handleTransactionClick(t)}>
              <div className="space-y-3">
                {/* Reference and Status Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 mb-1">Reference</div>
                    <code className="text-xs font-mono text-slate-900 dark:text-slate-100 break-all">{t.ref}</code>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs whitespace-nowrap ${t.status === 'Processed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : t.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {t.status}
                  </span>
                </div>

                {/* User and Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">User</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.user}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Type</div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${t.type === 'Mobile Money' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                      {t.type}
                    </span>
                  </div>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Amount</div>
                    <div className="text-lg font-semibold text-fastnet">${t.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Date</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{t.date}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Ref</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">No transactions found</td></tr>
              ) : (
                filtered.map(t=> (
                  <tr key={t.ref} className="border-t border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleTransactionClick(t)}>
                    <td className="px-3 py-2 font-mono text-xs">{t.ref}</td>
                    <td className="px-3 py-2">{t.user}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${t.type === 'Mobile Money' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold">${t.amount.toFixed(2)}</td>
                    <td className="px-3 py-2">{t.date}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${t.status === 'Processed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : t.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction Detail Modal */}
      <Modal open={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Transaction Details">
        {selectedTransaction && (
          <div className="space-y-4">

            {/* Transaction Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reference */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Reference Number</div>
                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded break-all inline-block">
                  {selectedTransaction.ref}
                </code>
              </div>

              {/* Status */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Status</div>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${selectedTransaction.status === 'Processed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : selectedTransaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {selectedTransaction.status}
                </span>
              </div>

              {/* User */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">User</div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{selectedTransaction.user}</div>
              </div>

              {/* Type */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Transaction Type</div>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${selectedTransaction.type === 'Mobile Money' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                  {selectedTransaction.type}
                </span>
              </div>

              {/* Amount */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Amount</div>
                <div className="text-2xl font-bold text-fastnet">${selectedTransaction.amount.toFixed(2)}</div>
              </div>

              {/* Date */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Transaction Date</div>
                <div className="text-sm text-slate-900 dark:text-slate-100">{selectedTransaction.date}</div>
              </div>

              {/* Created At */}
              {selectedTransaction.createdAt && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-medium text-slate-500 uppercase mb-1">Created At</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info based on status */}
            {selectedTransaction.status === 'Processed' && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-green-800 dark:text-green-300">Transaction Successful</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">This transaction has been processed successfully.</div>
                  </div>
                </div>
              </div>
            )}

            {selectedTransaction.status === 'Pending' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Transaction Pending</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">This transaction is being processed. Please wait.</div>
                  </div>
                </div>
              </div>
            )}

            {selectedTransaction.status === 'Failed' && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-red-800 dark:text-red-300">Transaction Failed</div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">This transaction could not be completed. Please try again or contact support.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-fastnet text-white rounded-lg hover:bg-fastnet/90 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Type Filter Modal */}
      <Modal open={typeModal} onClose={() => setTypeModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter by Type</h2>
          <div className="space-y-2">
            <button
              onClick={() => selectType('')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterType === '' ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">All types</div>
              <div className="text-xs text-slate-500 mt-1">Show all transactions</div>
            </button>
            {transactionTypes.map(type => (
              <button
                key={type}
                onClick={() => selectType(type)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterType === type ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{type}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Status Filter Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter by Status</h2>
          <div className="space-y-2">
            {[
              { value: '', label: 'All status', desc: 'Show all transactions', color: 'slate' },
              { value: 'Processed', label: 'Processed', desc: 'Successfully completed', color: 'green' },
              { value: 'Pending', label: 'Pending', desc: 'Awaiting confirmation', color: 'yellow' },
              { value: 'Failed', label: 'Failed', desc: 'Transaction failed', color: 'red' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => selectStatus(status.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterStatus === status.value ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    status.color === 'green' ? 'bg-green-500' :
                    status.color === 'yellow' ? 'bg-yellow-500' :
                    status.color === 'red' ? 'bg-red-500' :
                    'bg-slate-400'
                  }`}></span>
                  <span className="font-medium">{status.label}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 ml-4">{status.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
