// ── GET /api/attendance ──────────────────────────────────────────
exports.getAll = (req, res) => {
  const filters = {
    staff_id: req.query.staff_id || null,
    date: req.query.date || null,
    type: req.query.type || null,
    from: req.query.from || null,
    to: req.query.to || null,
  };
  // Remove null filters
  Object.keys(filters).forEach((k) => {
    if (!filters[k]) delete filters[k];
  });

  const Attendance = require("../model/attendance.model");
  Attendance.getAll(filters, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const Attendance = require("../model/attendance.model");
const Staff = require("../model/staff.model");

// ── Helper: get shift config from request body ────────────────────
function getShiftCfg(req) {
  try {
    if (req.body?.shift_cfg) return req.body.shift_cfg;
  } catch (e) {}
  return null;
}

// ── Determine late/on_time from shift config ───────────────────────
function calcStatus(type, scanTime, shiftCfg, workShift, sessionType) {
  if (!shiftCfg) return "on_time";
  const scan = new Date(scanTime);
  const scanMin = scan.getHours() * 60 + scan.getMinutes();

  let expectedTimeStr = null;
  if (workShift === "full_time") {
    if (type === "check_in") {
      expectedTimeStr =
        sessionType === "afternoon"
          ? shiftCfg.ft_a_ci_from || "13:00"
          : shiftCfg.ft_m_ci_from || "07:00";
    } else {
      expectedTimeStr =
        sessionType === "afternoon"
          ? shiftCfg.ft_a_co_from || "17:00"
          : shiftCfg.ft_m_co_from || "11:00";
    }
  } else {
    if (type === "check_in")
      expectedTimeStr = shiftCfg[`${workShift}_ci_from`] || null;
    if (type === "check_out")
      expectedTimeStr = shiftCfg[`${workShift}_co_from`] || null;
  }

  if (!expectedTimeStr) return "on_time";
  const [eh, em] = expectedTimeStr.split(":").map(Number);
  const expectedMin = eh * 60 + em;
  const lateAfter = parseInt(shiftCfg.late_after) || 15;

  if (type === "check_in")
    return scanMin > expectedMin + lateAfter ? "late" : "on_time";
  if (type === "check_out")
    return scanMin < expectedMin - 15 ? "early_leave" : "on_time";
  return "on_time";
}

// ── POST /api/attendance/check-in ─────────────────────────────────
exports.checkIn = (req, res) => {
  const { staff_id, note } = req.body;
  if (!staff_id) return res.status(400).json({ message: "staff_id required" });

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  // Get staff work_shift
  Staff.getById(staff_id, (err, staff) => {
    if (err || !staff)
      return res.status(404).json({ message: "Staff not found" });

    const workShift = staff.work_shift || "morning";
    const isFullTime = workShift === "full_time";

    // Get existing check-ins today
    Attendance.getAll(
      { staff_id, date: dateStr, type: "check_in" },
      (err2, existing) => {
        if (err2) return res.status(500).json({ message: err2.message });

        if (!isFullTime) {
          // Non full-time: only 1 check-in allowed
          if (existing.length > 0) {
            return res
              .status(400)
              .json({ message: "Already checked in today" });
          }
        } else {
          // Full-time: allow max 2 check-ins (morning + afternoon)
          if (existing.length >= 2) {
            return res
              .status(400)
              .json({ message: "Already checked in twice today (Full Time)" });
          }
        }

        // Determine session for full-time (1st = morning, 2nd = afternoon)
        const sessionType =
          isFullTime && existing.length === 1 ? "afternoon" : "morning";

        // Calculate status
        const shiftCfg = getShiftCfg(req);
        const status = calcStatus(
          "check_in",
          now,
          shiftCfg,
          workShift,
          sessionType,
        );

        Attendance.create(
          {
            staff_id,
            date: dateStr,
            scan_time: now,
            type: "check_in",
            status,
            note: note || null,
            created_by: req.user?.id || null,
          },
          (err3, result) => {
            if (err3) return res.status(500).json({ message: err3.message });
            res.status(201).json({
              message: `Check-in ${status === "late" ? "(Late)" : "successful"}`,
              status,
              session: sessionType,
              id: result.insertId,
              scan_time: now,
            });
          },
        );
      },
    );
  });
};

// ── POST /api/attendance/check-out ────────────────────────────────
exports.checkOut = (req, res) => {
  const { staff_id, note } = req.body;
  if (!staff_id) return res.status(400).json({ message: "staff_id required" });

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  Staff.getById(staff_id, (err, staff) => {
    if (err || !staff)
      return res.status(404).json({ message: "Staff not found" });

    const workShift = staff.work_shift || "morning";
    const isFullTime = workShift === "full_time";

    // Get check-ins and check-outs today
    Attendance.getAll({ staff_id, date: dateStr }, (err2, allToday) => {
      if (err2) return res.status(500).json({ message: err2.message });

      const checkIns = allToday.filter((a) => a.type === "check_in");
      const checkOuts = allToday.filter((a) => a.type === "check_out");

      if (!isFullTime) {
        // Must have checked in first
        if (checkIns.length === 0)
          return res.status(400).json({ message: "Please check in first" });
        if (checkOuts.length >= 1)
          return res.status(400).json({ message: "Already checked out today" });
      } else {
        // Full-time: allow max 2 check-outs
        if (checkOuts.length >= 2)
          return res
            .status(400)
            .json({ message: "Already checked out twice today (Full Time)" });
        // Must have corresponding check-in
        if (checkIns.length <= checkOuts.length) {
          return res.status(400).json({ message: "Please check in first" });
        }
      }

      // Session = 1st checkout = morning, 2nd = afternoon
      const sessionType =
        isFullTime && checkOuts.length === 1 ? "afternoon" : "morning";

      const shiftCfg = getShiftCfg(req);
      const status = calcStatus(
        "check_out",
        now,
        shiftCfg,
        workShift,
        sessionType,
      );

      Attendance.create(
        {
          staff_id,
          date: dateStr,
          scan_time: now,
          type: "check_out",
          status,
          note: note || null,
          created_by: req.user?.id || null,
        },
        (err3, result) => {
          if (err3) return res.status(500).json({ message: err3.message });
          res.status(201).json({
            message: `Check-out ${status === "early_leave" ? "(Early Leave)" : "successful"}`,
            status,
            session: sessionType,
            id: result.insertId,
            scan_time: now,
          });
        },
      );
    });
  });
};

// ── POST /api/attendance/manual ───────────────────────────────────
exports.manualRecord = (req, res) => {
  const { staff_id, date, scan_time, type, status, note } = req.body;
  if (!staff_id || !date || !scan_time || !type) {
    return res
      .status(400)
      .json({ message: "staff_id, date, scan_time, type required" });
  }
  Attendance.create(
    {
      staff_id,
      date,
      scan_time: new Date(`${date}T${scan_time}`),
      type,
      status: status || "on_time",
      note: note || null,
      created_by: req.user?.id || null,
    },
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({
        message: "Record created",
        id: result.insertId,
        status: status || "on_time",
      });
    },
  );
};

// ── GET /api/attendance/today ─────────────────────────────────────
exports.getToday = (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  Attendance.getAll({ date: today }, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// ── GET /api/attendance/today-summary ────────────────────────────
exports.getTodaySummary = (req, res) => {
  Attendance.getTodaySummary((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// ── GET /api/attendance/shifts ────────────────────────────────────
exports.getShifts = (req, res) => {
  Attendance.getShifts((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// ── GET /api/attendance/monthly-report ───────────────────────────
exports.monthlyReport = (req, res) => {
  const { month, year } = req.query;
  Attendance.monthlyReport(month, year, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// ── PUT /api/attendance/:id ───────────────────────────────────────
exports.update = (req, res) => {
  Attendance.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Updated" });
  });
};

// ── DELETE /api/attendance/:id ────────────────────────────────────
exports.remove = (req, res) => {
  Attendance.delete(req.params.id, req.user?.id, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Deleted" });
  });
};

// ── POST /api/attendance/shifts/update ───────────────────────────
exports.updateShifts = (req, res) => {
  // Save to work_shifts table if needed
  res.json({ message: "Shift config saved" });
};
