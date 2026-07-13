// src/model/booking.model.js
const db = require("../config/db");

const Booking = {
  getAll: (callback) => {
    const sql = `
      SELECT
        b.*,
        g.full_name      AS guest_name,
        g.phone_number   AS guest_phone,
        g.nationality    AS guest_nationality,
        g.email          AS guest_email,
        cb.username      AS created_by_name
      FROM bookings b
      LEFT JOIN hotel_guests g ON g.id = b.hotel_guests_id
      LEFT JOIN users  cb ON cb.id = b.created_by
      ORDER BY b.id DESC
    `;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT b.*,
        g.full_name AS guest_name, g.phone_number AS guest_phone,
        g.email AS guest_email, g.nationality AS guest_nationality,
        g.number_passport AS guest_passport
      FROM bookings b
      LEFT JOIN hotel_guests g ON g.id = b.hotel_guests_id
      WHERE b.id = ?
    `;
    db.query(sql, [id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0]);
    });
  },

  getServices: (bookingId, callback) => {
    db.query(
      "SELECT * FROM booking_services WHERE booking_id=?",
      [bookingId],
      callback,
    );
  },

  // Check room availability
  checkAvailability: (roomId, checkIn, checkOut, excludeId, callback) => {
    const sql = `
      SELECT id FROM bookings
      WHERE room_id = ?
        AND booking_status NOT IN ('cancelled','checked_out','no_show')
        AND id != ?
        AND (
          (check_in_date  < ? AND check_out_date > ?)
        )
    `;
    db.query(sql, [roomId, excludeId || 0, checkOut, checkIn], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.length === 0); // true = available
    });
  },

  // Stats
  stats: (callback) => {
    const sql = `
      SELECT
        COUNT(*)                                AS total,
        SUM(booking_status='pending')           AS pending,
        SUM(booking_status='confirmed')         AS confirmed,
        SUM(booking_status='checked_in')        AS checked_in,
        SUM(booking_status='checked_out')       AS checked_out,
        SUM(booking_status='cancelled')         AS cancelled,
        SUM(payment_status='paid')              AS paid,
        SUM(payment_status='unpaid')            AS unpaid,
        COALESCE(SUM(final_amount),0)           AS total_revenue,
        COALESCE(SUM(balance_due),0)            AS total_balance
      FROM bookings
    `;
    db.query(sql, (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0]);
    });
  },

  create: (data, services, callback) => {
    // Insert first with a temporary unique placeholder for booking_code —
    // the REAL code is derived from the row's own auto-increment `id`
    // right after, which (unlike a pre-insert row COUNT) is guaranteed
    // unique and never reused even after other bookings get deleted.
    const insertData = {
      ...data,
      booking_code: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };

    db.query("INSERT INTO bookings SET ?", insertData, (err, result) => {
      if (err) return callback(err);
      const bookingId = result.insertId;
      const year = new Date().getFullYear();
      const bookingCode = `BK-${year}-${String(bookingId).padStart(4, "0")}`;

      db.query(
        "UPDATE bookings SET booking_code = ? WHERE id = ?",
        [bookingCode, bookingId],
        (err2) => {
          if (err2) return callback(err2);

          // Insert services if any
          if (services && services.length > 0) {
            const vals = services.map((s) => [
              bookingId,
              s.service_name,
              s.price,
              s.quantity,
              s.note || null,
            ]);
            db.query(
              "INSERT INTO booking_services (booking_id,service_name,price,quantity,note) VALUES ?",
              [vals],
              (err3) => {
                if (err3) console.error("Service insert error:", err3);
              },
            );
          }

          callback(null, { insertId: bookingId, booking_code: bookingCode });
        },
      );
    });
  },

  update: (id, data, callback) => {
    db.query("UPDATE bookings SET ? WHERE id=?", [data, id], callback);
  },

  updateStatus: (id, status, extra, callback) => {
    const data = { booking_status: status, updated_at: new Date(), ...extra };
    db.query("UPDATE bookings SET ? WHERE id=?", [data, id], callback);
  },

  delete: (id, callback) => {
    db.query("DELETE FROM bookings WHERE id=?", [id], callback);
  },

  // Get bookings for calendar (by month)
  getByMonth: (year, month, callback) => {
    const sql = `
      SELECT b.*, g.full_name AS guest_name
      FROM bookings b
      LEFT JOIN hotel_guests g ON g.id = b.hotel_guests_id
      WHERE YEAR(b.check_in_date) = ? AND MONTH(b.check_in_date) = ?
        AND b.booking_status NOT IN ('cancelled','no_show')
      ORDER BY b.check_in_date
    `;
    db.query(sql, [year, month], callback);
  },

  // Today's arrivals
  todayArrivals: (callback) => {
    db.query(
      `
      SELECT b.*, g.full_name AS guest_name, g.phone_number AS guest_phone
      FROM bookings b LEFT JOIN hotel_guests g ON g.id=b.hotel_guests_id
      WHERE b.check_in_date = CURDATE()
        AND b.booking_status IN ('confirmed','pending')
    `,
      callback,
    );
  },

  // Today's departures
  todayDepartures: (callback) => {
    db.query(
      `
      SELECT b.*, g.full_name AS guest_name, g.phone_number AS guest_phone
      FROM bookings b LEFT JOIN hotel_guests g ON g.id=b.hotel_guests_id
      WHERE b.check_out_date = CURDATE()
        AND b.booking_status = 'checked_in'
    `,
      callback,
    );
  },
};

module.exports = Booking;
