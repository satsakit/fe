const express = require('express');
const app = express();
const mysql = require('mysql');
const port = 3000;
app.use(express.static('public'));
// const connection = mysql.createConnection({ 
//     port: '5432',
//     host: '192.168.100.125',
//     user: 'kdadmin', // ชื่อผู้ใช้ MySQL
//     password: 'P@ssw0rdData', // รหัสผ่าน MySQL
//     database: 'know_db' // ชื่อฐานข้อมูลที่ต้องการเชื่อมต่อ
//   });
const connection = mysql.createConnection({ 
    port: '3306',
    host: 'localhost',
    user: 'root', // ชื่อผู้ใช้ MySQL
    password: '', // รหัสผ่าน MySQL
    database: 'pj' // ชื่อฐานข้อมูลที่ต้องการเชื่อมต่อ
  });
  
  connection.connect((err) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล:', err.stack);
      return;
    }
  
    console.log('เชื่อมต่อกับ MySQL Database สำเร็จ');
  });
  

// กำหนดให้ Express ใช้ EJS เป็น View Engine
app.set('view engine', 'ejs');

// รับข้อมูลจาก form ผ่าน middleware
app.use(express.urlencoded({ extended: false }));

// หน้า login
app.get('/login', (req, res) => {
  res.render('login');
});

// ตรวจสอบการล็อกอิน
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(username,password);
  // ตรวจสอบ username และ password ในฐานข้อมูลหรือที่เก็บไว้
  // ในที่นี้เพื่อตัวอย่างเท่านั้น
//   if (username === 'admin' && password === 'password') {
//     res.send('ยินดีต้อนรับเข้าสู่ระบบ');
//   } else {
//     reshrehreher.send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
//   }

  const sql = 'SELECT * FROM user WHERE username = ?';
  
  // ประมวลผลคำสั่ง SQL
  connection.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Error querying MySQL database', err);
      
      return res.send('เชื่อมต่อไม่สำเร็จ')
    }

    if (results.length === 0) {
      // ไม่พบผู้ใช้
    
      return res.send('ไม่พบผู้ใช้')
      

    }

    const user = results[0];
    // ตรวจสอบรหัสผ่าน
    const passwordMatch = user.password == password ? true : false 
        if (passwordMatch) {
            res.send('ล็อคอินสำเร็จ')

        }
        else {
            res.send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
})
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
