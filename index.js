const express = require('express');
const app = express();
// เรียกใช้โมดูล pg เพื่อเชื่อมต่อกับ PostgreSQL
const { Pool } = require('pg');
const multer = require('multer')
const fs = require('fs')
const port = 3000;
app.use(express.static('public'));



//const upload = multer({ storage: storage })
const upload = multer({
  storage: multer.memoryStorage() // เก็บไฟล์ในหน่วยความจำชั่วคราวเพื่อให้สามารถเข้าถึง buffer ได้
});
// กำหนดค่าการเชื่อมต่อฐานข้อมูล PostgreSQL
const pool = new Pool({
  user: 'kdadmin',
  host: '192.168.100.125',
  database: 'know_db',
  password: 'P@ssw0rdData',
  port: 5432, // พอร์ตเริ่มต้นของ PostgreSQL
});

  pool.connect((err) => {
      if (err) {
          console.error('Error connecting to the database:', err.stack);
          return;
      }
  
      console.log('Connected to the MySQL database successfully');
  });
  
  // เรียกใช้ Express เพื่อรับคำขอ HTTP


// กำหนดให้ Express ใช้ EJS เป็น View Engine
app.set('view engine', 'ejs');

// รับข้อมูลจาก form ผ่าน middleware
app.use(express.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.render('login');
});

// หน้า login
app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/index', (req, res) => {
  res.render('index');
});
app.get('/logout', (req, res) => {
  res.render('login');
});
//กำหนด username password
const users = [{
  "username":"admin@metthier.com",
  "password":"1234MT"
},
]

// ตรวจสอบการล็อกอิน
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Iterate over the users array to find a matching username
  const user = users.find(user => user.username === username);

  if (user) {
    // If the user is found, check the password
    if (user.password === password) {
      return res.redirect('/camera');
    } else {
      
      return res.send('<script>alert("รหัสผ่านไม่ถูกต้อง");</script>');
    }
  } else {
    
    return res.send('<script>alert("ไม่พบผู้ใช้");</script>');
  }
});

app.get("/camera", async(req,res) => {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT * from intrusion_rule_infos.intrusion_rule_infos where deleted_at is null")
    const users = result.rows
    return res.render('index.ejs', {users})
  } catch (error) {
    return res.send({message: "error"})
  }
})

app.get("/camera/:id", async(req,res) => {
  try {
    const {id} = req.params
    const client = await pool.connect()
    const result  = await client.query(`SELECT * from intrusion_rule_infos.intrusion_rule_infos where deleted_at is null AND id = $1`,[id])
     const user = result.rows
     return res.send({nessage: "Success", data: user[0]})
  } catch (error) {
    console.log(error);
    return res.send({message: "error"})
  }
})

app.post("/camera", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const { camera_owner, camera_name, start_time, end_time } = req.body;
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString();
    console.log(req.file);
    const imageBuffer = req.file.buffer; // Access the uploaded file buffer
    const imageBase64 = imageBuffer.toString('base64');

    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO intrusion_rule_infos.intrusion_rule_infos (camera_owner, camera_name, start_time, end_time, image, created_at, created_by, intrusion_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [camera_owner, camera_name, start_time, end_time, imageBase64, formattedDate, "ice", "image"]
    );

    return res.redirect('/camera');

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error" });
  }
});


app.post("/update", upload.single("image"), async (req, res) => {
  try {
    const { camera_owner, camera_name, start_time, end_time, id } = req.body;
    const currentDate = new Date();

    
    const formattedDate = currentDate.toISOString();
    let imageBase64;
    
    if (req.file) {
      const imageBuffer = req.file.buffer;
      imageBase64 = imageBuffer.toString('base64');
    }
    
    const result  = await pool.query(`SELECT * from intrusion_rule_infos.intrusion_rule_infos where deleted_at is null AND id = $1`,[id])

    const data = result.rows


    const sql = `
      UPDATE intrusion_rule_infos.intrusion_rule_infos
      SET 
        camera_owner = $1,
        camera_name = $2,
        start_time = $3,
        end_time = $4,
        updated_at = $5,
        image = $6
      WHERE id = $7;
    `;

    const values = [
      camera_owner,
      camera_name,
      start_time,
      end_time,
      formattedDate,
      imageBase64 || data[0].image, // Include null for image if not uploaded
      id
    ];

    const client = await pool.query(sql, values); // Assuming pool is your connection pool

    return res.redirect('/camera');
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error" });
  }
});

app.delete("/camera/:id", async(req,res) => {   // update simulation delete_at for defualt null and not show data
  try {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString();
    
     const { id } = req.params;    
     
     const result  = await pool.query(`SELECT * from intrusion_rule_infos.intrusion_rule_infos where deleted_at is null AND id = ${parseInt(id)}`)

     const data = result.rows
     const SQL_update = `update intrusion_rule_infos.intrusion_rule_infos set deleted_at = '${formattedDate}' where id = ${parseInt(id)}`
     console.log(SQL_update)
     if(data.length > 0){
      const client = await pool.query(SQL_update);
      
       res.send(` ID ${id} ทำการ delete at ${formattedDate} เรียบร้อย`);
       //return res.redirect('/camera');
     }else{
       res.status(404).send('data not corret.กรุณาตรวจสอบข้อมูลอีกครั้ง.');

     }
     //return res.redirect('/camera');   
    
  } catch (error) {
     console.error(error);
     return res.status(500).send({ message: "Internal server error" });
    
  }
})




app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/login`);
});
