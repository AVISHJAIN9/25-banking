import React, { useState, useEffect } from "react"
import api from "../api"
import { useAuth } from "../context/AuthContext"

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedId, setCopiedId] = useState(null)

  // Navigation tab in dashboard (overview vs payees vs security)
  const [activeTab, setActiveTab] = useState("overview")

  // Selected account for filtering
  const [selectedAccountId, setSelectedAccountId] = useState("ALL")

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [fromAccount, setFromAccount] = useState("")
  const [toAccount, setToAccount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("")
  const [transferLoading, setTransferLoading] = useState(false)
  const [transferError, setTransferError] = useState("")
  const [transferSuccess, setTransferSuccess] = useState("")

  // New Account Modal State
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [newAccountCurrency, setNewAccountCurrency] = useState("INR")
  const [createAccountLoading, setCreateAccountLoading] = useState(false)
  const [createAccountError, setCreateAccountError] = useState("")

  // Add Beneficiary Modal State
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false)
  const [beneficiaryName, setBeneficiaryName] = useState("")
  const [beneficiaryAccount, setBeneficiaryAccount] = useState("")
  const [beneficiaryNickname, setBeneficiaryNickname] = useState("")
  const [beneficiaryEmail, setBeneficiaryEmail] = useState("")
  const [beneficiaryLoading, setBeneficiaryLoading] = useState(false)
  const [beneficiaryError, setBeneficiaryError] = useState("")
  const [beneficiarySuccess, setBeneficiarySuccess] = useState("")

  // Security / Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    setError("")
    try {
      const [accountsRes, txRes, benRes] = await Promise.all([
        api.get("/accounts"),
        api.get("/transactions"),
        api.get("/beneficiaries").catch(() => ({ data: { beneficiaries: [] } }))
      ])
      const userAccounts = accountsRes.data.accounts || []
      setAccounts(userAccounts)
      setTransactions(txRes.data.transactions || [])
      setBeneficiaries(benRes.data.beneficiaries || [])

      if (userAccounts.length > 0 && !fromAccount) {
        setFromAccount(userAccounts[0]._id)
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load banking dashboard data")
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(id) {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Export CSV Statement
  async function handleExportCSV() {
    try {
      const params = selectedAccountId !== "ALL" ? { accountId: selectedAccountId } : {}
      const res = await api.get("/transactions/export/csv", {
        params,
        responseType: "blob"
      })

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `AegisBank_Statement_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert("Failed to export statement. Please try again.")
    }
  }

  // Handle Transfer Submission
  async function handleTransferSubmit(e) {
    e.preventDefault()
    setTransferError("")
    setTransferSuccess("")

    const numAmount = Number(transferAmount)
    if (!fromAccount || !toAccount || !transferAmount) {
      setTransferError("All fields are required.")
      return
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferError("Amount must be a positive number greater than 0.")
      return
    }

    if (fromAccount === toAccount) {
      setTransferError("Source and destination accounts must be different.")
      return
    }

    setTransferLoading(true)
    try {
      const idempotencyKey = "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
      const res = await api.post("/transactions", {
        fromAccount,
        toAccount: toAccount.trim(),
        amount: numAmount,
        idempotencyKey
      })

      setTransferSuccess(res.data.message || "Transfer completed successfully!")
      setTransferAmount("")
      setToAccount("")
      setSelectedBeneficiaryId("")
      await fetchDashboardData()
      setTimeout(() => {
        setShowTransferModal(false)
        setTransferSuccess("")
      }, 1500)
    } catch (err) {
      setTransferError(err.response?.data?.message || "Transfer failed. Please check balance and destination ID.")
    } finally {
      setTransferLoading(false)
    }
  }

  // Handle Beneficiary selection in Transfer Modal
  function handleSelectBeneficiary(benId) {
    setSelectedBeneficiaryId(benId)
    if (benId) {
      const found = beneficiaries.find(b => b._id === benId)
      if (found) {
        setToAccount(found.accountNumber)
      }
    } else {
      setToAccount("")
    }
  }

  // Handle Create Account Submission
  async function handleCreateAccountSubmit(e) {
    e.preventDefault()
    setCreateAccountError("")
    setCreateAccountLoading(true)

    try {
      await api.post("/accounts", { currency: newAccountCurrency })
      await fetchDashboardData()
      setShowAccountModal(false)
    } catch (err) {
      setCreateAccountError(err.response?.data?.message || "Failed to create new account.")
    } finally {
      setCreateAccountLoading(false)
    }
  }

  // Handle Add Beneficiary
  async function handleAddBeneficiarySubmit(e) {
    e.preventDefault()
    setBeneficiaryError("")
    setBeneficiarySuccess("")
    setBeneficiaryLoading(true)

    try {
      await api.post("/beneficiaries", {
        accountNumber: beneficiaryAccount.trim(),
        name: beneficiaryName.trim(),
        nickname: beneficiaryNickname.trim() || undefined,
        email: beneficiaryEmail.trim() || undefined
      })

      setBeneficiarySuccess("Beneficiary saved successfully!")
      setBeneficiaryName("")
      setBeneficiaryAccount("")
      setBeneficiaryNickname("")
      setBeneficiaryEmail("")
      await fetchDashboardData()
      setTimeout(() => {
        setShowAddBeneficiaryModal(false)
        setBeneficiarySuccess("")
      }, 1200)
    } catch (err) {
      setBeneficiaryError(err.response?.data?.message || "Failed to save beneficiary.")
    } finally {
      setBeneficiaryLoading(false)
    }
  }

  // Handle Delete Beneficiary
  async function handleDeleteBeneficiary(id) {
    if (!confirm("Are you sure you want to remove this saved beneficiary?")) return
    try {
      await api.delete(`/beneficiaries/${id}`)
      await fetchDashboardData()
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete beneficiary.")
    }
  }

  // Handle Password Change
  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.")
      return
    }

    setPasswordLoading(true)
    try {
      await api.put("/auth/password", {
        currentPassword,
        newPassword
      })
      setPasswordSuccess("Master password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess("")
      }, 1500)
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to update password.")
    } finally {
      setPasswordLoading(false)
    }
  }

  // Metrics
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (selectedAccountId === "ALL") return true
    const fromId = typeof tx.fromAccount === "object" ? tx.fromAccount?._id : tx.fromAccount
    const toId = typeof tx.toAccount === "object" ? tx.toAccount?._id : tx.toAccount
    return fromId === selectedAccountId || toId === selectedAccountId
  })

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "12px" }}>
        <div className="loading-spinner" style={{ width: "32px", height: "32px" }}></div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Loading AegisBank ledger balances...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Top Banner & Quick Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--color-navy)", letterSpacing: "-0.02em" }}>
            Welcome back, {user?.name || "Client"}
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>
            AegisBank Institutional Vault & Immutable Double-Entry Ledger
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAccountModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Account
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddBeneficiaryModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Add Payee
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (accounts.length > 0) setFromAccount(accounts[0]._id)
              setShowTransferModal(true)
            }}
            disabled={accounts.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Send Money
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs Row */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
        <button
          className={`btn ${activeTab === "overview" ? "btn-navy" : "btn-secondary"}`}
          onClick={() => setActiveTab("overview")}
          style={{ fontSize: "0.82rem", padding: "6px 14px" }}
        >
          Vault Overview
        </button>
        <button
          className={`btn ${activeTab === "payees" ? "btn-navy" : "btn-secondary"}`}
          onClick={() => setActiveTab("payees")}
          style={{ fontSize: "0.82rem", padding: "6px 14px" }}
        >
          Saved Payees ({beneficiaries.length})
        </button>
        <button
          className={`btn ${activeTab === "security" ? "btn-navy" : "btn-secondary"}`}
          onClick={() => setActiveTab("security")}
          style={{ fontSize: "0.82rem", padding: "6px 14px" }}
        >
          Account Security
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-card hero-metric">
              <span className="metric-label">Net Available Portfolio</span>
              <span className="metric-value">₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              <span className="metric-subtext">Across {accounts.length} active ledger {accounts.length === 1 ? "account" : "accounts"}</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Active Bank Accounts</span>
              <span className="metric-value">{accounts.length}</span>
              <span className="metric-subtext">Verified double-entry accounts</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Recorded Transactions</span>
              <span className="metric-value">{transactions.length}</span>
              <span className="metric-subtext">Immutable audit ledger entries</span>
            </div>
          </div>

          {/* Accounts Section */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-text-primary)" }}>
                Your Accounts
              </h2>
              {accounts.length > 1 && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Filter Ledger:</span>
                  <select
                    className="form-control"
                    style={{ padding: "4px 8px", fontSize: "0.8rem", width: "auto" }}
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                  >
                    <option value="ALL">All Accounts</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        ...{acc._id.slice(-6)} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="aegis-card empty-state">
                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                <h3 className="empty-state-title">No Accounts Found</h3>
                <p className="empty-state-text">
                  You do not have any active banking accounts yet. Create your first verified account to receive and transfer funds.
                </p>
                <button className="btn btn-primary" onClick={() => setShowAccountModal(true)}>
                  Open First Account
                </button>
              </div>
            ) : (
              <div className="accounts-grid">
                {accounts.map((acc, index) => {
                  const isSelected = selectedAccountId === acc._id
                  return (
                    <div
                      key={acc._id}
                      className={`bank-account-card ${isSelected ? "active-selected" : ""}`}
                      onClick={() => setSelectedAccountId(isSelected ? "ALL" : acc._id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="account-card-top">
                        <span className="account-type-badge">Primary #{index + 1}</span>
                        <span className="account-status-badge">
                          <span className="status-dot"></span>
                          {acc.status}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>
                          Ledger Balance
                        </span>
                        <div className="account-balance-amount">
                          {acc.currency === "INR" ? "₹" : acc.currency + " "}
                          {(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="account-id-row">
                        <span className="account-id-text" title="Click to copy full ID">
                          ID: {acc._id}
                        </span>
                        <button
                          className="copy-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(acc._id)
                          }}
                          title="Copy Account ID"
                        >
                          {copiedId === acc._id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Transaction History Section */}
          <div className="transactions-table-card">
            <div className="table-header-bar">
              <div>
                <h2 className="card-title">Recent Transactions</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  Chronological double-entry audit records
                </p>
              </div>

              <button
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                onClick={handleExportCSV}
                title="Download CSV Statement"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV Statement
              </button>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 14 14"/>
                </svg>
                <h3 className="empty-state-title">No Transactions Recorded</h3>
                <p className="empty-state-text">
                  There is no transfer history for this account yet. Initiate your first transfer to populate the ledger.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="aegis-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Transaction ID</th>
                      <th>Type</th>
                      <th>Counterparty Account</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(tx => {
                      const fromId = typeof tx.fromAccount === "object" ? tx.fromAccount?._id : tx.fromAccount
                      const toId = typeof tx.toAccount === "object" ? tx.toAccount?._id : tx.toAccount
                      const isDebit = accounts.some(acc => acc._id === fromId)

                      const formattedDate = new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })

                      return (
                        <tr key={tx._id}>
                          <td style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                            {formattedDate}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                            ...{tx._id.slice(-8)}
                          </td>
                          <td>
                            {isDebit ? (
                              <span style={{ color: "var(--color-error)", fontWeight: "700", fontSize: "0.78rem" }}>
                                SENT
                              </span>
                            ) : (
                              <span style={{ color: "var(--color-emerald)", fontWeight: "700", fontSize: "0.78rem" }}>
                                RECEIVED
                              </span>
                            )}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                            {isDebit ? `To: ...${toId?.slice(-8) || "N/A"}` : `From: ...${fromId?.slice(-8) || "N/A"}`}
                          </td>
                          <td>
                            <span className={isDebit ? "amount-debit" : "amount-credit"}>
                              {isDebit ? `- ₹${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `+ ₹${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status ${tx.status}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Beneficiaries Tab View */}
      {activeTab === "payees" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-text-primary)" }}>Saved Payees & Beneficiaries</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Direct transfer shortcuts without typing full 24-hex account IDs</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddBeneficiaryModal(true)}>
              + Add New Payee
            </button>
          </div>

          {beneficiaries.length === 0 ? (
            <div className="aegis-card empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <h3 className="empty-state-title">No Saved Payees</h3>
              <p className="empty-state-text">You haven't saved any beneficiaries yet. Save frequent recipients to send money with one click.</p>
              <button className="btn btn-primary" onClick={() => setShowAddBeneficiaryModal(true)}>
                Add Payee
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {beneficiaries.map(ben => (
                <div key={ben._id} className="aegis-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-text-primary)" }}>{ben.name}</h3>
                      {ben.nickname && (
                        <span style={{ fontSize: "0.75rem", background: "var(--color-emerald-light)", color: "var(--color-emerald)", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                          {ben.nickname}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBeneficiary(ben._id)}
                      style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
                      title="Delete Payee"
                    >
                      Delete
                    </button>
                  </div>

                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", background: "var(--color-bg)", padding: "6px 8px", borderRadius: "4px" }}>
                    ID: {ben.accountNumber}
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "0.82rem", padding: "6px" }}
                    onClick={() => {
                      setToAccount(ben.accountNumber)
                      setSelectedBeneficiaryId(ben._id)
                      setShowTransferModal(true)
                    }}
                  >
                    Send Money to {ben.nickname || ben.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Tab View */}
      {activeTab === "security" && (
        <div className="aegis-card" style={{ maxWidth: "600px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px", color: "var(--color-navy)" }}>Account Security Settings</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "24px" }}>
            Manage your master password, session policies, and encryption safeguards.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)" }}>
              <div>
                <strong style={{ fontSize: "0.88rem" }}>Registered Client Name</strong>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{user?.name}</p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)" }}>
              <div>
                <strong style={{ fontSize: "0.88rem" }}>Email Address</strong>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "0.88rem" }}>Session Security</strong>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>HttpOnly Encrypted Cookie with JWT Revocation</p>
              </div>
              <span style={{ fontSize: "0.75rem", background: "var(--color-emerald-light)", color: "var(--color-emerald)", padding: "4px 8px", borderRadius: "4px", fontWeight: "700" }}>ACTIVE</span>
            </div>
          </div>

          <button className="btn btn-navy" onClick={() => setShowPasswordModal(true)}>
            Update Master Password
          </button>
        </div>
      )}

      {/* Transfer Money Modal */}
      {showTransferModal && (
        <div className="modal-backdrop" onClick={() => setShowTransferModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transfer Money</h3>
              <button className="modal-close-btn" onClick={() => setShowTransferModal(false)}>×</button>
            </div>

            {transferError && <div className="alert alert-error">{transferError}</div>}
            {transferSuccess && <div className="alert alert-success">{transferSuccess}</div>}

            <form onSubmit={handleTransferSubmit}>
              <div className="form-group">
                <label className="form-label">Source Account</label>
                <select
                  className="form-control"
                  value={fromAccount}
                  onChange={e => setFromAccount(e.target.value)}
                  disabled={transferLoading}
                >
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>
                      ...{acc._id.slice(-6)} — Balance: ₹{(acc.balance || 0).toLocaleString()} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              {beneficiaries.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Select Saved Payee (Optional)</label>
                  <select
                    className="form-control"
                    value={selectedBeneficiaryId}
                    onChange={e => handleSelectBeneficiary(e.target.value)}
                    disabled={transferLoading}
                  >
                    <option value="">-- Choose from saved payees --</option>
                    {beneficiaries.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.nickname ? `${b.nickname} (${b.name})` : b.name} — ...{b.accountNumber.slice(-6)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Destination Account ID (24-Hex)</label>
                <input
                  className="form-control"
                  placeholder="e.g. 6423aef5081..."
                  value={toAccount}
                  onChange={e => {
                    setToAccount(e.target.value)
                    setSelectedBeneficiaryId("")
                  }}
                  disabled={transferLoading}
                  required
                />
                <span className="form-hint">Enter the recipient's 24-character verified account ID.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Transfer Amount (₹)</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  disabled={transferLoading}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowTransferModal(false)}
                  disabled={transferLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={transferLoading}
                >
                  {transferLoading ? <span className="loading-spinner"></span> : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showAccountModal && (
        <div className="modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Open New Account</h3>
              <button className="modal-close-btn" onClick={() => setShowAccountModal(false)}>×</button>
            </div>

            {createAccountError && <div className="alert alert-error">{createAccountError}</div>}

            <form onSubmit={handleCreateAccountSubmit}>
              <div className="form-group">
                <label className="form-label">Account Currency</label>
                <select
                  className="form-control"
                  value={newAccountCurrency}
                  onChange={e => setNewAccountCurrency(e.target.value)}
                  disabled={createAccountLoading}
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
                <span className="form-hint">New accounts are linked to your profile with zero opening balance.</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAccountModal(false)}
                  disabled={createAccountLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={createAccountLoading}
                >
                  {createAccountLoading ? <span className="loading-spinner"></span> : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {showAddBeneficiaryModal && (
        <div className="modal-backdrop" onClick={() => setShowAddBeneficiaryModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Beneficiary (Payee)</h3>
              <button className="modal-close-btn" onClick={() => setShowAddBeneficiaryModal(false)}>×</button>
            </div>

            {beneficiaryError && <div className="alert alert-error">{beneficiaryError}</div>}
            {beneficiarySuccess && <div className="alert alert-success">{beneficiarySuccess}</div>}

            <form onSubmit={handleAddBeneficiarySubmit}>
              <div className="form-group">
                <label className="form-label">Beneficiary Full Name</label>
                <input
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={beneficiaryName}
                  onChange={e => setBeneficiaryName(e.target.value)}
                  disabled={beneficiaryLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Account ID (24-Hex)</label>
                <input
                  className="form-control"
                  placeholder="e.g. 6423aef50812984719234812"
                  value={beneficiaryAccount}
                  onChange={e => setBeneficiaryAccount(e.target.value)}
                  disabled={beneficiaryLoading}
                  required
                />
                <span className="form-hint">Must be an active account registered in AegisBank.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Friendly Nickname (Optional)</label>
                <input
                  className="form-control"
                  placeholder="e.g. Landlord, Office, Sibling"
                  value={beneficiaryNickname}
                  onChange={e => setBeneficiaryNickname(e.target.value)}
                  disabled={beneficiaryLoading}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddBeneficiaryModal(false)}
                  disabled={beneficiaryLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={beneficiaryLoading}
                >
                  {beneficiaryLoading ? <span className="loading-spinner"></span> : "Save Payee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Master Password</h3>
              <button className="modal-close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>

            {passwordError && <div className="alert alert-error">{passwordError}</div>}
            {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password (Min 6 Characters)</label>
                <input
                  className="form-control"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  minLength={6}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? <span className="loading-spinner"></span> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
