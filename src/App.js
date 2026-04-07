import React, { useState, useEffect } from "react";
import axios from "axios";
import AddLeadModal from "./components/AddLeadModal";
import ReminderModal from "./components/ReminderModal";
import EditLeadModal from "./components/EditLeadModal";
import ClientDetailsModal from "./components/ClientDetailsModal";
import LoginPage from "./components/LoginPage";

const API_BASE = "http://localhost:4000";

function formatPhone(phone) {
  // Assuming South African numbers, convert 0XXXXXXXXX to +27XXXXXXXXX
  if (phone.startsWith("0")) {
    return "+27" + phone.slice(1);
  }
  return phone;
}

function App() {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Set default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchLeads();
    }
  }, []);

  const filterLeads = () => {
    let filtered = leads;
    if (statusFilter !== "All") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.phone.includes(searchQuery) ||
          (lead.userId &&
            lead.userId.name &&
            lead.userId.name.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }
    setFilteredLeads(filtered);
  };

  useEffect(() => {
    filterLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, statusFilter, searchQuery]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_BASE}/leads`);
      setLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const handleAddLead = async (leadData) => {
    try {
      await axios.post(`${API_BASE}/leads`, leadData);
      fetchLeads();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding lead:", error);
    }
  };

  const handleReminder = async (leadId, reminderData) => {
    try {
      await axios.post(`${API_BASE}/reminder/${leadId}`, reminderData);
      setShowReminderModal(false);
    } catch (error) {
      console.error("Error setting reminder:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setLeads([]);
    setFilteredLeads([]);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleEditClick = (lead) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (updatedData) => {
    try {
      await axios.put(`${API_BASE}/leads/${selectedLead._id}`, updatedData);
      fetchLeads();
      setShowEditModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const handleDeleteClick = (leadId) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      handleDeleteLead(leadId);
    }
  };

  const handleDeleteLead = async (leadId) => {
    try {
      await axios.delete(`${API_BASE}/leads/${leadId}`);
      fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const handleViewDetailsClick = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isOverdue = (date) => {
    return date && new Date(date) < new Date();
  };

  return (
    <div className="min-vh-100 bg-light p-4">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="display-4 fw-bold text-dark">CRM Dashboard</h1>
            <p className="text-muted">Welcome, {user.name}</p>
          </div>
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
          <div className="d-flex gap-2 mb-2 mb-md-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Quoted">Quoted</option>
              <option value="Closed">Closed</option>
            </select>
            <input
              type="text"
              placeholder="Search by name or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control flex-fill"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            Add Lead
          </button>
        </div>

        <div className="bg-white shadow rounded">
          <table className="table table-striped mb-0">
            <thead className="table-light">
              <tr>
                <th className="text-start">Name</th>
                <th className="text-start">Phone</th>
                {user.role === "admin" && (
                  <th className="text-start">Sales Rep</th>
                )}
                <th className="text-start">Product/Service</th>
                <th className="text-start">Status</th>
                <th className="text-start">Last Contact</th>
                <th className="text-start">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead._id}
                  className={isOverdue(lead.followUpDate) ? "table-danger" : ""}
                >
                  <td className="fw-medium text-dark">{lead.name}</td>
                  <td className="text-muted">{lead.phone}</td>
                  {user.role === "admin" && (
                    <td className="text-muted">
                      {lead.userId && lead.userId.name
                        ? lead.userId.name
                        : user.name}
                    </td>
                  )}
                  <td className="text-muted">{lead.product || "-"}</td>
                  <td>
                    <span
                      className={`badge ${lead.status === "New" ? "bg-success" : lead.status === "Contacted" ? "bg-primary" : lead.status === "Quoted" ? "bg-warning" : "bg-secondary"}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="text-muted">
                    {lead.updatedAt
                      ? new Date(lead.updatedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="d-flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleViewDetailsClick(lead)}
                      className="btn btn-sm btn-outline-info"
                      title="View client details and notes"
                      aria-label="View details"
                    >
                      Details
                    </button>
                    <a
                      href={`https://wa.me/${formatPhone(lead.phone)}?text=${encodeURIComponent(`Hi ${lead.name}, just following up on your quote/request.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success"
                      title="Open WhatsApp chat"
                      aria-label="WhatsApp"
                    >
                      WhatsApp
                    </a>
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowReminderModal(true);
                      }}
                      className="btn btn-sm btn-outline-warning"
                      title="Schedule a reminder for this lead"
                      aria-label="Reminder"
                    >
                      Reminder
                    </button>
                    <button
                      onClick={() => handleEditClick(lead)}
                      className="btn btn-sm btn-outline-primary"
                      title="Edit this lead"
                      aria-label="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(lead._id)}
                      className="btn btn-sm btn-outline-danger"
                      title="Delete this lead"
                      aria-label="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddModal && (
          <AddLeadModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddLead}
          />
        )}

        {showReminderModal && selectedLead && (
          <ReminderModal
            lead={selectedLead}
            onClose={() => setShowReminderModal(false)}
            onSubmit={handleReminder}
          />
        )}

        {showEditModal && selectedLead && (
          <EditLeadModal
            lead={selectedLead}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEditSubmit}
          />
        )}

        {showDetailsModal && selectedLead && (
          <ClientDetailsModal
            lead={selectedLead}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
