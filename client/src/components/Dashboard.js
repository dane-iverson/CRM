import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AddLeadModal from "./AddLeadModal";
import ReminderModal from "./ReminderModal";
import EditLeadModal from "./EditLeadModal";
import ClientDetailsModal from "./ClientDetailsModal";
import { API_BASE } from "../config/api";

function formatPhone(phone) {
  // Assuming South African numbers, convert 0XXXXXXXXX to +27XXXXXXXXX
  if (phone.startsWith("0")) {
    return "+27" + phone.slice(1);
  }
  return phone;
}

function Dashboard({ user, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [repFilter, setRepFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/leads`);
      setLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();

    // Set up interval for every 10 seconds
    const interval = setInterval(fetchLeads, 10000);

    // Set up focus listener
    const handleFocus = () => fetchLeads();
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchLeads]);

  const handleRefresh = () => {
    fetchLeads();
  };

  const filterLeads = () => {
    let filtered = leads;

    if (user.role === "admin" && repFilter !== "All") {
      filtered = filtered.filter((lead) => {
        const assignedRepId =
          lead.userId && typeof lead.userId === "object"
            ? lead.userId._id
            : lead.userId;

        if (repFilter === "Unassigned") {
          return !assignedRepId;
        }

        return assignedRepId === repFilter;
      });
    }

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

  const repOptions = Array.from(
    leads.reduce((acc, lead) => {
      if (lead.userId && typeof lead.userId === "object" && lead.userId._id) {
        acc.set(lead.userId._id, lead.userId.name || "Unknown Rep");
      }
      return acc;
    }, new Map()),
  );

  const hasUnassignedLeads = leads.some((lead) => !lead.userId);

  useEffect(() => {
    filterLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, statusFilter, repFilter, searchQuery]);

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
          <button className="btn btn-outline-danger" onClick={onLogout}>
            Logout
          </button>
        </div>

        {user.role === "admin" && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card bg-light border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Admin Summary</h5>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="badge bg-primary fs-6 p-3">
                      Total leads: {leads.length}
                    </div>
                    {Object.entries(
                      leads.reduce((acc, lead) => {
                        const repName = lead.userId?.name || "Unassigned";
                        acc[repName] = (acc[repName] || 0) + 1;
                        return acc;
                      }, {}),
                    ).map(([rep, count]) => (
                      <div key={rep} className="badge bg-secondary fs-6 p-3">
                        {rep}: {count}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
            {user.role === "admin" && (
              <select
                value={repFilter}
                onChange={(e) => setRepFilter(e.target.value)}
                className="form-select"
              >
                <option value="All">All Sales Reps</option>
                {repOptions.map(([repId, repName]) => (
                  <option key={repId} value={repId}>
                    {repName}
                  </option>
                ))}
                {hasUnassignedLeads && (
                  <option value="Unassigned">Unassigned</option>
                )}
              </select>
            )}
            <input
              type="text"
              placeholder="Search by name or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control flex-fill"
            />
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={handleRefresh}
              className="btn btn-outline-secondary"
              title="Refresh leads"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              Add Lead
            </button>
          </div>
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
                        : "Unassigned"}
                    </td>
                  )}
                  <td className="text-muted">{lead.product || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        lead.status === "New"
                          ? "bg-success"
                          : lead.status === "Contacted"
                            ? "bg-primary"
                            : lead.status === "Quoted"
                              ? "bg-warning"
                              : "bg-secondary"
                      }`}
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
                      href={`https://wa.me/${formatPhone(lead.phone)}?text=${encodeURIComponent(
                        `Hi ${lead.name}, just following up on your quote/request.`,
                      )}`}
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

export default Dashboard;
