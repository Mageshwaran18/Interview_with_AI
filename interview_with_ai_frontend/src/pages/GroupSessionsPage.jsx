import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StarfieldBackground from "../components/StarfieldBackground";
import GlassNav from "../components/GlassNav";
import Toast from "../components/Toast";
import { bulkCreateSessions } from "../services/api";
import "./GroupSessionsPage.css";

/*
 ─── GroupSessionsPage Component ───

 Lets hiring managers create bulk group sessions:
 1. Fill group name, duration, template, start/end window
 2. Upload CSV (Name, Gmail) — parsed client-side
 3. Click "Validate" → dry-run; shows per-row result table
 4. Click "Confirm & Send" → real create; shows links + download CSV
*/

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], error: "CSV has no data rows." };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("gmail"); // accept case-insensitive Gmail header

  if (nameIdx === -1 || emailIdx === -1) {
    return {
      rows: [],
      error: `CSV must have columns "Name" and "Gmail". Found: ${header.join(", ")}`,
    };
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(",").map((c) => c.trim());
    rows.push({ name: cols[nameIdx] || "", Gmail: cols[emailIdx] || "" });
  }
  return { rows, error: null };
}

// ─── Date/time helpers ────────────────────────────────────────────────────────

// Generate list of available dates (today + next 30 days)
function getAvailableDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 31; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
    dates.push(dateStr);
  }
  return dates;
}

// Convert "HH:MM AM/PM" to 24-hour "HH:MM" format
function time12to24(time12) {
  const [time, period] = time12.trim().split(/\s+/);
  if (!time || !period) return "";
  const [hours, minutes] = time.split(":");
  let h = parseInt(hours, 10);
  const m = minutes || "00";
  
  if (period.toUpperCase() === "AM") {
    if (h === 12) h = 0;
  } else if (period.toUpperCase() === "PM") {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, '0')}:${m}`;
}

// Convert "HH:MM" (24-hour) to "HH:MM AM/PM" format
function time24to12(time24) {
  const [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const m = minutes || "00";
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
}

// Combine date (YYYY-MM-DD) and time (HH:MM in 24-hour format) into ISO string
// Store time exactly as entered by user (no timezone conversion)
// Assumption: User is in IST and candidate is also in IST
function dateTimeToISO(date, time) {
  if (!date || !time) return new Date().toISOString();
  
  // Simply combine date and time without any timezone conversion
  // The date is in YYYY-MM-DD format, time is in HH:MM format
  // Create ISO string: YYYY-MM-DDTHH:MM:00
  return new Date(`${date}T${time}:00`).toISOString();
}

// Convert ISO date string back to IST time for display (HH:MM AM/PM)
function isoToIST(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  
  // Add IST offset (5 hours 30 minutes) to convert from UTC to IST
  const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  
  const h = String(istDate.getUTCHours()).padStart(2, '0');
  const m = String(istDate.getUTCMinutes()).padStart(2, '0');
  return time24to12(`${h}:${m}`);
}

function getDefaultStartDate() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function getDefaultStartTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return time24to12(`${h}:${m}`); // "HH:MM AM/PM"
}

function getDefaultEndDate() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function getDefaultEndTime() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return time24to12(`${h}:${m}`);
}

function GroupSessionsPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [duration, setDuration] = useState(60);
  const [template, setTemplate] = useState("Simple Calculator");
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [endTime, setEndTime] = useState(getDefaultEndTime);

  // CSV state
  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [dragging, setDragging] = useState(false);

  // Flow state
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);   // BulkSessionCreateResponse
  const [submitResult, setSubmitResult] = useState(null);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ─── CSV handling ─────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      setCsvError("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, error } = parseCSV(e.target.result);
      if (error) {
        setCsvError(error);
        setCsvRows([]);
      } else if (rows.length === 0) {
        setCsvError("CSV has no candidate rows.");
        setCsvRows([]);
      } else if (rows.length > 20) {
        setCsvError(`Too many rows: ${rows.length}. Maximum is 20.`);
        setCsvRows([]);
      } else {
        setCsvRows(rows);
        setCsvError("");
        setDryRunResult(null);
        setSubmitResult(null);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  // ─── Build payload ────────────────────────────────────────────────────────
  const buildPayload = (dryRun) => ({
    group_name: groupName,
    time_limit_minutes: parseInt(duration),
    project_template: template,
    start_at: dateTimeToISO(startDate, startTime),
    end_at: dateTimeToISO(endDate, endTime),
    candidates: csvRows,
    dry_run: dryRun,
  });

  // ─── Validation (dry-run) ─────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!groupName.trim()) { showToast("Group name is required.", "error"); return; }
    if (csvRows.length === 0) { showToast("Please upload a valid CSV first.", "error"); return; }
    
    const startISO = dateTimeToISO(startDate, startTime);
    const endISO = dateTimeToISO(endDate, endTime);
    if (new Date(startISO) >= new Date(endISO)) {
      showToast("Start time must be before end time.", "error"); return;
    }

    setValidating(true);
    setDryRunResult(null);
    try {
      const res = await bulkCreateSessions(buildPayload(true), true);
      setDryRunResult(res.data);
      if (res.data.failed === 0) {
        showToast(`✅ All ${res.data.valid} rows are valid! Ready to send.`, "success");
      } else {
        showToast(`⚠️ ${res.data.failed} row(s) have errors. Fix them before sending.`, "error");
      }
    } catch (err) {
      showToast(err.response?.data?.detail || "Validation failed.", "error");
    } finally {
      setValidating(false);
    }
  };

  // ─── Real submit ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await bulkCreateSessions(buildPayload(false), false);
      setSubmitResult(res.data);
      setDryRunResult(null);
      if (res.data.failed === 0) {
        showToast(`🚀 ${res.data.valid} sessions created and emails sent!`, "success");
      } else {
        showToast(`⚠️ ${res.data.valid} created, ${res.data.failed} failed.`, "error");
      }
    } catch (err) {
      showToast(err.response?.data?.detail || "Bulk create failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Download CSV of links ────────────────────────────────────────────────
  const downloadLinks = () => {
    if (!submitResult) return;
    const rows = ["Name,Email,Status,Session Link"];
    for (const r of submitResult.results) {
      rows.push(`${r.name},${r.email},${r.status},${r.invite_link || ""}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(submitResult.group_id || "group")}_links.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Determine if Confirm is enabled ─────────────────────────────────────
  const dryRunAllValid = dryRunResult && dryRunResult.dry_run && dryRunResult.failed === 0;

  return (
    <div className="group-sessions-page">
      <StarfieldBackground />

      <GlassNav>
        <button className="glass-nav-link" onClick={() => navigate("/hiring-manager")}>
          <span>← Sessions</span>
        </button>
        <button className="glass-nav-link glass-nav-link-active">
          <span>Group Sessions</span>
        </button>
        <button className="glass-nav-link" onClick={() => navigate("/results")}>
          <span>Results</span>
        </button>
      </GlassNav>

      <Toast message={notification?.message} type={notification?.type || "success"} onClose={() => setNotification(null)} />

      <div className="gs-container">
        <div className="gs-header">
          <h1>👥 Create Group Session</h1>
          <p className="gs-subtitle">Invite multiple candidates at once. Upload a CSV, validate, and send — all from here.</p>
        </div>

        {/* ─── Submitted Result View ─────────────────────────────────────── */}
        {submitResult ? (
          <div className="gs-result-panel">
            <div className="gs-result-header">
              <h2>🚀 Group Created</h2>
              <div className="gs-result-meta">
                <span className="gs-chip">Group ID: {submitResult.group_id}</span>
                <span className="gs-chip gs-chip-green">{submitResult.valid} created</span>
                {submitResult.failed > 0 && (
                  <span className="gs-chip gs-chip-red">{submitResult.failed} failed</span>
                )}
              </div>
              <button className="gs-download-btn" onClick={downloadLinks}>
                📥 Download Links CSV
              </button>
            </div>
            <div className="gs-table-wrapper">
              <table className="gs-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Session Link</th>
                  </tr>
                </thead>
                <tbody>
                  {submitResult.results.map((r, i) => (
                    <tr key={i} className={r.status === "created" ? "row-ok" : r.status === "email_failed" ? "row-warn" : "row-err"}>
                      <td>{r.name}</td>
                      <td>{r.email}</td>
                      <td>
                        <span className={`gs-status-badge gs-status-${r.status}`}>
                          {r.status === "created" ? "✅ Created" : r.status === "email_failed" ? "⚠️ Email Failed" : "❌ Failed"}
                        </span>
                      </td>
                      <td>
                        {r.invite_link ? (
                          <span
                            className="gs-link"
                            onClick={() => { navigator.clipboard.writeText(r.invite_link); showToast("Link copied!"); }}
                            title="Click to copy"
                          >
                            {r.invite_link.substring(0, 48)}…
                          </span>
                        ) : (
                          <span className="gs-muted">{r.error || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="gs-btn gs-btn-secondary" onClick={() => { setSubmitResult(null); setDryRunResult(null); setCsvRows([]); }}>
              + Create Another Group
            </button>
          </div>
        ) : (
          /* ─── Form View ─────────────────────────────────────────────────── */
          <div className="gs-form-layout">
            <div className="gs-card gs-fields-card">
              <h2>Session Details</h2>

              <div className="gs-field-group">
                <label htmlFor="group-name">Group Name <span className="gs-required">*</span></label>
                <input
                  id="group-name"
                  type="text"
                  placeholder="e.g. Spring 2026 Backend Batch"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="gs-input"
                />
              </div>

              <div className="gs-row-fields">
                <div className="gs-field-group">
                  <label htmlFor="gs-duration">Duration</label>
                  <select id="gs-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="gs-select">
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min (default)</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>

                <div className="gs-field-group">
                  <label htmlFor="gs-template">Project Template</label>
                  <select id="gs-template" value={template} onChange={(e) => setTemplate(e.target.value)} className="gs-select">
                    <option>Simple Calculator</option>
                    <option>Hotel Booking System ( beta )</option>
                  </select>
                </div>
              </div>

              <div className="gs-row-fields">
                <div className="gs-field-group">
                  <label htmlFor="gs-start-date">Window Opens (IST)</label>
                  <input
                    id="gs-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="gs-input"
                  />
                  <small>📅 Click to select date from calendar</small>
                </div>

                <div className="gs-field-group">
                  <label htmlFor="gs-start-time">Window Opens Time (IST)</label>
                  <input
                    id="gs-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="gs-input"
                  />
                  <small>⏰ HH:MM format (24-hour)</small>
                </div>
              </div>



              <div className="gs-row-fields">
                <div className="gs-field-group">
                  <label htmlFor="gs-end-date">Window Closes (IST)</label>
                  <input
                    id="gs-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="gs-input"
                  />
                  <small>📅 Click to select date from calendar</small>
                </div>

                <div className="gs-field-group">
                  <label htmlFor="gs-end-time">Window Closes Time (IST)</label>
                  <input
                    id="gs-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="gs-input"
                  />
                  <small>⏰ HH:MM format (24-hour)</small>
                </div>
              </div>
            </div>

            {/* ─── CSV Upload ─────────────────────────────────────────────── */}
            <div className="gs-card gs-csv-card">
              <h2>Candidate CSV</h2>
              <p className="gs-hint">Required columns: <code>Name</code>, <code>Gmail</code> — max 20 rows</p>

              <div
                className={`gs-drop-zone ${dragging ? "gs-drop-zone-active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {csvRows.length > 0 ? (
                  <div className="gs-drop-success">
                    <span className="gs-drop-icon">✅</span>
                    <span>{csvRows.length} candidate{csvRows.length !== 1 ? "s" : ""} loaded</span>
                    <span className="gs-drop-hint">Click to replace</span>
                  </div>
                ) : (
                  <div className="gs-drop-prompt">
                    <span className="gs-drop-icon">📂</span>
                    <span>Drag & drop your CSV here, or click to browse</span>
                  </div>
                )}
              </div>

              {csvError && <div className="gs-error-msg">{csvError}</div>}

              {/* CSV Preview table */}
              {csvRows.length > 0 && (
                <div className="gs-table-wrapper gs-preview">
                  <table className="gs-table">
                    <thead>
                      <tr><th>#</th><th>Name</th><th>Email (Gmail)</th></tr>
                    </thead>
                    <tbody>
                      {csvRows.map((r, i) => (
                        <tr key={i}><td>{i + 1}</td><td>{r.name}</td><td>{r.Gmail}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ─── Dry-run Result ──────────────────────────────────────────── */}
            {dryRunResult && (
              <div className="gs-card gs-validation-card">
                <div className="gs-validation-header">
                  <h2>Validation Results</h2>
                  <span className={`gs-vbadge ${dryRunResult.failed === 0 ? "gs-vbadge-ok" : "gs-vbadge-err"}`}>
                    {dryRunResult.failed === 0 ? `✅ All ${dryRunResult.valid} valid` : `❌ ${dryRunResult.failed} error(s)`}
                  </span>
                </div>
                <div className="gs-table-wrapper">
                  <table className="gs-table">
                    <thead>
                      <tr><th>#</th><th>Name</th><th>Email</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {dryRunResult.results.map((r, i) => (
                        <tr key={i} className={r.status === "valid" ? "row-ok" : "row-err"}>
                          <td>{i + 1}</td>
                          <td>{r.name}</td>
                          <td>{r.email}</td>
                          <td>
                            {r.status === "valid"
                              ? <span className="gs-ok">✅ Valid</span>
                              : <span className="gs-err">❌ {r.error}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Actions ─────────────────────────────────────────────────── */}
            <div className="gs-actions">
              <button
                className="gs-btn gs-btn-secondary"
                onClick={handleValidate}
                disabled={validating || csvRows.length === 0}
              >
                {validating ? "Validating…" : "✅ Validate"}
              </button>

              <button
                className={`gs-btn gs-btn-primary ${!dryRunAllValid ? "gs-btn-disabled" : ""}`}
                onClick={handleSubmit}
                disabled={!dryRunAllValid || submitting}
                title={!dryRunAllValid ? "Run validation first and fix errors" : "Create sessions and send emails"}
              >
                {submitting ? "Sending…" : "🚀 Confirm & Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupSessionsPage;
