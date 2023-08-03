const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const stripe = require('stripe')(process.env.SECRET_key)
const port = process.env.PORT || 5000;
// i have to change all the thing 
// middleware
app.use(cors())
app.use(express.json())
const veryfyJWT = (req,res,next) =>{
  const authorization = req.headers.authorization;
  
  console.log('14 number line' + authorization);
  
  if (!authorization) {
    return res.status(403).send({err: true, mesage: 'unauthorized'})
  }
  const token = authorization.split(' ')[1];
    jwt.verify(token,process.env.JWT_Token,(err,decoded) =>{
      if (err) {
        return res.status(401).send({err: true, mesage: 'unauthorized'})
      }
      req.decoded =decoded
      next()
    })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const e = require('cors');
const { default: Stripe } = require('stripe');
const uri = `mongodb://${process.env.DB_user}:${process.env.DB_pass}@ac-wotlaa2-shard-00-00.0rmdzda.mongodb.net:27017,ac-wotlaa2-shard-00-01.0rmdzda.mongodb.net:27017,ac-wotlaa2-shard-00-02.0rmdzda.mongodb.net:27017/?ssl=true&replicaSet=atlas-as340s-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const sportCollection = client.db("Summer-vision").collection('classCatagory')
    const coachesCollection = client.db("Summer-vision").collection('coaches')
    const allClassesCollection = client.db("Summer-vision").collection('allClasses')
    const selectedClassCollection = client.db("Summer-vision").collection('selectedClass')
    const allUserCollection = client.db("Summer-vision").collection('user')
    const paymentCollection = client.db("Summer-vision").collection('payment')
    // Send a ping to confirm a successful connection

 app.post('/jwt',(req,res) =>{
  const user = req.body;
  const token = jwt.sign(user,process.env.JWT_Token,{ expiresIn: '1h' });
  res.send({token})
 })

//  use jwt bufore using this
const verifyAdmin = async(req,res,next) =>{
  const email = req.decoded.email;
  const quary = {email: email};
  const user = await allUserCollection.findOne(quary);
  if (user.role !== "admin") {
    return res.status(403).send({error: true ,message:'forbidden req'})
    
  }
  next()
}
const verifyinstructor = async(req,res,next) =>{
  const email = req.decoded.email;
  const quary = {email: email};
  const user = await allUserCollection.findOne(quary);
  if (user.role !== "instractor") {
    return res.status(403).send({error: true ,message:'forbidden req'})
    
  }
  next()
}

  app.get('/catagory',async(req,res) =>{
    const result = await sportCollection.find().toArray()
    res.send(result)
  })
  app.get('/populer-coaches',async(req,res) =>{
    const result = await coachesCollection.find().toArray()
    res.send(result)
  })
// all classes

app.get('/allClasses',async(req,res) =>{
    const quary = {approve : "approve"}
    const result =await allClassesCollection.find(quary).toArray()
    res.send(result)
})
// TODO
app.put('/instructorUpdatedCasll/:id',async(req,res) =>{
  const id =req.params.id;
  console.log(id);
  const quary = {_id : new ObjectId(id)};
  const update = {$inc:{enrolled : +1}}
  const result = await allClassesCollection.updateOne(quary,update)
  res.send(result)
})

// instractor adda new course 
app.post('/allClasses',veryfyJWT,verifyinstructor,async(req,res) =>{
  const body = req.body
  const result =await allClassesCollection.insertOne(body)
  res.send(result)
})
app.get('/instructorClasses/:email',veryfyJWT,verifyinstructor,async(req,res) =>{
  const email =req.params.email;
  // console.log(email);
  const quary = {email : email}
  const result =await allClassesCollection.find(quary).toArray()
  res.send(result)
})
// for admin aproval
app.get('/notApproveClasses',veryfyJWT,verifyAdmin,async(req,res) =>{
    const quary = {role : "aproveReq"}
    const result =await allClassesCollection.find(quary).toArray()
    res.send(result)
})


app.patch('/addedClass/:id',async(req,res) =>{
  const id = req.params.id;
  const {feedback,action} = req.body
  const quary = {_id : new ObjectId(id)}
  const updateDoc = {
    $set: {
      approve : action,
      feedback: feedback
    },
  };
  const result= await allClassesCollection.updateOne(quary,updateDoc)
  res.send(result)
})



// selected classes TODO
app.post('/selectedClass/:id',veryfyJWT,async(req,res) =>{
const body = req.body;
const id = req.params.id;
const quary = {_id : new ObjectId(id)}
const filter = await selectedClassCollection.findOne(quary)
// console.log(filter);
// if (filter) {
//   // return res.send({message : 'allready hear'})
//   console.log(filter);
// }

const result = await selectedClassCollection.insertOne(body)
res.send(result)
})

// my enroled classes 
app.get('/enroledClasses/:email',async(req,res) =>{
  const email = req.params.email;
  const quary = {email : email}
  const result = await paymentCollection.find(quary).sort({ date: -1 }).toArray()
  res.send(result)
})
// my selecter classes

app.get('/myclasses',veryfyJWT,async(req,res) =>{
  const email=  req.query.email
  const quary = {userEmail: email}
  const result =await selectedClassCollection.find(quary).toArray()
  res.send(result)
})
app.delete('/myclasses/:id',async(req,res) =>{
  const id =  req.params.id;
  const query =  {_id : new ObjectId(id)};
  const result = await selectedClassCollection.deleteOne(query)
  res.send(result)
})
// All users rout 
app.post('/all-user',async(req,res) =>{
  const body = req.body;
  const quary= {email : body.email}
  const isabilavle = await allUserCollection.findOne(quary)
  
  if (isabilavle) {
    return res.send({message : 'already'})
  }
  const result = await allUserCollection.insertOne(body)
  res.send(result)
})
app.get('/all-user',veryfyJWT,verifyAdmin,async(req,res) =>{
  const result = await allUserCollection.find().toArray()
  res.send(result)
})
// make admin 
app.patch('/user/admin/:id',async(req,res) =>{
  const id = req.params.id;
  const {role} = req.body
  const quary = {_id : new ObjectId(id)}
  const updateDoc = {
    $set: {
      role : role
    },
  };
  const result= await allUserCollection.updateOne(quary,updateDoc)
  res.send(result)
})
// identify users 

app.get('/user/admin/:email', veryfyJWT,async(req,res) =>{
  const email =  req.params.email
  const quary = {email : email};

  if (req.decoded.email !== email) {
    return res.send({admin : false})
  }
  const user = await allUserCollection.findOne(quary);
  const result = {admin : user?.role == "admin"}
  res.send(result)
})
app.get('/user/user/:email', veryfyJWT,async(req,res) =>{
  const email =  req.params.email
  const quary = {email : email};

  if (req.decoded.email !== email) {
    return res.send({admin : false})
  }
  const user = await allUserCollection.findOne(quary);
  const result = {users : user?.role == "user"}
  res.send(result)
})
app.get('/user/instractor/:email', veryfyJWT,async(req,res) =>{
  const email =  req.params.email
  const quary = {email : email};

  if (req.decoded.email !== email) {
    return res.send({instractor : false})
  }
  const user = await allUserCollection.findOne(quary);
  const result = {instractor : user?.role == "instractor"}
  res.send(result)
})

// Payment
app.post('/paymentDetils',async(req,res)=>{
  const payment = req.body;
  const result = await paymentCollection.insertOne(payment);
  res.send(result)
})


app.post('/creat-payment',veryfyJWT,async(req,res) =>{
  const {price} = req.body;
  const amount = Math.round(parseFloat(price) * 100);
  console.log(price);
  // const amount = price * 100
  const paymentIntent =  await stripe.paymentIntents.create({
    amount : amount,
    currency: 'usd',
    payment_method_types:['card']
  });
 return res.send({
     clientSecret: paymentIntent.client_secret,
  });
})
app.delete('/confirmPayment/:id',async(req,res) =>{
  const id = req.params.id;
  const quary = {_id : new ObjectId(id)}
  const result = await selectedClassCollection.deleteOne(quary);
  res.send(result)
})

app.put('/deleteCount/:id', async(req,res) =>{
const id = req.params.id
// console.log(id);
const quary = { _id : new ObjectId(id)};
const update = {$inc: {availableSeats : -1}}
// const updateInt = parseInt(update)
const result = await allClassesCollection.updateOne(quary,update)
res.send(result)

})

  await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res) =>{
    res.send('summer is comming on')
})
app.listen(port, () =>{
    console.log(`summer is comming on ${port}`);
})