// src/model/room.model.js
const db = require("../config/db");

// ── Helper: parse amenities JSON ──────────────────────
const parseAmenities = (r) => ({
  ...r,
  amenities: (() => {
    try {
      return JSON.parse(r.amenities || "[]");
    } catch {
      return [];
    }
  })(),
});

const Room = {
  getAll: (callback) => {
    const sql = `
      SELECT
        r.*,
        cb.username AS created_by_name,
        ub.username AS updated_by_name
      FROM rooms r
      LEFT JOIN users cb ON cb.id = r.created_by
      LEFT JOIN users ub ON ub.id = r.updated_by
      WHERE r.delete_at IS NULL
      ORDER BY r.number ASC
    `;
    db.query(sql, (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.map(parseAmenities));
    });
  },

  getAvailable: (callback) => {
    const sql = `
      SELECT
        r.*,
        cb.username AS created_by_name
      FROM rooms r
      LEFT JOIN users cb ON cb.id = r.created_by
      WHERE r.status = 'available'
        AND r.delete_at IS NULL
      ORDER BY r.type, r.number
    `;
    db.query(sql, (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.map(parseAmenities));
    });
  },

  // Date-aware availability: a room counts as available for a given
  // date range as long as it isn't under maintenance/deleted AND has
  // no OTHER booking (excluding cancelled/checked_out/no_show) whose
  // dates overlap the requested range. This is the same overlap rule
  // used in Booking.checkAvailability, applied across every room.
  getAvailableForDates: (checkIn, checkOut, excludeBookingId, callback) => {
    const sql = `
      SELECT
        r.*,
        cb.username AS created_by_name
      FROM rooms r
      LEFT JOIN users cb ON cb.id = r.created_by
      WHERE r.delete_at IS NULL
        AND r.status != 'maintenance'
        AND r.id NOT IN (
          SELECT b.room_id FROM bookings b
          WHERE b.room_id IS NOT NULL
            AND b.booking_status NOT IN ('cancelled','checked_out','no_show')
            AND b.id != ?
            AND (b.check_in_date < ? AND b.check_out_date > ?)
        )
      ORDER BY r.type, r.number
    `;
    db.query(sql, [excludeBookingId || 0, checkOut, checkIn], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.map(parseAmenities));
    });
  },

  // All booking date ranges per room, for showing "booked" periods
  // (e.g. highlighted in blue) on an All Rooms calendar/list view.
  getBookingRangesForRoom: (roomId, callback) => {
    const sql = `
      SELECT b.id, b.booking_code, b.check_in_date, b.check_out_date, b.booking_status,
             g.full_name AS guest_name
      FROM bookings b
      LEFT JOIN hotel_guests g ON g.id = b.hotel_guests_id
      WHERE b.room_id = ?
        AND b.booking_status NOT IN ('cancelled','checked_out','no_show')
      ORDER BY b.check_in_date ASC
    `;
    db.query(sql, [roomId], callback);
  },

  // Same as above but for ALL rooms in one query, so the All Rooms
  // page can show every room's booked date ranges without N calls.
  getAllBookingRanges: (callback) => {
    const sql = `
      SELECT b.room_id, b.id, b.booking_code, b.check_in_date, b.check_out_date,
             b.booking_status, g.full_name AS guest_name
      FROM bookings b
      LEFT JOIN hotel_guests g ON g.id = b.hotel_guests_id
      WHERE b.room_id IS NOT NULL
        AND b.booking_status NOT IN ('cancelled','checked_out','no_show')
      ORDER BY b.check_in_date ASC
    `;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT
        r.*,
        cb.username AS created_by_name,
        ub.username AS updated_by_name
      FROM rooms r
      LEFT JOIN users cb ON cb.id = r.created_by
      LEFT JOIN users ub ON ub.id = r.updated_by
      WHERE r.id = ?
    `;
    db.query(sql, [id], (err, rows) => {
      if (err) return callback(err);
      if (!rows[0]) return callback(null, null);
      callback(null, parseAmenities(rows[0]));
    });
  },

  getByNumber: (number, callback) => {
    db.query("SELECT * FROM rooms WHERE number = ?", [number], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] ? parseAmenities(rows[0]) : null);
    });
  },

  create: (data, callback) => {
    const d = {
      ...data,
      amenities: JSON.stringify(data.amenities || []),
      created_at: new Date(),
    };
    db.query("INSERT INTO rooms SET ?", d, callback);
  },

  update: (id, data, callback) => {
    const d = {
      ...data,
      amenities: data.amenities ? JSON.stringify(data.amenities) : undefined,
      updated_at: new Date(),
    };
    // remove undefined keys
    Object.keys(d).forEach((k) => d[k] === undefined && delete d[k]);
    db.query("UPDATE rooms SET ? WHERE id = ?", [d, id], callback);
  },

  updateStatus: (id, status, callback) => {
    db.query(
      "UPDATE rooms SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id],
      callback,
    );
  },

  delete: (id, deletedBy, callback) => {
    // soft delete — mark delete_at + delete_by
    db.query(
      "UPDATE rooms SET delete_at = NOW(), delete_by = ? WHERE id = ?",
      [deletedBy || null, id],
      callback,
    );
  },

  hardDelete: (id, callback) => {
    db.query("DELETE FROM rooms WHERE id = ?", [id], callback);
  },

  stats: (callback) => {
    db.query(
      `
      SELECT
        COUNT(*)                AS total,
        SUM(status='available') AS available,
        SUM(status='occupied')  AS occupied,
        SUM(status='maintenance') AS maintenance,
        SUM(status='reserved')  AS reserved
      FROM rooms
      WHERE delete_at IS NULL
    `,
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
      },
    );
  },
};

module.exports = Room;
