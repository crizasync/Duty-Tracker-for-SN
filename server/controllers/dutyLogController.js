const pool = require("../config/db");
const { normalizeLocation, dutyHours, invalid } = require("../utils/dutyLocation");

// CREATE DUTY LOG
exports.createDutyLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      dutyDate,
      hospital,
      ward,
      shift,
      timeIn,
      timeOut,
      remarks,
    } = req.body;

    const totalHours = dutyHours(timeIn, timeOut);
    const location = normalizeLocation(req.body.facilityLocation);
    const clientEntryId = req.body.clientEntryId || null;
    if (clientEntryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientEntryId)) throw invalid("Invalid duty entry identifier.");
    if (!hospital?.trim() || !dutyDate || !ward?.trim() || !shift) throw invalid("Complete the duty date, hospital, ward, and shift.");

    const result = await pool.query(
      `INSERT INTO duty_logs
      (user_id, duty_date, hospital, ward, shift, time_in, time_out, total_hours, remarks,
       facility_latitude, facility_longitude, facility_address, facility_place_id, client_entry_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (user_id, client_entry_id) DO UPDATE SET client_entry_id = EXCLUDED.client_entry_id
      RETURNING *`,
      [
        userId,
        dutyDate,
        hospital,
        ward,
        shift,
        timeIn,
        timeOut,
        totalHours,
        remarks,
        ...location,
        clientEntryId,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Duty log created",
      dutyLog: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ success: false, message: error.status === 400 ? error.message : "Server error" });
  }
};

// GET ALL DUTY LOGS
exports.getDutyLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const { startDate, endDate, hospital, ward, shift } = req.query;

    let query = `
      SELECT * FROM duty_logs
      WHERE user_id = $1
    `;

    let values = [userId];
    let index = 2;

    // DATE FILTER
    if (startDate && endDate) {
      query += ` AND duty_date BETWEEN $${index} AND $${index + 1}`;
      values.push(startDate, endDate);
      index += 2;
    }

    // HOSPITAL FILTER
    if (hospital) {
      query += ` AND hospital ILIKE $${index}`;
      values.push(`%${hospital}%`);
      index++;
    }

    // WARD FILTER
    if (ward) {
      query += ` AND ward ILIKE $${index}`;
      values.push(`%${ward}%`);
      index++;
    }

    // SHIFT FILTER
    if (shift) {
      query += ` AND shift = $${index}`;
      values.push(shift);
      index++;
    }

    query += ` ORDER BY duty_date DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      dutyLogs: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ success: false, message: error.status === 400 ? error.message : "Server error" });
  }
};

// UPDATE DUTY LOG
exports.updateDutyLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const {
      dutyDate,
      hospital,
      ward,
      shift,
      timeIn,
      timeOut,
      remarks,
    } = req.body;

    const totalHours = dutyHours(timeIn, timeOut);
    const location = normalizeLocation(req.body.facilityLocation);
    const locationProvided = req.body.facilityLocation !== undefined;

    const result = await pool.query(
      `UPDATE duty_logs
       SET duty_date=$1,
           hospital=$2::text,
           ward=$3,
           shift=$4,
           time_in=$5,
           time_out=$6,
           total_hours=$7,
           remarks=$8,
           facility_latitude=CASE WHEN $13 THEN $9 WHEN hospital::text IS DISTINCT FROM $2::text THEN NULL ELSE facility_latitude END,
           facility_longitude=CASE WHEN $13 THEN $10 WHEN hospital::text IS DISTINCT FROM $2::text THEN NULL ELSE facility_longitude END,
           facility_address=CASE WHEN $13 THEN $11 WHEN hospital::text IS DISTINCT FROM $2::text THEN NULL ELSE facility_address END,
           facility_place_id=CASE WHEN $13 THEN $12 WHEN hospital::text IS DISTINCT FROM $2::text THEN NULL ELSE facility_place_id END
       WHERE id=$14 AND user_id=$15
       RETURNING *`,
      [
        dutyDate,
        hospital,
        ward,
        shift,
        timeIn,
        timeOut,
        totalHours,
        remarks,
        ...location,
        locationProvided,
        id,
        userId,
      ]
    );

    if (!result.rows.length) return res.status(404).json({ success: false, message: "Duty log not found" });

    res.json({
      success: true,
      message: "Duty log updated",
      dutyLog: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ success: false, message: error.status === 400 ? error.message : "Server error" });
  }
};

// DELETE DUTY LOG
exports.deleteDutyLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `DELETE FROM duty_logs WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );

    res.json({
      success: true,
      message: "Duty log deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ success: false, message: error.status === 400 ? error.message : "Server error" });
  }
};
