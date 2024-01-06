const express = require('express');
const mysql = require('mysql');
const cron = require('node-cron');
const app = express();

// MySQL configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'fgt23m1217',
  database: 'habits'
});

// Connect to MySQL
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Configure Express to parse JSON requests
app.use(express.json());
app.use(express.static('public'));


app.get('/api/habits', (req, res) => {
  const query = 'SELECT habit_name, habit_desc, frequency, idhabit, habit_done FROM habits INNER JOIN habit_complete ON idhabits=idhabit';

  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching habits from the database' });
      return;
    }

    res.json(results);
  });
});
// API endpoint to create a habit
app.post('/api/habits', (req, res) => {
  const { habitName, habitDesc, frequency } = req.body;

  if (!habitName || !habitDesc || !frequency) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = 'INSERT INTO habits (habit_name, habit_desc, frequency) VALUES (?, ?, ?)';
  db.query(query, [habitName, habitDesc, frequency], (err, result) => {
    
    if (err) {
      console.error('Error creating habit:', err);
      return res.status(500).json({ error: 'Error creating habit' });
    }
    const query_id = result.insertId;
    const init_success_field = 'INSERT INTO habit_complete (idhabit, habit_done) VALUES (?,?)';
    db.query(init_success_field,[query_id,false],(err,result)=>{
      if (err) {
        console.error('Error adding habit complete');
        return res.status(500).json({ error: 'Error adding habit complete'});
      }
    }); 
  


    // Send a success response
    return res.status(201).json({ message: 'Habit created successfully', habitId: result.insertId });
  });
});


app.put('/api/habits/:habitId', (req, res) => {
  const habitId = req.params.habitId;
  const { habitName, habitDesc, frequency } = req.body;

  if (!habitName || !habitDesc || !frequency) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const updateQuery = 'UPDATE habits SET habit_name = ?, habit_desc = ?, frequency = ? WHERE idhabits = ?';
  db.query(updateQuery, [habitName, habitDesc, frequency, habitId], (err, result) => {
    if (err) {
      console.error('Error updating habit:', err);
      return res.status(500).json({ error: 'Error updating habit' });
    }

    // Check if the habit was found and updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Send a success response
    return res.status(200).json({ message: 'Habit updated successfully', habitId });
  });
});





app.put('/api/habitcomplete', (req, res) => {
  const { habitid, habitcomplete } = req.body;

  if (typeof habitcomplete !== 'boolean') {
    return res.status(400).json({ error: 'Invalid habit completed. Must be a boolean.' });
  }
    // Update habit status in the MySQL database
    const updateQuery = 'UPDATE habit_complete SET habit_done = ? WHERE idhabit = ?';

    db.query(updateQuery, [habitcomplete, habitid], (err, results) => {
      if (err) {
        console.error('Error updating habit status:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      // Check if the habit was found and updated
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }
  
      // Success
      return res.json({ success: true });
    });
});

app.delete('/api/habits', (req, res) => {
  const {habitsid} = req.body;
  const deletequery = "DELETE FROM habits WHERE (idhabits = ?)";
  db.query(deletequery,habitsid, (err, results) => {
    if (err) {
      console.error('Error Deleting Habit',err);
      return res.status(500).json({error: 'Internal server error'});
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    // Success
    return res.json({ success: true });
  });
});

cron.schedule('0 23 * * *', () => {
  console.log('Running the database update task...');
  updateTracking();
});

function updateTracking()
{
  const query = 'SELECT habit_name, habit_desc, frequency, idhabit, habit_done,days_since_reset FROM habits INNER JOIN habit_complete ON idhabits=idhabit';

  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching habits from the database' });
      return;
    }

    var habitsData = res.json(results);

  });
  habitsData.foreach(habit=>
   {
      
   }   
  );


}





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function insert_habit(){

}


function add_success_field(id){

}

