const pool = require("../config/db");

// CREATE PROCEDURE
exports.createProcedure = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      procedureName,
      status,
      frequency,
      notes,
      datePerformed,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO procedures
      (user_id, procedure_name, status, frequency, notes, date_performed)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        userId,
        procedureName,
        status,
        frequency,
        notes,
        datePerformed,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Procedure logged successfully",
      procedure: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// GET ALL PROCEDURES
exports.getProcedures = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, procedureName } = req.query;

    let query = `
      SELECT * FROM procedures
      WHERE user_id = $1
    `;

    let values = [userId];
    let index = 2;

    if (status) {
      // Make status filtering case/whitespace-insensitive to match frontend options
      query += ` AND LOWER(TRIM(status)) = LOWER(TRIM($${index}))`;
      values.push(status);
      index++;
    }


    if (procedureName) {
      query += ` AND procedure_name ILIKE $${index}`;
      values.push(`%${procedureName}%`);
      index++;
    }

    query += ` ORDER BY date_performed DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      procedures: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// UPDATE PROCEDURE
exports.updateProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const {
      procedureName,
      status,
      frequency,
      notes,
      datePerformed,
    } = req.body;

    const result = await pool.query(
      `UPDATE procedures
       SET procedure_name=$1,
           status=$2,
           frequency=$3,
           notes=$4,
           date_performed=$5
       WHERE id=$6 AND user_id=$7
       RETURNING *`,
      [
        procedureName,
        status,
        frequency,
        notes,
        datePerformed,
        id,
        userId,
      ]
    );

    res.json({
      success: true,
      message: "Procedure updated",
      procedure: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// DELETE PROCEDURE
exports.deleteProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `DELETE FROM procedures WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );

    res.json({
      success: true,
      message: "Procedure deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};