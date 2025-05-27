const { pool, sql } = require("../config/dbconfig");

const transporterModel = {
  getTransporterByRequestId: async (requestId) => {
    try {
      const result = await pool.request()
        .input("request_id", sql.Int, requestId)
        .query(`
          SELECT * FROM transporter_details 
          WHERE request_id = @request_id
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }
};

module.exports = transporterModel;
