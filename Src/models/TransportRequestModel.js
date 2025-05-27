const { pool, sql } = require("../config/dbconfig");

class TransportRequest {
  static async create(requestData) {
    try {
      const {
        consignee,
        consigner,
        vehicle_type,
        vehicle_size,
        pickup_location,
        stuffing_location,
        delivery_location,
        commodity,
        cargo_type,
        cargo_weight,
        service_type,
        service_prices,
        containers_20ft,
        containers_40ft,
        total_containers,
        expected_pickup_date,
        expected_delivery_date,
        requested_price,
        status,
        customerId,
      } = requestData;

      const result = await pool
        .request()
        .input("customerId", sql.Int, customerId)
        .input("consignee", sql.NVarChar, consignee)
        .input("consigner", sql.NVarChar, consigner)
        .input("vehicle_type", sql.NVarChar, vehicle_type)
        .input("vehicle_size", sql.NVarChar, vehicle_size)
        .input("pickup_location", sql.NVarChar, pickup_location)
        .input("stuffing_location", sql.NVarChar, stuffing_location)
        .input("delivery_location", sql.NVarChar, delivery_location)
        .input("commodity", sql.NVarChar, commodity)
        .input("cargo_type", sql.NVarChar, cargo_type)
        .input("cargo_weight", sql.Decimal(10, 2), cargo_weight)
        .input(
          "service_type",
          sql.NVarChar(sql.MAX),
          JSON.stringify(service_type)
        )
        .input(
          "service_prices",
          sql.NVarChar(sql.MAX),
          JSON.stringify(service_prices)
        )
        .input("containers_20ft", sql.Int, containers_20ft || 0)
        .input("containers_40ft", sql.Int, containers_40ft || 0)
        .input("total_containers", sql.Int, total_containers)
        .input("expected_pickup_date", sql.Date, expected_pickup_date)
        .input("expected_delivery_date", sql.Date, expected_delivery_date)
        .input("requested_price", sql.Decimal(10, 2), requested_price)
        .input("status", sql.NVarChar, status).query(`
          INSERT INTO transport_requests (
            customer_id, vehicle_type, vehicle_size, consignee, consigner,
            containers_20ft, containers_40ft, total_containers,
            pickup_location, stuffing_location, delivery_location,
            commodity, cargo_type, cargo_weight, service_type,
            service_prices, expected_pickup_date, expected_delivery_date,
            requested_price, status, created_at
          )
          VALUES (
            @customerId, @vehicle_type, @vehicle_size, @consignee, @consigner,
            @containers_20ft, @containers_40ft, @total_containers,
            @pickup_location, @stuffing_location, @delivery_location,
            @commodity, @cargo_type, @cargo_weight, @service_type,
            @service_prices, @expected_pickup_date, @expected_delivery_date,
            @requested_price, @status, GETDATE()
          )
        `);

      return { success: true };
    } catch (error) {
      console.error("Create transport request error:", error);
      throw error;
    }
  }

  static async getCustomerRequests(customerId) {
    try {
      await pool.connect();
      const result = await pool
        .request()
        .input("customerId", sql.Int, customerId).query(`
          SELECT 
            id,
            customer_id,
            vehicle_type,
            vehicle_size,
            consignee,
            consigner,
            containers_20ft,
            containers_40ft,
            total_containers,
            pickup_location,
            stuffing_location,
            delivery_location,
            commodity,
            cargo_type,
            cargo_weight,
            service_type,
            service_prices,
            expected_pickup_date,
            expected_delivery_date,
            requested_price,
            status,
            admin_comment,
            created_at,
            updated_at
          FROM transport_requests 
          WHERE customer_id = @customerId 
          ORDER BY created_at DESC
        `);

      // Transform the data to match frontend expectations
      const transformedResult = result.recordset.map((record) => ({
        ...record,
        service_type:
          typeof record.service_type === "string"
            ? JSON.parse(record.service_type)
            : record.service_type,
        service_prices:
          typeof record.service_prices === "string"
            ? JSON.parse(record.service_prices)
            : record.service_prices,
        expected_pickup_date: record.expected_pickup_date
          ? new Date(record.expected_pickup_date).toISOString().split("T")[0]
          : null,
        expected_delivery_date: record.expected_delivery_date
          ? new Date(record.expected_delivery_date).toISOString().split("T")[0]
          : null,
      }));

      return transformedResult;
    } catch (error) {
      console.error("Get customer requests error:", error);
      throw error;
    }
  }

  static async getAllRequests() {
    try {
      await pool.connect();
      const result = await pool.request().query(`
        SELECT 
          tr.id,
          tr.customer_id,
          tr.vehicle_type,
          tr.vehicle_size,
          tr.consignee,
          tr.consigner,
          tr.containers_20ft,
          tr.containers_40ft,
          tr.total_containers,
          tr.pickup_location,
          tr.stuffing_location,
          tr.delivery_location,
          tr.commodity,
          tr.cargo_type,
          tr.cargo_weight,
          tr.service_type,
          tr.service_prices,
          tr.expected_pickup_date,
          tr.expected_delivery_date,
          tr.requested_price,
          tr.status,
          tr.admin_comment,
          tr.created_at,
          tr.updated_at,
          u.name as customer_name, 
          u.email as customer_email
        FROM transport_requests tr
        INNER JOIN users u ON tr.customer_id = u.id
        ORDER BY tr.created_at DESC
      `);

      // Transform the data for consistency
      const transformedResult = result.recordset.map((record) => ({
        ...record,
        service_type:
          typeof record.service_type === "string"
            ? JSON.parse(record.service_type)
            : record.service_type,
        service_prices:
          typeof record.service_prices === "string"
            ? JSON.parse(record.service_prices)
            : record.service_prices,
        expected_pickup_date: record.expected_pickup_date
          ? new Date(record.expected_pickup_date).toISOString().split("T")[0]
          : null,
        expected_delivery_date: record.expected_delivery_date
          ? new Date(record.expected_delivery_date).toISOString().split("T")[0]
          : null,
      }));

      return transformedResult;
    } catch (error) {
      console.error("Get all requests error:", error);
      throw error;
    }
  }

  static async updateStatus(requestId, status, adminComment) {
    try {
      await pool.connect();
      const result = await pool
        .request()
        .input("requestId", sql.Int, requestId)
        .input("status", sql.VarChar(20), status)
        .input("adminComment", sql.NVarChar(500), adminComment)
        .input("updatedAt", sql.DateTime, new Date()).query(`
          UPDATE transport_requests 
          SET 
            status = @status,
            admin_comment = @adminComment,
            updated_at = @updatedAt
          OUTPUT INSERTED.*
          WHERE id = @requestId;
        `);

      return result.recordset[0];
    } catch (error) {
      console.error("Update status error:", error);
      throw error;
    }
  }

  static async update(id, requestData) {
    try {
      const {
        consignee,
        consigner,
        vehicle_type,
        vehicle_size,
        pickup_location,
        stuffing_location,
        delivery_location,
        commodity,
        cargo_type,
        cargo_weight,
        service_type,
        service_prices,
        containers_20ft,
        containers_40ft,
        total_containers,
        expected_pickup_date,
        expected_delivery_date,
        requested_price,
        customerId,
      } = requestData;

      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("customerId", sql.Int, customerId)
        .input("consignee", sql.NVarChar, consignee)
        .input("consigner", sql.NVarChar, consigner)
        .input("vehicle_type", sql.NVarChar, vehicle_type)
        .input("vehicle_size", sql.NVarChar, vehicle_size)
        .input("pickup_location", sql.NVarChar, pickup_location)
        .input("stuffing_location", sql.NVarChar, stuffing_location)
        .input("delivery_location", sql.NVarChar, delivery_location)
        .input("commodity", sql.NVarChar, commodity)
        .input("cargo_type", sql.NVarChar, cargo_type)
        .input("cargo_weight", sql.Decimal(10, 2), cargo_weight)
        .input(
          "service_type",
          sql.NVarChar(sql.MAX),
          JSON.stringify(service_type)
        )
        .input(
          "service_prices",
          sql.NVarChar(sql.MAX),
          JSON.stringify(service_prices)
        )
        .input("containers_20ft", sql.Int, containers_20ft)
        .input("containers_40ft", sql.Int, containers_40ft)
        .input("total_containers", sql.Int, total_containers)
        .input("expected_pickup_date", sql.Date, expected_pickup_date)
        .input("expected_delivery_date", sql.Date, expected_delivery_date)
        .input("requested_price", sql.Decimal(10, 2), requested_price).query(`
          UPDATE transport_requests
          SET 
            consignee = @consignee,
            consigner = @consigner,
            vehicle_type = @vehicle_type,
            vehicle_size = @vehicle_size,
            pickup_location = @pickup_location,
            stuffing_location = @stuffing_location,
            delivery_location = @delivery_location,
            commodity = @commodity,
            cargo_type = @cargo_type,
            cargo_weight = @cargo_weight,
            service_type = @service_type,
            service_prices = @service_prices,
            containers_20ft = @containers_20ft,
            containers_40ft = @containers_40ft,
            total_containers = @total_containers,
            expected_pickup_date = @expected_pickup_date,
            expected_delivery_date = @expected_delivery_date,
            requested_price = @requested_price,
            updated_at = GETDATE()
          WHERE id = @id AND customer_id = @customerId
        `);

      return { success: true };
    } catch (error) {
      console.error("Update transport request error:", error);
      throw error;
    }
  }
}

module.exports = TransportRequest;
