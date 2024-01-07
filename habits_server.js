const express = require('express');
const mysql = require('mysql2');
const cron = require('node-cron');
const app = express();

const habit_query = 'SELECT habit_name, habit_desc, frequency, timescale, idhabit, habit_done,days_since_reset,count FROM habits INNER JOIN habit_complete ON idhabits=idhabit';


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
  const query = habit_query //'SELECT habit_name, habit_desc, frequency, timescale, idhabit, habit_done FROM habits INNER JOIN habit_complete ON idhabits=idhabit';

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
  const { habitName, habitDesc, frequency,timescale } = req.body;

  if (!habitName || !habitDesc || !frequency) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = 'INSERT INTO habits (habit_name, habit_desc, frequency,timescale) VALUES (?, ?, ?, ?)';
  db.query(query, [habitName, habitDesc, frequency,timescale], (err, result) => {
    
    if (err) {
      console.error('Error creating habit:', err);
      return res.status(500).json({ error: 'Error creating habit' });
    }
    const query_id = result.insertId;
    const init_success_field = 'INSERT INTO habit_complete (idhabit, habit_done,days_since_reset,count) VALUES (?,?,?,?)';
    db.query(init_success_field,[query_id,false,0,0],(err,result)=>{
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
  const { habitid, habitcomplete,days_since_reset,count } = req.body;

  if (typeof habitcomplete !== 'boolean') {
    return res.status(400).json({ error: 'Invalid habit completed. Must be a boolean.' });
  }
    // Update habit status in the MySQL database
    const updateQuery = 'UPDATE habit_complete SET habit_done = ?, days_since_reset = ?, count = ? WHERE idhabit = ?';

    db.query(updateQuery, [habitcomplete, days_since_reset,count,habitid], (err, results) => {
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

cron.schedule('59 59 18 * * *', () => {
  console.log('Running the database update task...');
  updateTracking();
});


async function updateTracking()
{
  //increment the days since daemon reset each
  const day_query = "UPDATE habit_complete SET days_since_reset = days_since_reset +1";
  console.log(internalQuery(day_query));

  const query = habit_query;
  var habitsData = Array.from(await getQuery(query));

  habitsData.forEach(habit=>
   {
      var timeframe = (habit.timescale);
      if (timeframe == "DAY")
      {
        days=1;
      }
      else if (timeframe == "WEEK")
      {
        days = 7;
      }
      else if (timeframe == "MONTH")
      {
        days=30;
      }
      if (habit.days_since_reset >= days)
      {
        //update tracking
        const reset_query = `UPDATE habit_complete SET days_since_reset = 0, count = 0, habit_done = 0 WHERE idhabit = ?`;
        const tracking_query = `INSERT INTO tracking (idhabit, start_time, end_time, complete, complete_count) VALUES (?, ?, ?, ?, ?)`;
        console.log(internalQuery(reset_query,[habit.idhabit]));
        const end_date = new Date();
        const start_date = new Date(end_date);
        start_date.setDate(end_date.getDate()-days);
        
        //add to the tracking
        const idhabit = habit.idhabit;
        const habitdone = habit.habit_done;
        const habitcount = habit.count;
        const ms_start = mysql_date(start_date);
        const ms_end = mysql_date(end_date);

        internalQuery(tracking_query,[idhabit, ms_start,ms_end,habitdone,habitcount]);
        //reset values in database
        

      }
      else
      {

      }
   }   
  );
}

function mysql_date(date)
{
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so we add 1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const mysqlFormattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return mysqlFormattedDate;
}


async function getQuery(query)
{
  return new Promise((resolve,reject)=>{
  db.query(query, (err, results)=> {
    if (err) {
      console.error('Error getting entries:', err);
      console.log (err);
    }
    // Check if the habit was found and updated
    if (!results) {
      console.log ('Entry not found');
    }
    // Success
    console.log('Success');
    resolve(results);
    });
  });
}

function internalQuery(query,params=null)
{
  if (params)
  {
    const new_query = mysql.format(query,params);
    db.query(new_query, (err, results) => {
      if (err) {
        console.error('Error updating field:', err);
        return (err);
      }
      // Check if the habit was found and updated
      if (results.affectedRows === 0) {
        return ('Entry not found');
      }
      // Success
      return('Success');
    });
  }
  else
  {
    const new_query = mysql.format(query,params);
    db.query(new_query, (err, results) => {
      if (err) {
        console.error('Error updating field:', err);
        return (err);
      }
      // Check if the habit was found and updated
      if (results.affectedRows === 0) {
        return ('Entry not found');
      }
      // Success
      return('Success');
    });
  }
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

