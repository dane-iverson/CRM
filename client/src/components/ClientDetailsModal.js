import React from "react";

function ClientDetailsModal({ lead, onClose }) {
  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{lead.name}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="fw-bold text-muted">Phone</label>
              <p className="text-dark">{lead.phone}</p>
            </div>
            {lead.email && (
              <div className="mb-3">
                <label className="fw-bold text-muted">Email</label>
                <p className="text-dark">{lead.email}</p>
              </div>
            )}
            {lead.product && (
              <div className="mb-3">
                <label className="fw-bold text-muted">Product/Service</label>
                <p className="text-dark">{lead.product}</p>
              </div>
            )}
            {lead.userId && lead.userId.name && (
              <div className="mb-3">
                <label className="fw-bold text-muted">Sales Rep</label>
                <p className="text-dark">{lead.userId.name}</p>
              </div>
            )}
            <div className="mb-3">
              <label className="fw-bold text-muted">Status</label>
              <p>
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
              </p>
            </div>
            <div className="mb-3">
              <label className="fw-bold text-muted">Last Contacted</label>
              <p className="text-dark">
                {lead.lastContactedAt
                  ? new Date(lead.lastContactedAt).toLocaleDateString()
                  : "Not yet contacted"}
              </p>
            </div>
            {lead.contactHistory && lead.contactHistory.length > 0 && (
              <div className="mb-3">
                <label className="fw-bold text-muted">Contact Log</label>
                <ul className="mb-0">
                  {[...lead.contactHistory]
                    .sort((a, b) => new Date(b) - new Date(a))
                    .slice(0, 5)
                    .map((entry, index) => (
                      <li key={`${entry}-${index}`} className="text-dark">
                        {new Date(entry).toLocaleString()}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {lead.followUpDate && (
              <div className="mb-3">
                <label className="fw-bold text-muted">Follow-up Date</label>
                <p className="text-dark">
                  {new Date(lead.followUpDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {lead.notes && (
              <div className="mb-3">
                <label className="fw-bold text-muted">Notes</label>
                <p className="text-dark" style={{ whiteSpace: "pre-wrap" }}>
                  {lead.notes}
                </p>
              </div>
            )}
            {!lead.notes && (
              <div className="alert alert-info">
                No notes saved for this lead.
              </div>
            )}
            <div className="text-muted small">
              <p>Created: {new Date(lead.createdAt).toLocaleDateString()}</p>
              <p>
                Last Updated: {new Date(lead.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDetailsModal;
