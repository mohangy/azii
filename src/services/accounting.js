/**
 * Accounting Service
 * Handles automatic income tracking from client payments
 */

/**
 * Add income entry to accounting records
 * @param {Object} transaction - Transaction object from payments
 */
export function addIncomeFromTransaction(transaction) {
  if (!transaction || transaction.status !== 'Processed') {
    return // Only add income for processed transactions
  }

  try {
    // Get existing income records
    const existingIncome = JSON.parse(localStorage.getItem('fastnet:income') || '[]')
    
    // Check if this transaction is already recorded
    const alreadyExists = existingIncome.some(income => income.transactionRef === transaction.ref)
    if (alreadyExists) {
      return // Don't duplicate income entries
    }

    // Get user data to determine router/site
    const users = JSON.parse(localStorage.getItem('fastnet:users') || '[]')
    const user = users.find(u => u.username === transaction.user)
    
    // Create income entry
    const incomeEntry = {
      id: Date.now(),
      transactionRef: transaction.ref,
      description: `Payment from ${transaction.user}`,
      amount: transaction.amount,
      date: transaction.date || new Date().toISOString().split('T')[0],
      category: transaction.type || 'Client Payment',
      source: 'Client Payment',
      user: transaction.user,
      router: user?.router || 'Unknown',
      site: user?.site || 'Unknown',
      userType: user?.type || 'Unknown',
      createdAt: transaction.createdAt || new Date().toISOString()
    }

    // Add to income records
    const updatedIncome = [...existingIncome, incomeEntry]
    localStorage.setItem('fastnet:income', JSON.stringify(updatedIncome))
    
    return incomeEntry
  } catch (error) {
    console.error('Error adding income from transaction:', error)
    return null
  }
}

/**
 * Sync existing processed transactions to income records
 * Call this once to import historical transactions
 */
export function syncTransactionsToIncome() {
  try {
    // Get all transactions
    const transactions = JSON.parse(localStorage.getItem('fastnet:transactions') || '[]')
    
    // Filter processed transactions
    const processedTransactions = transactions.filter(t => t.status === 'Processed')
    
    // Add each to income
    let addedCount = 0
    processedTransactions.forEach(transaction => {
      const result = addIncomeFromTransaction(transaction)
      if (result) addedCount++
    })
    
    return addedCount
  } catch (error) {
    console.error('Error syncing transactions to income:', error)
    return 0
  }
}

/**
 * Remove income entry when transaction is reversed/failed
 * @param {string} transactionRef - Transaction reference to remove
 */
export function removeIncomeFromTransaction(transactionRef) {
  try {
    const existingIncome = JSON.parse(localStorage.getItem('fastnet:income') || '[]')
    const updatedIncome = existingIncome.filter(income => income.transactionRef !== transactionRef)
    localStorage.setItem('fastnet:income', JSON.stringify(updatedIncome))
    return true
  } catch (error) {
    console.error('Error removing income:', error)
    return false
  }
}

/**
 * Filter income by date range
 */
export function filterByDateRange(items, startDate, endDate) {
  return items.filter(item => {
    const itemDate = new Date(item.date)
    const start = startDate ? new Date(startDate) : new Date('1900-01-01')
    const end = endDate ? new Date(endDate) : new Date('2100-12-31')
    return itemDate >= start && itemDate <= end
  })
}

/**
 * Get income by router
 */
export function getIncomeByRouter(income) {
  const byRouter = {}
  income.forEach(item => {
    const router = item.router || 'Unknown'
    if (!byRouter[router]) {
      byRouter[router] = { router, total: 0, count: 0, items: [] }
    }
    byRouter[router].total += item.amount
    byRouter[router].count += 1
    byRouter[router].items.push(item)
  })
  return Object.values(byRouter).sort((a, b) => b.total - a.total)
}

/**
 * Get income by site
 */
export function getIncomeBySite(income) {
  const bySite = {}
  income.forEach(item => {
    const site = item.site || 'Unknown'
    if (!bySite[site]) {
      bySite[site] = { site, total: 0, count: 0, items: [] }
    }
    bySite[site].total += item.amount
    bySite[site].count += 1
    bySite[site].items.push(item)
  })
  return Object.values(bySite).sort((a, b) => b.total - a.total)
}

/**
 * Get income by payment type
 */
export function getIncomeByPaymentType(income) {
  const byType = {}
  income.forEach(item => {
    const type = item.category || 'Unknown'
    if (!byType[type]) {
      byType[type] = { type, total: 0, count: 0, items: [] }
    }
    byType[type].total += item.amount
    byType[type].count += 1
    byType[type].items.push(item)
  })
  return Object.values(byType).sort((a, b) => b.total - a.total)
}

/**
 * Get income by user type (PPPoE/Hotspot)
 */
export function getIncomeByUserType(income) {
  const byUserType = {}
  income.forEach(item => {
    const userType = item.userType || 'Unknown'
    if (!byUserType[userType]) {
      byUserType[userType] = { userType, total: 0, count: 0, items: [] }
    }
    byUserType[userType].total += item.amount
    byUserType[userType].count += 1
    byUserType[userType].items.push(item)
  })
  return Object.values(byUserType).sort((a, b) => b.total - a.total)
}

/**
 * Get daily income stats
 */
export function getDailyStats(income) {
  const byDay = {}
  income.forEach(item => {
    const day = item.date
    if (!byDay[day]) {
      byDay[day] = { date: day, total: 0, count: 0 }
    }
    byDay[day].total += item.amount
    byDay[day].count += 1
  })
  return Object.values(byDay).sort((a, b) => new Date(a.date) - new Date(b.date))
}

/**
 * Get weekly income stats
 */
export function getWeeklyStats(income) {
  const byWeek = {}
  income.forEach(item => {
    const date = new Date(item.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!byWeek[weekKey]) {
      byWeek[weekKey] = { weekStart: weekKey, total: 0, count: 0 }
    }
    byWeek[weekKey].total += item.amount
    byWeek[weekKey].count += 1
  })
  return Object.values(byWeek).sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
}

/**
 * Get monthly income stats
 */
export function getMonthlyStats(income) {
  const byMonth = {}
  income.forEach(item => {
    const date = new Date(item.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { month: monthKey, total: 0, count: 0 }
    }
    byMonth[monthKey].total += item.amount
    byMonth[monthKey].count += 1
  })
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Get yearly income stats
 */
export function getYearlyStats(income) {
  const byYear = {}
  income.forEach(item => {
    const year = new Date(item.date).getFullYear().toString()
    
    if (!byYear[year]) {
      byYear[year] = { year, total: 0, count: 0 }
    }
    byYear[year].total += item.amount
    byYear[year].count += 1
  })
  return Object.values(byYear).sort((a, b) => a.year.localeCompare(b.year))
}

/**
 * EXPENSE ANALYTICS FUNCTIONS
 */

/**
 * Get expenses by payment method
 */
export function getExpensesByPaymentMethod(expenses) {
  const byPayment = {}
  expenses.forEach(item => {
    const method = item.transactionType || 'Unknown'
    const displayName = method === 'mpesa' ? 'M-Pesa' : 
                       method === 'bank' ? 'Bank Transfer' :
                       method === 'cash' ? 'Cash' : 'Unknown'
    
    if (!byPayment[displayName]) {
      byPayment[displayName] = { method: displayName, total: 0, count: 0, items: [] }
    }
    byPayment[displayName].total += item.amount
    byPayment[displayName].count += 1
    byPayment[displayName].items.push(item)
  })
  return Object.values(byPayment).sort((a, b) => b.total - a.total)
}

/**
 * Get expenses by category
 */
export function getExpensesByCategory(expenses) {
  const byCategory = {}
  expenses.forEach(item => {
    const category = item.category || 'Unknown'
    if (!byCategory[category]) {
      byCategory[category] = { category, total: 0, count: 0, items: [] }
    }
    byCategory[category].total += item.amount
    byCategory[category].count += 1
    byCategory[category].items.push(item)
  })
  return Object.values(byCategory).sort((a, b) => b.total - a.total)
}

/**
 * Get expenses by subcategory
 */
export function getExpensesBySubcategory(expenses) {
  const bySubcategory = {}
  expenses.forEach(item => {
    const subcategory = item.subcategory || 'Unknown'
    const category = item.category || 'Unknown'
    const key = `${category} - ${subcategory}`
    
    if (!bySubcategory[key]) {
      bySubcategory[key] = { 
        subcategory, 
        category,
        displayName: key,
        total: 0, 
        count: 0, 
        items: [] 
      }
    }
    bySubcategory[key].total += item.amount
    bySubcategory[key].count += 1
    bySubcategory[key].items.push(item)
  })
  return Object.values(bySubcategory).sort((a, b) => b.total - a.total)
}
