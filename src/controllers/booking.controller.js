// src/controllers/booking.controller.js
const Booking = require("../model/booking.model");
const Room = require("../model/room.model");

exports.getAll = (req, res) => {
  Booking.getAll((err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

exports.getById = (req, res) => {
  const id = req.params.id;
  Booking.getById(id, (err, booking) => {
    if (err) return res.status(500).json(err);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    Booking.getServices(id, (err2, services) => {
      if (err2) return res.status(500).json(err2);
      res.json({ ...booking, services: services || [] });
    });
  });
};

exports.stats = (req, res) => {
  Booking.stats((err, stats) => {
    if (err) return res.status(500).json(err);
    res.json(stats);
  });
};

exports.getByMonth = (req, res) => {
  const { year, month } = req.query;
  Booking.getByMonth(
    year || new Date().getFullYear(),
    month || new Date().getMonth() + 1,
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    },
  );
};

exports.todayArrivals = (req, res) => {
  Booking.todayArrivals((err, r) =>
    err ? res.status(500).json(err) : res.json(r),
  );
};
exports.todayDepartures = (req, res) => {
  Booking.todayDepartures((err, r) =>
    err ? res.status(500).json(err) : res.json(r),
  );
};

exports.create = async (req, res) => {
  const {
    guest_id,
    room_id,
    check_in_date,
    check_out_date,
    check_in_time,
    check_out_time,
    adults,
    children,
    room_number,
    room_type,
    room_price,
    total_amount,
    deposit_amount,
    discount_amount,
    final_amount,
    paid_amount,
    balance_due,
    booking_status,
    payment_status,
    payment_method,
    source,
    special_request,
    note,
    services,
  } = req.body;

  if (!check_in_date)
    return res.status(400).json({ message: "check_in_date required" });
  if (!check_out_date)
    return res.status(400).json({ message: "check_out_date required" });
  if (check_in_date >= check_out_date)
    return res
      .status(400)
      .json({ message: "check_out must be after check_in" });

  // Check availability
  if (room_id) {
    Booking.checkAvailability(
      room_id,
      check_in_date,
      check_out_date,
      null,
      (err, available) => {
        if (err) return res.status(500).json(err);
        if (!available)
          return res
            .status(400)
            .json({ message: "Room not available for selected dates" });
        doCreate();
      },
    );
  } else {
    doCreate();
  }

  function doCreate() {
    // Compute nights from the dates, since the `bookings` table has
    // a `nights` column that isn't sent by the frontend.
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(check_out_date) - new Date(check_in_date)) / 86400000,
      ),
    );

    const data = {
      // NOTE: the actual column in `bookings` is `hotel_guests_id`,
      // not `guest_id` — the frontend still sends `guest_id` in the
      // request body, we just map it to the real column name here.
      hotel_guests_id: guest_id || null,
      room_id: room_id || null,
      check_in_date,
      check_out_date,
      check_in_time: check_in_time || "14:00:00",
      check_out_time: check_out_time || "12:00:00",
      nights,
      adults: adults || 1,
      children: children || 0,
      room_number: room_number || null,
      room_type: room_type || null,
      room_price: room_price || 0,
      total_amount: total_amount || 0,
      deposit_amount: deposit_amount || 0,
      discount_amount: discount_amount || 0,
      final_amount: final_amount || total_amount || 0,
      paid_amount: paid_amount || 0,
      balance_due: balance_due || 0,
      booking_status: booking_status || "pending",
      payment_status: payment_status || "unpaid",
      payment_method: payment_method || "cash",
      source: source || "walk_in",
      special_request: special_request || null,
      note: note || null,
      created_by: req.user?.id || null,
    };

    Booking.create(data, services || [], (err, result) => {
      if (err) return res.status(500).json(err);

      // Update room status to reserved/occupied
      if (room_id && data.booking_status === "checked_in") {
        Room.updateStatus(room_id, "occupied", () => {});
      } else if (
        room_id &&
        ["confirmed", "pending"].includes(data.booking_status)
      ) {
        Room.updateStatus(room_id, "reserved", () => {});
      }

      res.status(201).json({
        message: "Booking created",
        booking_id: result.insertId,
        booking_code: result.booking_code,
      });
    });
  }
};

exports.update = (req, res) => {
  Booking.getById(req.params.id, (err, booking) => {
    if (err) return res.status(500).json(err);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const fields = [
      "room_id",
      "check_in_date",
      "check_out_date",
      "adults",
      "children",
      "room_number",
      "room_type",
      "room_price",
      "total_amount",
      "deposit_amount",
      "discount_amount",
      "final_amount",
      "paid_amount",
      "balance_due",
      "booking_status",
      "payment_status",
      "payment_method",
      "source",
      "special_request",
      "note",
    ];

    const data = { updated_at: new Date(), updated_by: req.user?.id || null };

    // Same mapping as create(): incoming `guest_id` -> real column `hotel_guests_id`
    if (req.body.guest_id !== undefined)
      data.hotel_guests_id = req.body.guest_id;

    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    Booking.update(req.params.id, data, (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Booking updated" });
    });
  });
};

exports.updateStatus = (req, res) => {
  const { status, cancelled_reason, paid_amount } = req.body;
  const valid = [
    "pending",
    "confirmed",
    "checked_in",
    "checked_out",
    "cancelled",
    "no_show",
  ];
  if (!valid.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const extra = { updated_at: new Date(), updated_by: req.user?.id || null };
  if (cancelled_reason) {
    extra.cancelled_reason = cancelled_reason;
    extra.cancelled_at = new Date();
  }
  if (paid_amount !== undefined) extra.paid_amount = paid_amount;

  Booking.updateStatus(req.params.id, status, extra, (err) => {
    if (err) return res.status(500).json(err);

    // Update room status based on booking status
    Booking.getById(req.params.id, (err2, b) => {
      if (!err2 && b?.room_id) {
        if (status === "checked_in")
          Room.updateStatus(b.room_id, "occupied", () => {});
        if (status === "checked_out")
          Room.updateStatus(b.room_id, "available", () => {});
        if (status === "cancelled")
          Room.updateStatus(b.room_id, "available", () => {});
      }
    });

    res.json({ message: `Booking ${status}` });
  });
};

exports.remove = (req, res) => {
  Booking.delete(req.params.id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Booking deleted" });
  });
};
