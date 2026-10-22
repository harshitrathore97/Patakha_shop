import mongoose from 'mongoose';

const uri = 'mongodb+srv://LeetcodeClone:himanshu9610@leetcodeclone.hxor81p.mongodb.net/patakhashop?retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db;
  const col = db.collection('admins');
  
  const before = await col.find({}).toArray();
  console.log('Current admins:', before.map(a => a.email));
  
  const result = await col.updateMany(
    { email: /himanshusahiswm/i },
    { $set: { email: 'himanshusahuswm@gmail.com' } }
  );
  console.log('Updated count:', result.modifiedCount);
  
  const after = await col.find({}).toArray();
  console.log('After update:', after.map(a => a.email));
  
  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(e => { console.error(e.message); process.exit(1); });
