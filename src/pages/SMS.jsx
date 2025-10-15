import React from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import { fetchMock } from '../services/api'
import { useStore } from '../store/useStore'

export default function SMS(){
  const [activeTab, setActiveTab] = React.useState('outbox')
  const [smsData, setSmsData] = React.useState({ providers: [], templates: [], variables: [], credits: 0, outbox: [] })
  const [loading, setLoading] = React.useState(true)
  
  // Outbox modal
  const [outboxModal, setOutboxModal] = React.useState(false)
  const [selectedSms, setSelectedSms] = React.useState(null)
  
  // Provider modal
  const [providerModal, setProviderModal] = React.useState(false)
  const [selectedProvider, setSelectedProvider] = React.useState(null)
  const [providerForm, setProviderForm] = React.useState({})

  // Custom provider modal
  const [customProviderModal, setCustomProviderModal] = React.useState(false)
  const [customProviderForm, setCustomProviderForm] = React.useState({
    name: '',
    description: '',
    logo: '📡',
    serviceType: 'both',
    settings: []
  })
  const [newSetting, setNewSetting] = React.useState({ key: '', value: '', type: 'text' })

  // Template modal
  const [templateModal, setTemplateModal] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState(null)
  const [templateForm, setTemplateForm] = React.useState({ name: '', category: 'Billing', text: '', active: true })

  // Send SMS modal
  const [sendModal, setSendModal] = React.useState(false)
  const [sendForm, setSendForm] = React.useState({ to: '', message: '', template: '' })

  React.useEffect(()=>{
    let mounted = true
    fetchMock('mockSMS').then(data=>{
      if(!mounted) return
      setSmsData(data)
      setLoading(false)
    })
    return ()=> mounted = false
  },[])

  const openProviderModal = (provider) => {
    setSelectedProvider(provider)
    setProviderForm({ ...provider.settings })
    setProviderModal(true)
  }

  const saveProvider = () => {
    const addToast = useStore.getState().addToast
    setSmsData(prev => ({
      ...prev,
      providers: prev.providers.map(p => 
        p.id === selectedProvider.id 
          ? { ...p, settings: { ...providerForm } }
          : p
      )
    }))
    setProviderModal(false)
    addToast(`${selectedProvider.name} settings updated`, 'success')
  }

  const openCustomProviderModal = () => {
    setCustomProviderForm({
      name: '',
      description: '',
      logo: '📡',
      serviceType: 'both',
      settings: []
    })
    setNewSetting({ key: '', value: '', type: 'text' })
    setCustomProviderModal(true)
  }

  const addSettingField = () => {
    if(!newSetting.key.trim()) return
    setCustomProviderForm(prev => ({
      ...prev,
      settings: [...prev.settings, { ...newSetting }]
    }))
    setNewSetting({ key: '', value: '', type: 'text' })
  }

  const removeSettingField = (index) => {
    setCustomProviderForm(prev => ({
      ...prev,
      settings: prev.settings.filter((_, i) => i !== index)
    }))
  }

  const saveCustomProvider = () => {
    const addToast = useStore.getState().addToast
    if(!customProviderForm.name.trim()){
      addToast('Provider name is required', 'error')
      return
    }
    if(customProviderForm.settings.length === 0){
      addToast('Add at least one setting field', 'error')
      return
    }

    const settingsObject = {}
    customProviderForm.settings.forEach(s => {
      settingsObject[s.key] = s.value
    })

    const newProvider = {
      id: `custom_${Date.now()}`,
      name: customProviderForm.name,
      description: customProviderForm.description || 'Custom SMS provider',
      logo: customProviderForm.logo || '📡',
      serviceType: customProviderForm.serviceType || 'both',
      active: false,
      custom: true,
      settings: settingsObject
    }

    setSmsData(prev => ({
      ...prev,
      providers: [...prev.providers, newProvider]
    }))

    setCustomProviderModal(false)
    addToast(`${newProvider.name} added successfully`, 'success')
  }

  const deleteProvider = (providerId) => {
    const addToast = useStore.getState().addToast
    setSmsData(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== providerId)
    }))
    addToast('Provider deleted', 'success')
  }

  const toggleProviderActive = (providerId) => {
    setSmsData(prev => ({
      ...prev,
      providers: prev.providers.map(p =>
        p.id === providerId ? { ...p, active: !p.active } : { ...p, active: false }
      )
    }))
  }

  const openTemplateModal = (template = null) => {
    if(template){
      setSelectedTemplate(template)
      setTemplateForm({ ...template })
    } else {
      setSelectedTemplate(null)
      setTemplateForm({ name: '', category: 'Billing', text: '', active: true })
    }
    setTemplateModal(true)
  }

  const saveTemplate = () => {
    const addToast = useStore.getState().addToast
    if(!templateForm.name.trim() || !templateForm.text.trim()){
      addToast('Name and text are required', 'error')
      return
    }
    
    if(selectedTemplate){
      setSmsData(prev => ({
        ...prev,
        templates: prev.templates.map(t =>
          t.id === selectedTemplate.id ? { ...t, ...templateForm } : t
        )
      }))
      addToast('Template updated', 'success')
    } else {
      const newTemplate = {
        id: `tpl_${Date.now()}`,
        ...templateForm,
        createdAt: new Date().toISOString()
      }
      setSmsData(prev => ({
        ...prev,
        templates: [...prev.templates, newTemplate]
      }))
      addToast('Template created', 'success')
    }
    setTemplateModal(false)
  }

  const deleteTemplate = (templateId) => {
    const addToast = useStore.getState().addToast
    setSmsData(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== templateId)
    }))
    addToast('Template deleted', 'success')
  }

  const sendSMS = () => {
    const addToast = useStore.getState().addToast
    if(!sendForm.to.trim() || !sendForm.message.trim()){
      addToast('Phone number and message are required', 'error')
      return
    }
    
    // Add to outbox
    const newSms = {
      id: `sms_${Date.now()}`,
      to: sendForm.to,
      recipient: 'Manual Send',
      message: sendForm.message,
      reason: sendForm.template ? smsData.templates.find(t => t.id === sendForm.template)?.name || 'Manual Message' : 'Manual Message',
      category: sendForm.template ? smsData.templates.find(t => t.id === sendForm.template)?.category || 'General' : 'General',
      status: 'pending',
      provider: smsData.providers.find(p => p.active)?.name || 'No Provider',
      sentAt: new Date().toISOString()
    }
    
    setSmsData(prev => ({
      ...prev,
      outbox: [newSms, ...prev.outbox]
    }))
    
    addToast(`SMS queued to ${sendForm.to}`, 'success')
    setSendModal(false)
    setSendForm({ to: '', message: '', template: '' })
  }

  const openSmsDetail = (sms) => {
    setSelectedSms(sms)
    setOutboxModal(true)
  }

  const insertVariable = (variable) => {
    setTemplateForm(prev => ({
      ...prev,
      text: prev.text + variable
    }))
  }

  const useTemplate = (template) => {
    setSendForm(prev => ({
      ...prev,
      message: template.text,
      template: template.id
    }))
  }

  if(loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">SMS Center</h2>
          <div className="text-sm text-slate-500">Credits remaining: {smsData.credits}</div>
        </div>
        <button onClick={()=>setSendModal(true)} className="px-4 py-2 bg-fastnet text-white rounded hover:opacity-95">
          📤 Send SMS
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button onClick={()=>setActiveTab('outbox')} className={`px-3 sm:px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'outbox' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
          <span className="hidden sm:inline">SMS </span>Outbox <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/20">{smsData.outbox.length}</span>
        </button>
        <button onClick={()=>setActiveTab('providers')} className={`px-3 sm:px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'providers' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
          <span className="hidden sm:inline">SMS </span>Providers
        </button>
        <button onClick={()=>setActiveTab('templates')} className={`px-3 sm:px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'templates' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
          Templates
        </button>
        <button onClick={()=>setActiveTab('variables')} className={`px-3 sm:px-4 py-2 rounded whitespace-nowrap text-sm ${activeTab === 'variables' ? 'bg-fastnet text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
          Variables
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={openCustomProviderModal} className="w-full sm:w-auto px-4 py-2 bg-fastnet text-white rounded hover:opacity-95 text-sm">
              + Add Custom Provider
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {smsData.providers.map(provider => (
              <Card key={provider.id} className="relative">
                {provider.custom && (
                  <button 
                    onClick={()=>deleteProvider(provider.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-xs"
                    title="Delete custom provider"
                  >
                    ×
                  </button>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <span className="text-2xl sm:text-3xl flex-shrink-0">{provider.logo}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <span className="truncate">{provider.name}</span>
                        {provider.custom && <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Custom</span>}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 line-clamp-2">{provider.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {provider.serviceType === 'both' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 whitespace-nowrap">Hotspot + PPPoE</span>
                        )}
                        {provider.serviceType === 'hotspot' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">Hotspot Only</span>
                        )}
                        {provider.serviceType === 'pppoe' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 whitespace-nowrap">PPPoE Only</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2">
                    <input type="checkbox" checked={provider.active} onChange={()=>toggleProviderActive(provider.id)} className="sr-only peer" />
                    <div className="w-9 h-5 sm:w-11 sm:h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <div className="space-y-2 mb-3">
                  {Object.entries(provider.settings).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-slate-500">{key}: </span>
                      <span className="font-mono">{value.includes('*') ? value : `${value.substring(0, 20)}...`}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>openProviderModal(provider)} className="w-full px-3 py-1.5 border rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  Configure Settings
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={()=>openTemplateModal()} className="w-full sm:w-auto px-4 py-2 bg-fastnet text-white rounded hover:opacity-95 text-sm">
              + New Template
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {smsData.templates.map(template => (
              <Card key={template.id}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{template.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 inline-block mt-1">
                      {template.category}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${template.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-200 text-slate-600'}`}>
                    {template.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 p-2 bg-slate-100 dark:bg-slate-900 rounded border line-clamp-3">
                  {template.text}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={()=>{ useTemplate(template); setSendModal(true) }} className="flex-1 px-3 py-1.5 border rounded text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    Use Template
                  </button>
                  <button onClick={()=>openTemplateModal(template)} className="flex-1 px-3 py-1.5 border rounded text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    Edit
                  </button>
                  <button onClick={()=>deleteTemplate(template.id)} className="sm:flex-none px-3 py-1.5 border border-red-300 text-red-600 rounded text-xs sm:text-sm hover:bg-red-50 dark:hover:bg-red-900/20">
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Variables Tab */}
      {activeTab === 'variables' && (
        <div>
          <Card className="mb-4">
            <h3 className="font-semibold text-sm sm:text-base mb-2">Available SMS Variables</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Use these variables in your templates. They will be automatically replaced with actual values when sending SMS.
            </p>
          </Card>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {smsData.variables.map((v, idx) => (
              <Card key={idx}>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Variable</div>
                    <code className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono text-fastnet break-all">
                      {v.name}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Description</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{v.description}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Example</div>
                    <div className="text-sm text-slate-500 italic">{v.example}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Variable</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {smsData.variables.map((v, idx) => (
                    <tr key={idx} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-3 py-2">
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-xs font-mono text-fastnet">
                          {v.name}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{v.description}</td>
                      <td className="px-3 py-2 text-slate-500 italic">{v.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Outbox Tab */}
      {activeTab === 'outbox' && (
        <div>
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm sm:text-base">SMS Outbox</h3>
              <div className="text-xs sm:text-sm text-slate-500">Total: {smsData.outbox.length}</div>
            </div>
          </Card>
          
          {smsData.outbox.length === 0 ? (
            <Card>
              <div className="py-8 text-center text-slate-500 text-sm">
                No SMS messages in outbox
              </div>
            </Card>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {smsData.outbox.map(sms => (
                  <Card key={sms.id}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{sms.recipient}</div>
                          <div className="font-mono text-xs text-slate-500">{sms.to}</div>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                          sms.status === 'delivered' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : sms.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : sms.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {sms.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div>
                          <div className="font-medium text-slate-700 dark:text-slate-300">{sms.reason}</div>
                          <div>{sms.category}</div>
                        </div>
                        <div className="text-right">
                          <div>{new Date(sms.sentAt).toLocaleDateString()}</div>
                          <div>{new Date(sms.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <button 
                          onClick={()=>openSmsDetail(sms)}
                          className="w-full px-3 py-1.5 text-xs border rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <Card className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Date/Time</th>
                        <th className="px-3 py-2 text-left">Recipient</th>
                        <th className="px-3 py-2 text-left">Phone</th>
                        <th className="px-3 py-2 text-left">Reason</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Provider</th>
                        <th className="px-3 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smsData.outbox.map(sms => (
                        <tr key={sms.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="px-3 py-2">
                            <div className="text-xs">{new Date(sms.sentAt).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500">{new Date(sms.sentAt).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-3 py-2 font-medium">{sms.recipient}</td>
                          <td className="px-3 py-2 font-mono text-xs">{sms.to}</td>
                          <td className="px-3 py-2">
                            <div className="text-sm">{sms.reason}</div>
                            <div className="text-xs text-slate-500">{sms.category}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                              sms.status === 'delivered' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : sms.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : sms.status === 'failed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {sms.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">{sms.provider}</td>
                          <td className="px-3 py-2">
                            <button 
                              onClick={()=>openSmsDetail(sms)}
                              className="px-3 py-1 text-xs border rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Provider Settings Modal */}
      <Modal open={providerModal} onClose={()=>setProviderModal(false)} title={`Configure ${selectedProvider?.name}`}>
        <div className="space-y-3">
          {selectedProvider && Object.entries(selectedProvider.settings).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
              <input 
                type={key.includes('Token') || key.includes('Secret') || key.includes('Key') ? 'password' : 'text'}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
                value={providerForm[key] || ''}
                onChange={e=>setProviderForm(prev => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={()=>setProviderModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={saveProvider} className="px-4 py-2 bg-fastnet text-white rounded">Save Settings</button>
          </div>
        </div>
      </Modal>

      {/* Template Modal */}
      <Modal open={templateModal} onClose={()=>setTemplateModal(false)} title={selectedTemplate ? 'Edit Template' : 'New Template'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name*</label>
            <input 
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              value={templateForm.name}
              onChange={e=>setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select 
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              value={templateForm.category}
              onChange={e=>setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
            >
              <option>Billing</option>
              <option>Onboarding</option>
              <option>Account</option>
              <option>Security</option>
              <option>Marketing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message Text*</label>
            <textarea 
              rows={4}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              value={templateForm.text}
              onChange={e=>setTemplateForm(prev => ({ ...prev, text: e.target.value }))}
            />
            <div className="text-xs text-slate-500 mt-1">Character count: {templateForm.text.length}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Quick Insert Variables</label>
            <div className="flex flex-wrap gap-2">
              {smsData.variables.slice(0, 6).map((v, idx) => (
                <button 
                  key={idx}
                  onClick={()=>insertVariable(v.name)}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="template-active"
              checked={templateForm.active}
              onChange={e=>setTemplateForm(prev => ({ ...prev, active: e.target.checked }))}
            />
            <label htmlFor="template-active" className="text-sm">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={()=>setTemplateModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={saveTemplate} className="px-4 py-2 bg-fastnet text-white rounded">
              {selectedTemplate ? 'Update' : 'Create'} Template
            </button>
          </div>
        </div>
      </Modal>

      {/* Send SMS Modal */}
      <Modal open={sendModal} onClose={()=>setSendModal(false)} title="Send SMS">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number*</label>
            <input 
              type="tel"
              placeholder="+254700123456"
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              value={sendForm.to}
              onChange={e=>setSendForm(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message*</label>
            <textarea 
              rows={4}
              placeholder="Type your message here..."
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              value={sendForm.message}
              onChange={e=>setSendForm(prev => ({ ...prev, message: e.target.value }))}
            />
            <div className="text-xs text-slate-500 mt-1">
              Character count: {sendForm.message.length} | SMS parts: {Math.ceil(sendForm.message.length / 160)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Or use a template</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {smsData.templates.filter(t=>t.active).map(template => (
                <button
                  key={template.id}
                  onClick={()=>useTemplate(template)}
                  className="w-full text-left px-3 py-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-slate-500 truncate">{template.text}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={()=>setSendModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={sendSMS} className="px-4 py-2 bg-fastnet text-white rounded">Send SMS</button>
          </div>
        </div>
      </Modal>

      {/* Custom Provider Modal */}
      <Modal open={customProviderModal} onClose={()=>setCustomProviderModal(false)} title="Add Custom SMS Provider">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Provider Name*</label>
            <input 
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              placeholder="e.g., My SMS Gateway"
              value={customProviderForm.name}
              onChange={e=>setCustomProviderForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input 
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              placeholder="Brief description of the provider"
              value={customProviderForm.description}
              onChange={e=>setCustomProviderForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Emoji Icon (optional)</label>
            <input 
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              placeholder="📡"
              maxLength={2}
              value={customProviderForm.logo}
              onChange={e=>setCustomProviderForm(prev => ({ ...prev, logo: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Service Type*</label>
            <select 
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
              value={customProviderForm.serviceType}
              onChange={e=>setCustomProviderForm(prev => ({ ...prev, serviceType: e.target.value }))}
            >
              <option value="both">Both (Hotspot + PPPoE)</option>
              <option value="hotspot">Hotspot Only</option>
              <option value="pppoe">PPPoE Only</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Select which service types this provider will handle</p>
          </div>

          <div className="border-t pt-3">
            <label className="block text-sm font-medium mb-2">API Settings*</label>
            <p className="text-xs text-slate-500 mb-3">Add configuration fields for your SMS provider (API keys, URLs, sender IDs, etc.)</p>
            
            {/* Existing settings */}
            {customProviderForm.settings.length > 0 && (
              <div className="space-y-2 mb-3">
                {customProviderForm.settings.map((setting, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                    <div className="flex-1">
                      <span className="text-xs font-medium">{setting.key}</span>
                      <span className="text-xs text-slate-500 ml-2">({setting.type})</span>
                    </div>
                    <button 
                      onClick={()=>removeSettingField(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new setting */}
            <div className="space-y-2 p-3 border rounded bg-slate-50 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1">Field Name</label>
                  <input 
                    className="w-full px-2 py-1.5 border rounded bg-white dark:bg-slate-700 text-sm"
                    placeholder="e.g., apiKey"
                    value={newSetting.key}
                    onChange={e=>setNewSetting(prev => ({ ...prev, key: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Field Type</label>
                  <select 
                    className="w-full px-2 py-1.5 border rounded bg-white dark:bg-slate-700 text-sm"
                    value={newSetting.type}
                    onChange={e=>setNewSetting(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="text">Text</option>
                    <option value="password">Password</option>
                    <option value="url">URL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1">Default Value (optional)</label>
                <input 
                  className="w-full px-2 py-1.5 border rounded bg-white dark:bg-slate-700 text-sm"
                  placeholder="Leave empty or enter default value"
                  value={newSetting.value}
                  onChange={e=>setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <button 
                onClick={addSettingField}
                className="w-full px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                + Add Setting Field
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button onClick={()=>setCustomProviderModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={saveCustomProvider} className="px-4 py-2 bg-fastnet text-white rounded">Add Provider</button>
          </div>
        </div>
      </Modal>

      {/* SMS Detail Modal */}
      <Modal open={outboxModal} onClose={()=>setOutboxModal(false)} title="SMS Message Details">
        {selectedSms && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Recipient</label>
                <div className="text-sm font-medium">{selectedSms.recipient}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                <div className="text-sm font-mono">{selectedSms.to}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reason</label>
                <div className="text-sm">{selectedSms.reason}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <div className="text-sm">
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {selectedSms.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    selectedSms.status === 'delivered' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : selectedSms.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : selectedSms.status === 'failed'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {selectedSms.status.charAt(0).toUpperCase() + selectedSms.status.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Provider</label>
                <div className="text-sm">{selectedSms.provider}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sent At</label>
              <div className="text-sm">
                {new Date(selectedSms.sentAt).toLocaleString()}
              </div>
            </div>

            {selectedSms.deliveredAt && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Delivered At</label>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {new Date(selectedSms.deliveredAt).toLocaleString()}
                </div>
              </div>
            )}

            {selectedSms.failedAt && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Failed At</label>
                <div className="text-sm text-red-600 dark:text-red-400">
                  {new Date(selectedSms.failedAt).toLocaleString()}
                </div>
              </div>
            )}

            {selectedSms.failureReason && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Failure Reason</label>
                <div className="text-sm text-red-600 dark:text-red-400">
                  {selectedSms.failureReason}
                </div>
              </div>
            )}

            <div className="border-t pt-3">
              <label className="block text-xs font-medium text-slate-500 mb-2">Message Content</label>
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded border text-sm leading-relaxed">
                {selectedSms.message}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Character count: {selectedSms.message.length} | SMS parts: {Math.ceil(selectedSms.message.length / 160)}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button onClick={()=>setOutboxModal(false)} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
