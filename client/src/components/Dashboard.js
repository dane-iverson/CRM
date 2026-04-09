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

function getReminderLevel(lead) {
  const anchorDate = lead.lastContactedAt || lead.createdAt;
  if (!anchorDate) return null;

  const daysSinceContact = Math.floor(
    (Date.now() - new Date(anchorDate).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceContact >= 14) {
    return { level: "critical", days: daysSinceContact };
  }

  if (daysSinceContact >= 7) {
    return { level: "warning", days: daysSinceContact };
  }

  return null;
}

function Dashboard({ user, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [alerts, setAlerts] = useState([]);
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

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/alerts`);
      const uniqueAlerts = Array.from(
        response.data
          .reduce((acc, alert) => {
            const key = `${alert.leadId?._id || alert.leadId}:${alert.userId?._id || "unassigned"}`;
            if (!acc.has(key)) {
              acc.set(key, alert);
            }
            return acc;
          }, new Map())
          .values(),
      );
      setAlerts(uniqueAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchAlerts();

    // Set up interval for every 10 seconds
    const interval = setInterval(() => {
      fetchLeads();
      fetchAlerts();
    }, 10000);

    // Set up focus listener
    const handleFocus = () => {
      fetchLeads();
      fetchAlerts();
    };
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchLeads, fetchAlerts]);

  const handleRefresh = () => {
    fetchLeads();
    fetchAlerts();
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
      fetchAlerts();
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const handleViewDetailsClick = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleMarkContacted = async (leadId) => {
    try {
      await axios.post(`${API_BASE}/leads/${leadId}/contact`);
      fetchLeads();
      fetchAlerts();
    } catch (error) {
      console.error("Error marking lead as contacted:", error);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await axios.delete(`${API_BASE}/alerts/${alertId}`);
      fetchAlerts();
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const isOverdue = (date) => {
    return date && new Date(date) < new Date();
  };

  const criticalAlerts = alerts.filter((alert) => alert.level === "critical");
  const warningAlerts = alerts.filter((alert) => alert.level === "warning");

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

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="card-title mb-0">Urgency Inbox</h5>
              <div className="d-flex gap-2">
                <span className="badge bg-danger">
                  Critical: {criticalAlerts.length}
                </span>
                <span className="badge bg-warning text-dark">
                  Warning: {warningAlerts.length}
                </span>
              </div>
            </div>
            {alerts.length === 0 ? (
              <p className="text-muted mb-0">No active urgency reminders.</p>
            ) : (
              <div className="list-group">
                {alerts.slice(0, 10).map((alert) => {
                  const alertLead = alert.leadId;
                  const leadData =
                    leads.find((lead) => lead._id === alertLead?._id) ||
                    alertLead;

                  return (
                    <div
                      key={alert._id}
                      className="list-group-item d-flex flex-column flex-md-row justify-content-between gap-2"
                    >
                      <div>
                        <span
                          className={`badge me-2 ${
                            alert.level === "critical"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {alert.level === "critical" ? "Critical" : "Warning"}
                        </span>
                        <strong>{alertLead?.name || "Lead"}</strong>
                        <div className="text-muted small mt-1">
                          {alert.message}
                        </div>
                        {user.role === "admin" && alert.userId?.name && (
                          <div className="text-muted small">
                            Assigned rep: {alert.userId.name}
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleMarkContacted(alertLead?._id)}
                        >
                          Mark Contacted
                        </button>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleViewDetailsClick(leadData)}
                        >
                          Open Lead
                        </button>
                        {user.role === "admin" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDismissAlert(alert._id)}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded">
          <table className="table mb-0">
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
              {filteredLeads.map((lead) => {
                const reminderLevel = getReminderLevel(lead);
                const rowHighlightClass = reminderLevel?.level
                  ? reminderLevel.level === "critical"
                    ? "table-danger"
                    : "table-warning"
                  : isOverdue(lead.followUpDate)
                    ? "table-danger"
                    : "";

                return (
                  <tr key={lead._id}>
                    <td className={`fw-medium text-dark ${rowHighlightClass}`}>
                      {lead.name}
                    </td>
                    <td className={`text-muted ${rowHighlightClass}`}>
                      {lead.phone}
                    </td>
                    {user.role === "admin" && (
                      <td className={`text-muted ${rowHighlightClass}`}>
                        {lead.userId && lead.userId.name
                          ? lead.userId.name
                          : "Unassigned"}
                      </td>
                    )}
                    <td className={`text-muted ${rowHighlightClass}`}>
                      {lead.product || "-"}
                    </td>
                    <td className={rowHighlightClass}>
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
                    <td className={`text-muted ${rowHighlightClass}`}>
                      {lead.lastContactedAt
                        ? new Date(lead.lastContactedAt).toLocaleDateString()
                        : "-"}
                      {reminderLevel && (
                        <div>
                          <span
                            className={`badge mt-1 ${
                              reminderLevel.level === "critical"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {reminderLevel.days} days since contact
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={`align-middle ${rowHighlightClass}`}>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleMarkContacted(lead._id)}
                          className="btn btn-sm btn-success"
                          title="Mark this lead as contacted and log today"
                          aria-label="Mark contacted"
                        >
                          Mark Contacted
                        </button>
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
                      </div>
                    </td>
                  </tr>
                );
              })}
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
