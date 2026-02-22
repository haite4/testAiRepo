import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChannels, addChannel, updateChannel, deleteChannel, sendPost } from '../services/api';

export default function Dashboard() {
  const [channels, setChannels] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState('');
  const [newCh, setNewCh] = useState({ name: '', channel_id: '', bot_token: '' });
  const [showForm, setShowForm] = useState(false);
  const [results, setResults] = useState(null);
  const [sending, setSending] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', channel_id: '', bot_token: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => { loadChannels(); }, []);

  async function loadChannels() {
    try {
      const { data } = await getChannels();
      setChannels(data);
    } catch { /* silently fail */ }
  }

  async function handleAddChannel(e) {
    e.preventDefault();
    setAddLoading(true);
    setFormError('');
    try {
      await addChannel(newCh);
      setNewCh({ name: '', channel_id: '', bot_token: '' });
      setShowForm(false);
      loadChannels();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add channel');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteChannel(id);
      setChannels(cs => cs.filter(c => c.id !== id));
      setSelectedIds(sel => sel.filter(s => s !== id));
    } catch { /* silently fail */ }
  }

  function handleEditClick(e, ch) {
    e.stopPropagation();
    setEditingId(ch.id);
    setEditForm({ name: ch.name, channel_id: ch.channel_id, bot_token: '' });
    setEditError('');
  }

  function handleEditCancel(e) {
    e.stopPropagation();
    setEditingId(null);
    setEditError('');
  }

  async function handleEditSubmit(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setEditLoading(true);
    setEditError('');
    try {
      const { data } = await updateChannel(id, editForm);
      setChannels(cs => cs.map(c => c.id === id ? { ...c, name: data.name, channel_id: data.channel_id } : c));
      setEditingId(null);
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update channel');
    } finally {
      setEditLoading(false);
    }
  }

  function toggleChannel(id) {
    setSelectedIds(sel =>
      sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]
    );
  }

  async function handleSend() {
    if (!message.trim() || !selectedIds.length) return;
    setSending(true);
    setResults(null);
    try {
      const { data } = await sendPost(message, selectedIds);
      setResults(data.results);
      if (data.results.every(r => r.success)) setMessage('');
    } catch (err) {
      setResults([{
        channel: 'Error',
        success: false,
        error: err.response?.data?.error || 'Request failed'
      }]);
    } finally {
      setSending(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  }

  const canSend = message.trim().length > 0 && selectedIds.length > 0 && !sending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-800">Telegram Poster</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Signed in as <span className="font-medium text-gray-700">{username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: Channel list ── */}
        <aside className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">Channels</h2>
              <button
                onClick={() => { setShowForm(f => !f); setFormError(''); }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {showForm ? 'Cancel' : '+ Connect'}
              </button>
            </div>

            {/* Add channel form */}
            {showForm && (
              <form onSubmit={handleAddChannel} className="p-4 space-y-3 bg-gray-50 border-b border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
                  <input
                    value={newCh.name}
                    onChange={e => setNewCh(n => ({ ...n, name: e.target.value }))}
                    placeholder="e.g. My News Channel"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Channel ID or @username</label>
                  <input
                    value={newCh.channel_id}
                    onChange={e => setNewCh(n => ({ ...n, channel_id: e.target.value }))}
                    placeholder="@mychannel or -1001234567890"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bot token</label>
                  <input
                    value={newCh.bot_token}
                    onChange={e => setNewCh(n => ({ ...n, bot_token: e.target.value }))}
                    placeholder="123456789:ABC-DEF..."
                    type="password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {addLoading ? 'Connecting...' : 'Connect Channel'}
                </button>
                <p className="text-xs text-gray-400 leading-relaxed">
                  The bot must be an admin in the channel with permission to post messages.
                </p>
              </form>
            )}

            {/* Channel list */}
            <div className="p-3">
              {channels.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <p className="text-sm">No channels yet</p>
                  <p className="text-xs mt-0.5">Click "+ Connect" to add one</p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {channels.map(ch => {
                    const selected = selectedIds.includes(ch.id);
                    const isEditing = editingId === ch.id;
                    return (
                      <li key={ch.id} className="rounded-lg overflow-hidden">
                        <div
                          onClick={() => !isEditing && toggleChannel(ch.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 border transition-all select-none ${
                            isEditing
                              ? 'border-blue-300 bg-blue-50 rounded-t-lg cursor-default'
                              : selected
                              ? 'border-blue-300 bg-blue-50 rounded-lg cursor-pointer'
                              : 'border-transparent hover:bg-gray-50 rounded-lg cursor-pointer'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {selected && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{ch.name}</p>
                            <p className="text-xs text-gray-400 truncate">{ch.channel_id}</p>
                          </div>
                          <button
                            onClick={e => isEditing ? handleEditCancel(e) : handleEditClick(e, ch)}
                            className="text-gray-300 hover:text-blue-400 transition-colors p-0.5 flex-shrink-0"
                            title={isEditing ? 'Cancel edit' : 'Edit'}
                          >
                            {isEditing ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            )}
                          </button>
                          {!isEditing && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(ch.id); }}
                              className="text-gray-300 hover:text-red-400 transition-colors p-0.5 flex-shrink-0"
                              title="Remove"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Inline edit form */}
                        {isEditing && (
                          <form
                            onSubmit={e => handleEditSubmit(e, ch.id)}
                            onClick={e => e.stopPropagation()}
                            className="p-3 space-y-2 bg-gray-50 border border-t-0 border-blue-300 rounded-b-lg"
                          >
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
                              <input
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. My News Channel"
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Channel ID or @username</label>
                              <input
                                value={editForm.channel_id}
                                onChange={e => setEditForm(f => ({ ...f, channel_id: e.target.value }))}
                                placeholder="@mychannel or -1001234567890"
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Bot token</label>
                              <input
                                value={editForm.bot_token}
                                onChange={e => setEditForm(f => ({ ...f, bot_token: e.target.value }))}
                                placeholder="Leave blank to keep existing token"
                                type="password"
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            {editError && <p className="text-xs text-red-500">{editError}</p>}
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={editLoading}
                                className="flex-1 text-sm bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                              >
                                {editLoading ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                type="button"
                                onClick={e => handleEditCancel(e)}
                                className="flex-1 text-sm bg-gray-100 text-gray-600 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <p className="text-center text-xs font-medium text-blue-600">
              {selectedIds.length} channel{selectedIds.length > 1 ? 's' : ''} selected
            </p>
          )}
        </aside>

        {/* ── RIGHT: Composer + Results ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Composer */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">Compose Message</h2>
            </div>
            <div className="p-5">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here. It will be sent as-is to all selected channels."
                rows={9}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-gray-400">
                  {message.length} characters
                  {selectedIds.length === 0 && channels.length > 0 && (
                    <span className="ml-3 text-amber-500">Select channels on the left</span>
                  )}
                </div>
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send to {selectedIds.length || 0} channel{selectedIds.length !== 1 ? 's' : ''}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Send results */}
          {results && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Send Results</h3>
              </div>
              <div className="p-5 space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      r.success
                        ? 'bg-green-50 border-green-100'
                        : 'bg-red-50 border-red-100'
                    }`}
                  >
                    <span className={`text-base leading-none mt-0.5 font-bold ${r.success ? 'text-green-500' : 'text-red-500'}`}>
                      {r.success ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${r.success ? 'text-green-800' : 'text-red-800'}`}>
                        {r.channel} — {r.success ? 'Sent successfully' : 'Failed to send'}
                      </p>
                      {!r.success && r.error && (
                        <p className="text-xs text-red-500 mt-0.5">{r.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
