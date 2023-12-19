const grpc = require('@grpc/grpc-js');
const axios = require('axios');
const protoLoader = require('@grpc/proto-loader');

// Load proto file using @grpc/proto-loader
const packageDefinition = protoLoader.loadSync('./proto/api.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load package definition using loadPackageDefinition
const apiProto = grpc.loadPackageDefinition(packageDefinition);

// Access the service definition using the proto file structure
const apiService = apiProto .ApiService;

const client = new apiService('localhost:50051', grpc.credentials.createInsecure());

client.GetMahasiswaInfoAll({},(error, response) => {
    if (!error) {
      console.log("response received :",response);
      
      // Mengakses metadata dari respons
      const metadata = response.data;
      if (metadata) {
        console.log('Received metadata:');
        Object.keys(metadata).forEach(key => {
          console.log(key,metadata[key]);
        });
      }
    } else {
      console.error(error);
    }
  });
