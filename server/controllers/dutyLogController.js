const pool = require("../config/db");

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

    // Compute hours
    const start = new Date(`1970-01-01T${timeIn}Z`);
    const end = new Date(`1970-01-01T${timeOut}Z`);

    let diff = (end - start) / (1000 * 60 * 60);

    if (diff < 0) diff += 24; // handles overnight shifts

    const totalHours = parseFloat(diff.toFixed(2));

    const result = await pool.query(
      `INSERT INTO duty_logs
      (user_id, duty_date, hospital, ward, shift, time_in, time_out, total_hours, remarks)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
      ]
    );

    res.status(201).json({
      success: true,
      message: "Duty log created",
      dutyLog: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
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
    res.status(500).json({ success: false });
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

    const start = new Date(`1970-01-01T${timeIn}Z`);
    const end = new Date(`1970-01-01T${timeOut}Z`);

    let diff = (end - start) / (1000 * 60 * 60);
    if (diff < 0) diff += 24;

    const totalHours = parseFloat(diff.toFixed(2));

    const result = await pool.query(
      `UPDATE duty_logs
       SET duty_date=$1,
           hospital=$2,
           ward=$3,
           shift=$4,
           time_in=$5,
           time_out=$6,
           total_hours=$7,
           remarks=$8
       WHERE id=$9 AND user_id=$10
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
        id,
        userId,
      ]
    );

    res.json({
      success: true,
      message: "Duty log updated",
      dutyLog: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
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
    res.status(500).json({ success: false });
  }
};