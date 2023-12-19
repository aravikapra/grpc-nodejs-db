const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const mysql = require('mysql2/promise');

// Load proto file using @grpc/proto-loader
const packageDefinition = protoLoader.loadSync('./proto/api.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Konfigurasi koneksi ke database MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_ms_grpc',
};

// Membuat koneksi pool
const pool = mysql.createPool(dbConfig);
// Load package definition using loadPackageDefinition
const apiProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();
const App = express();

server.addService(apiProto.ApiService.service, {
  GetMahasiswaInfoAll: async (call, callback) => {
    try {
      // Menggunakan koneksi database untuk mengambil data
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT m.*, r.* FROM tbl_mahasiswa m JOIN tbl_registrasi r ON m.reg_id = r.id');

      // Mengirim respons ke panggilan gRPC
      const grpcResponse = { mahasiswas: rows };
      console.log(rows);
      callback(null, grpcResponse);

      // Mengembalikan koneksi ke pool setelah selesai
      connection.release();
    } catch (error) {
      console.error('Error:', error.message);

      // Menangani kesalahan dan mengembalikan kesalahan ke panggilan gRPC
      const grpcError = {
        code: grpc.status.INTERNAL,
        details: 'Internal Server Error',
      };
      callback(grpcError);
    }
  },
});

const PORT_HTTP = 50052;
App.get('/api/mahasiswa-info-all', async (req, res) => {
  try {
    // Menggunakan koneksi database untuk mengambil data
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT m.*, r.* FROM tbl_mahasiswa m JOIN tbl_registrasi r ON m.reg_id = r.id');

    // Mengirim respons ke panggilan HTTP
    const httpResponse = { mahasiswas: rows };
    console.log(rows);
    res.status(200).json(httpResponse); // Set the status code and use res.json
    // Mengembalikan koneksi ke pool setelah selesai
    connection.release();
    return rows;
  } catch (error) {
    console.error('Error:', error.message);

    // Menangani kesalahan dan mengirim kesalahan ke panggilan HTTP
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

App.listen(PORT_HTTP, () => {
  console.log(`HTTP Server running at http://localhost:${PORT_HTTP}`);
});
