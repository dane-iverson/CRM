import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ReminderModal({ lead, onClose, onSubmit }) {
  const [reminderDate, setReminderDate] = useState(new Date());
  const [emailAlert, setEmailAlert] = useState(false);
  const [smsAlert, setSmsAlert] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const reminderData = {
      date: reminderDate.toISOString(),
      email: emailAlert,
      sms: smsAlert,
    };
    onSubmit(lead._id, reminderData);
  };

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
            <h5 className="modal-title">Set Reminder for {lead.name}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Reminder Date</label>
                <DatePicker
                  selected={reminderDate}
                  onChange={setReminderDate}
                  className="form-control"
                />
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    checked={emailAlert}
                    onChange={(e) => setEmailAlert(e.target.checked)}
                    className="form-check-input"
                    id="emailCheck"
                  />
                  <label className="form-check-label" htmlFor="emailCheck">
                    Email Alert
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    checked={smsAlert}
                    onChange={(e) => setSmsAlert(e.target.checked)}
                    className="form-check-input"
                    id="smsCheck"
                  />
                  <label className="form-check-label" htmlFor="smsCheck">
                    SMS Alert
                  </label>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Set Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReminderModal;
