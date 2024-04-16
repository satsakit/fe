const express = require('express');
const app = express();
// เรียกใช้โมดูล pg เพื่อเชื่อมต่อกับ PostgreSQL
const { Pool } = require('pg');
const multer = require('multer')
const fs = require('fs')
const port = 3000;
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./public/uploads"
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.camera_name}.jpg`)
  }
})

const upload = multer({ storage: storage })

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
    const result = await client.query("SELECT * from intrusion_rule_infos.intrusion_rule_infos")
    const users = result.rows
    console.log(users);
    return res.render('index.ejs', {users})
  } catch (error) {
    return res.send({message: "error"})
  }
})

app.post("/camera",upload.single("image"), async(req,res) => {

  console.log(req.body);
  const {camera_owner, camera_name, start_time, end_time,image} = req.body
  console.log(image);
  try {
    const currentDate = new Date(); // Current date and time
    const formattedDate = currentDate.toISOString(); 
    const client = await pool.connect()
    const result = await client.query("INSERT into intrusion_rule_infos.intrusion_rule_infos (camera_owner,camera_name,start_time,end_time,image, created_at, created_by, intrusion_type ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",[camera_owner, camera_name, start_time, end_time,image?.filename, formattedDate, "golf", "image"])
    const newCamera = result.rows[0]



    return res.send({data: newCamera,status: true})
  } catch (error) {
    console.log(error);
    return res.send({message: "error"})
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/login`);
});
