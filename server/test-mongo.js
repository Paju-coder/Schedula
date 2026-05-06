const { MongoClient, ServerApiVersion } = require('mongodb');

// Try SRV first, fall back to direct connection
const srvUri = "mongodb+srv://bhosalesuman88_db_user:FlUFIXWsbhvj92t0@cluster0.jqweonw.mongodb.net/?appName=Cluster0";

async function run() {
  console.log("🔄 Testing MongoDB connection...\n");
  
  // Attempt 1: SRV connection
  try {
    console.log("Attempt 1: Using mongodb+srv:// ...");
    const client = new MongoClient(srvUri, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      serverSelectionTimeoutMS: 10000,
      dns: { servers: ["8.8.8.8", "8.8.4.4"] } // Use Google DNS
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ SUCCESS with SRV! Connected to MongoDB!");
    await client.close();
    process.exit(0);
  } catch (err) {
    console.log("❌ SRV failed:", err.message);
    console.log("");
  }

  // Attempt 2: Direct connection (no SRV)
  try {
    console.log("Attempt 2: Using direct connection (no SRV)...");
    // Get the actual hosts by resolving the cluster manually
    const dns = require('dns');
    const { Resolver } = dns;
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '8.8.4.4']);
    
    const records = await new Promise((resolve, reject) => {
      resolver.resolveSrv('_mongodb._tcp.cluster0.jqweonw.mongodb.net', (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    const hosts = records.map(r => `${r.name}:${r.port}`).join(',');
    const directUri = `mongodb://${encodeURIComponent('bhosalesuman88_db_user')}:${encodeURIComponent('FlUFIXWsbhvj92t0')}@${hosts}/schedula?ssl=true&authSource=admin&retryWrites=true&w=majority`;
    
    console.log("Resolved hosts:", hosts);
    const client = new MongoClient(directUri, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ SUCCESS with direct connection! Connected to MongoDB!");
    await client.close();
    process.exit(0);
  } catch (err) {
    console.log("❌ Direct connection also failed:", err.message);
    console.log("\n⚠️  Your network is likely blocking MongoDB connections.");
    console.log("   Try these fixes:");
    console.log("   1. Switch to mobile hotspot");
    console.log("   2. Use a VPN");
    console.log("   3. Change your DNS to 8.8.8.8 (Google DNS)");
    console.log("      → Settings > Network > DNS > 8.8.8.8");
    process.exit(1);
  }
}

run();
