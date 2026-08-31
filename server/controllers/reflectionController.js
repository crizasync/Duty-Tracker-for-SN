const pool = require("../config/db");

// CREATE REFLECTION
exports.createReflection = async (req, res) => {
  try {
    const userId = req.user.id;

    const { title, content, dutyDate } = req.body;

    const result = await pool.query(
      `INSERT INTO reflections
      (user_id, title, content, duty_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [userId, title, content, dutyDate]
    );

    res.status(201).json({
      success: true,
      message: "Reflection created",
      reflection: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// GET ALL REFLECTIONS
exports.getReflections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, keyword } = req.query;

    let query = `
      SELECT * FROM reflections
      WHERE user_id = $1
    `;

    let values = [userId];
    let index = 2;

    if (startDate && endDate) {
      query += ` AND duty_date BETWEEN $${index} AND $${index + 1}`;
      values.push(startDate, endDate);
      index += 2;
    }

    if (keyword) {
      query += ` AND (title ILIKE $${index} OR content ILIKE $${index})`;
      values.push(`%${keyword}%`);
      index++;
    }

    query += ` ORDER BY duty_date DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      reflections: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// UPDATE REFLECTION
exports.updateReflection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { title, content, dutyDate } = req.body;

    const result = await pool.query(
      `UPDATE reflections
       SET title=$1,
           content=$2,
           duty_date=$3
       WHERE id=$4 AND user_id=$5
       RETURNING *`,
      [title, content, dutyDate, id, userId]
    );

    res.json({
      success: true,
      message: "Reflection updated",
      reflection: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// DELETE REFLECTION
exports.deleteReflection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `DELETE FROM reflections WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );

    res.json({
      success: true,
      message: "Reflection deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};