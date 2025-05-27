const { pool, sql } = require("../config/dbconfig");
const transporterModel = require("../models/transporterModel");

class TransporterController {
  // Create transporter details
  static async createTransporterDetails(req, res) {
    try {
      // In the createTransporterDetails method, add the new field to the destructured request body
      const {
        transport_request_id,
        transporter_name,
        vehicle_number,
        vehicle_make,
        model_year,
        driver_name,
        driver_contact,
        license_number,
        license_expiry,
        base_charge,
        additional_charges,
        container_no,
        line,
        seal_no,
        number_of_containers, // New field
      } = req.body;

      // Validate required fields
      if (
        !transport_request_id ||
        !transporter_name ||
        !vehicle_number ||
        !driver_name ||
        !driver_contact ||
        !license_number ||
        !license_expiry ||
        !base_charge
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Check if transport request exists and belongs to user (if customer) or exists (if admin)
      const requestCheck = await pool
        .request()
        .input("requestId", sql.Int, transport_request_id).query(`
          SELECT id, status FROM transport_requests 
          WHERE id = @requestId
        `);

      if (requestCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Transport request not found",
        });
      }

      // Check if transporter details already exist for this request
      const existingCheck = await pool
        .request()
        .input("requestId", sql.Int, transport_request_id).query(`
          SELECT id FROM transporter_details 
          WHERE request_id = @requestId
        `);
      
      // Calculate total charge
      const total_charge = parseFloat(base_charge) + parseFloat(additional_charges || 0);
      
      // Add the new field to the SQL query parameters
      const result = await pool
        .request()
        .input("request_id", sql.Int, transport_request_id)
        .input("transporter_name", sql.NVarChar(255), transporter_name)
        .input("vehicle_number", sql.NVarChar(50), vehicle_number)
        .input("vehicle_make", sql.NVarChar(100), vehicle_make || null)
        .input("model_year", sql.Int, model_year || null)
        .input("driver_name", sql.NVarChar(255), driver_name)
        .input("driver_contact", sql.NVarChar(20), driver_contact)
        .input("license_number", sql.NVarChar(50), license_number)
        .input("license_expiry", sql.Date, new Date(license_expiry))
        .input("base_charge", sql.Decimal(12, 2), base_charge)
        .input("additional_charges", sql.Decimal(12, 2), additional_charges || 0)
        .input("total_charge", sql.Decimal(12, 2), total_charge)
        .input("container_no", sql.NVarChar(100), container_no || null)  // New field
        .input("line", sql.NVarChar(100), line || null)                // New field
        .input("seal_no", sql.NVarChar(100), seal_no || null)          // New field
        .input("number_of_containers", sql.Int, number_of_containers || null) // New field
        .query(`
          INSERT INTO transporter_details (
            request_id, transporter_name, vehicle_number, vehicle_make,
            model_year, driver_name, driver_contact, license_number, 
            license_expiry, base_charge, additional_charges, total_charge,
            container_no, line, seal_no, number_of_containers  /* Added new field */
          )
          OUTPUT INSERTED.*
          VALUES (
            @request_id, @transporter_name, @vehicle_number, @vehicle_make,
            @model_year, @driver_name, @driver_contact, @license_number,
            @license_expiry, @base_charge, @additional_charges, @total_charge,
            @container_no, @line, @seal_no, @number_of_containers  /* Added new field */
          )
        `);

      return res.status(201).json({
        success: true,
        message: "Transporter details saved successfully",
        data: result.recordset[0],
      });
    } catch (error) {
      console.error("Create transporter details error:", error);
      return res.status(500).json({
        success: false,
        message: "Error saving transporter details",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Update transporter details
  static async updateTransporterDetails(req, res) {
    try {
      const { id } = req.params;
      // In the updateTransporterDetails method, add the new field to the destructured request body
      const {
        transporter_name,
        vehicle_number,
        vehicle_make,
        model_year,
        driver_name,
        driver_contact,
        license_number,
        license_expiry,
        base_charge,
        additional_charges,
        container_no,
        line,
        seal_no,
        number_of_containers, // New field
      } = req.body;

      // Calculate total charge
      const total_charge = parseFloat(base_charge) + parseFloat(additional_charges || 0);

      // Add the new field to the SQL query parameters
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("transporter_name", sql.NVarChar(255), transporter_name)
        .input("vehicle_number", sql.NVarChar(50), vehicle_number)
        .input("vehicle_make", sql.NVarChar(100), vehicle_make || null)
        .input("model_year", sql.Int, model_year || null)
        .input("driver_name", sql.NVarChar(255), driver_name)
        .input("driver_contact", sql.NVarChar(20), driver_contact)
        .input("license_number", sql.NVarChar(50), license_number)
        .input("license_expiry", sql.Date, new Date(license_expiry))
        .input("base_charge", sql.Decimal(12, 2), base_charge)
        .input("additional_charges", sql.Decimal(12, 2), additional_charges || 0)
        .input("total_charge", sql.Decimal(12, 2), total_charge)
        .input("container_no", sql.NVarChar(100), container_no || null)  // New field
        .input("line", sql.NVarChar(100), line || null)                // New field
        .input("seal_no", sql.NVarChar(100), seal_no || null)          // New field
        .input("number_of_containers", sql.Int, number_of_containers || null) // New field
        .query(`
          UPDATE transporter_details 
          SET 
            transporter_name = @transporter_name,
            vehicle_number = @vehicle_number,
            vehicle_make = @vehicle_make,
            model_year = @model_year,
            driver_name = @driver_name,
            driver_contact = @driver_contact,
            license_number = @license_number,
            license_expiry = @license_expiry,
            base_charge = @base_charge,
            additional_charges = @additional_charges,
            total_charge = @total_charge,
            container_no = @container_no,
            line = @line,
            seal_no = @seal_no,
            number_of_containers = @number_of_containers, /* New field */
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Transporter details not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transporter details updated successfully",
        data: result.recordset[0],
      });
    } catch (error) {
      console.error("Update transporter details error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating transporter details",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get transporter details by transport request ID
  static async getTransporterDetailsByRequestId(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      const transporterDetails =
        await transporterModel.getTransporterByRequestId(requestId);

      if (!transporterDetails) {
        return res.status(404).json({
          success: false,
          message: "Transporter details not found for this request",
        });
      }

      res.json({
        success: true,
        data: transporterDetails,
      });
    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching transporter details",
        error: error.message,
      });
    }
  }

  // Get all transporter details (admin only)
  static async getAllTransporterDetails(req, res) {
    try {
      const result = await pool.request().query(`
          SELECT 
            td.*,
            tr.status as request_status,
            tr.consignee,
            tr.consigner,
            u.name as customer_name,
            u.email as customer_email
          FROM transporter_details td
          INNER JOIN transport_requests tr ON td.transport_request_id = tr.id
          INNER JOIN users u ON tr.customer_id = u.id
          ORDER BY td.created_at DESC
        `);

      // Format dates for frontend
      const transporterDetailsList = result.recordset.map((record) => ({
        ...record,
        license_expiry: record.license_expiry
          ? new Date(record.license_expiry).toISOString().split("T")[0]
          : null,
      }));

      return res.status(200).json({
        success: true,
        data: transporterDetailsList,
      });
    } catch (error) {
      console.error("Get all transporter details error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching transporter details",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Delete transporter details
  static async deleteTransporterDetails(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.request().input("id", sql.Int, id).query(`
          DELETE FROM transporter_details 
          OUTPUT DELETED.*
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Transporter details not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transporter details deleted successfully",
      });
    } catch (error) {
      console.error("Delete transporter details error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting transporter details",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Add this new method to the TransporterController class
  static async updateContainerDetails(req, res) {
    try {
      const { id } = req.params;
      const {
        container_no,
        line,
        seal_no,
        number_of_containers
      } = req.body;

      // Update only container details
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("container_no", sql.NVarChar(100), container_no || null)
        .input("line", sql.NVarChar(100), line || null)
        .input("seal_no", sql.NVarChar(100), seal_no || null)
        .input("number_of_containers", sql.Int, number_of_containers || null)
        .query(`
          UPDATE transporter_details 
          SET 
            container_no = @container_no,
            line = @line,
            seal_no = @seal_no,
            number_of_containers = @number_of_containers,
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Transporter details not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Container details updated successfully",
        data: result.recordset[0],
      });
    } catch (error) {
      console.error("Update container details error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating container details",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = TransporterController;
