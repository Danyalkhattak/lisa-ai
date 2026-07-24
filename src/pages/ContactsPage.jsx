import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  X,
  Check,
  UserPlus,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

/**
 * Contacts Page - Simple CRUD for email contacts.
 */

export default function ContactsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const userId = user?.id;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Queries - only run when userId is available
  const contactsResult = userId
    ? (searchQuery 
        ? useQuery(api.contacts.search, { query: searchQuery, userId })
        : useQuery(api.contacts.list, { userId }))
    : undefined;
    
  // Safe access with defaults
  const isLoading = contactsResult === undefined ? true : (contactsResult?.isLoading ?? false);
  const contactsData = contactsResult?.data;

  // Mutations
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);

  const resetForm = useCallback(() => {
    setFormData({ name: "", email: "" });
    setEditingContact(null);
    setShowForm(false);
    setError("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!userId) {
        setError('You must be logged in to add contacts');
        return;
      }
      
      if (editingContact) {
        await updateContact({ id: editingContact, ...formData });
        setSuccess("Contact updated!");
      } else {
        await createContact({ ...formData, userId });
        setSuccess("Contact added!");
      }
      
      resetForm();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.message || "Failed to save contact");
    }
  };

  const startEdit = (contact) => {
    setEditingContact(contact._id);
    setFormData({ name: contact.name, email: contact.email });
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this contact?")) return;

    try {
      await deleteContact({ id });
      setSuccess("Contact deleted!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#09090B]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            <span className="hidden sm:inline">Contacts</span>
          </h1>
          
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!userId}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
        </div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">
                    {editingContact ? "Edit Contact" : "New Contact"}
                  </h2>
                  <button onClick={resetForm} type="button" className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name (e.g., Ali)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  
                  <input
                    type="email"
                    placeholder="Email (e.g., ali@example.com)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {editingContact ? (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Update Contact
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Contact
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <div className="space-y-2">
          {!userLoaded || isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              Loading contacts...
            </div>
          ) : !contactsData || contactsData.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-700" />
              <p className="text-gray-500 mb-2">No contacts yet</p>
              <p className="text-gray-600 text-sm">
                Add contacts to easily send emails via voice.
              </p>
            </div>
          ) : (
            contactsData.map((contact) => (
              <motion.div
                key={contact._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{contact.name}</p>
                    <p className="text-gray-500 text-sm truncate">{contact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(contact)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
