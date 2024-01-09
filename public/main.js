var all_habits = {};
var habitsData = [];
var categories = [];
var habitContainers = {};
var visibilities = {};

// customElements.define('habits-table', HabitsTable);

document.addEventListener('DOMContentLoaded', () =>
{
    customElements.define('habits-table', HabitsTable);
    refreshTable();
});
    function toggleHabitStatus(habitId) {
      // Implement toggling habit status using the API
      const habit = habitsData.find(h => h.id === habitId);
      if (habit) {
        habit.completed = false;
        if ((habit.count + 1) >= habit.frequency)
        {
          habit.completed = true;
        }
        const habitid = habit.id;
        const habitcomplete = habit.completed;
        const days_since_reset = habit.days_since_reset;
        const count = habit.count+1;
        const success_data = {
          habitid,
          habitcomplete,
          days_since_reset,
          count
        };
        put(`/api/habitcomplete`,success_data);
        refreshTable();
    }
  }

  function put(url,data=null)
  {
    if (data)
    {
      bodycontent=JSON.stringify(data);
    }
    else
    {
      bodycontent = '';
    }
    fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: bodycontent
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          //return response.json();
        })
        .then(data => {
          console.log('updated successfully:', data);
          
        })
    .catch(error => console.error('Error updating habit:', error));
  }

  function get(url,data=null)
  {

  }



  function resetHabitCount(habitid)
  {
    const habit = habitsData.find(h => h.id === habitid);
      if (habit) {
        const habitcomplete = false;
        const days_since_reset = habit.days_since_reset;
        const count = 0;
        const success_data = {
          habitid,
          habitcomplete,
          days_since_reset,
          count
        };
        put("/api/habitcomplete",success_data);
        refreshTable();
    }
  }



    function updateHabitCounts() {
    //   const totalHabits = habitsData.length;
    //   const completedHabits = habitsData.filter(h => h.completed).length;
    //   const notCompletedHabits = totalHabits - completedHabits;

    //   document.getElementById('totalHabits').textContent = totalHabits;
    //   document.getElementById('completedHabits').textContent = completedHabits;
    //   document.getElementById('notCompletedHabits').textContent = notCompletedHabits;
    }


    async function fetchHabits() {
    // Fetch habit data from the server (replace with your API endpoint)
        categories = [];

        await fetch('/api/categories').then(response=>response.json())
          .then(data =>
            {
                data.forEach(category=>{
                    categories.push(category.category);
                    if (!(category.category in visibilities))
                    {
                        visibilities[category.category] = "block";
                    }
                });
                
            })
            .catch(error=> console.error('Error fetching categories:',error));
            
        await fetch('/api/habits')
          .then(response => response.json())
          .then(data => {
            const habit_container = document.getElementById("Habits");
            habit_container.innerHTML = ``;
            habitsData = [];
            habitContainers = {};
            categories.forEach(category=>{
                var habitsTableBody = new HabitsTable(category);
                habitsTableBody.classList.add('green-row');
                const table_body =  habitsTableBody.getElementById(`habitsTableBody_${category}`);
                const table_list =  habitsTableBody.getElementById(`habitsList_${category}`);
                
                table_body.innerHTML = ``;
                data.forEach(habit => {
                    if (String(habit.category) === String(category))
                    {
                        const habitRow = habitsTableBody.row_template(habit);
                        table_body.appendChild(habitRow);
                        habitsData.push({id: habit.idhabit, name: habit.habit_name, frequency: habit.frequency, completed: habit.habit_done,desc: habit.habit_desc,count:habit.count,days_since_reset: habit.days_since_reset});
                    }
                });
                // if (table_body.childElementCount > 0)
                // {
                    const root_list = habitsTableBody.shadowRoot;
                    const target_element = root_list.querySelector('div');
                    target_element.style.display = visibilities[category];
                    habit_container.appendChild(habitsTableBody);
                    habitContainers[category] = habitsTableBody;
                // }
            });


        })
        .catch(error => console.error('Error fetching habits:', error));

    }

    


    function addNewRow(div_id) {
    const search_term = `habitsTableBody_${div_id}`;
    const habitContainer = habitContainers[div_id];
    const habitsTableBody = habitContainer.getElementById(search_term);

    const newRow = document.createElement('tr');
    const rowNum = habitsTableBody.childNodes.length + 1
    newRow.innerHTML = `
      <td><input type="text" placeholder="Enter habit name" id ="HabitName_${rowNum}"></td>
      <td><input type="text" placeholder="Enter habit description" id ="HabitDesc_${rowNum}"></td>
      <td><input type="number" placeholder="Enter frequency" id ="HabitFreq_${rowNum}"></td>
      <td><select id="dropdown_${rowNum}" name="dropdown">
        <option value="DAY">Day</option>
        <option value="WEEK">Week</option>
        <option value="MONTH">Month</option></select>
      <td>
        <button onclick="confirmRowCreation(${rowNum},'${div_id}')">&#10004;</button>
        <button onclick="cancelRowCreation(event)">&#10006;</button>
      </td>
    `;

    habitsTableBody.appendChild(newRow);
    console.log("new row index is:", habitsTableBody.childNodes.length);
 
  }

  function editCurrentRow(habitId,cat) {
    const habitContainer = habitContainers[cat];
    const habitsTableBody = habitContainer.getElementById(`habitsTableBody_${cat}`);
    let existingRow;
    let rowIndex;
    for (let i = 0; i< habitsTableBody.children.length; i++)
    {
    const currentRow = habitsTableBody.children[i];
    if (currentRow.id === String(habitId)) {
        existingRow = currentRow;
        rowIndex = i;
        break; // Exit the loop once the row is found
    }
    }
    // const existingRow = habitsTableBody.children.filter(c=>c.id === String(habitId))[0];
    curHabit = habitsData.filter(c=>c.id === habitId)[0];
    const curname = curHabit.name;
    const curfreq = curHabit.frequency;
    const curdesc = curHabit.desc;
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
    <td><input type="text" placeholder="${curname}" id ="HabitName_${rowIndex}"></td>
    <td><input type="text" placeholder="${curdesc}" id ="HabitDesc_${rowIndex}"></td>
    <td><input type="number" placeholder="${curfreq}" id ="HabitFreq_${rowIndex}"></td>
    <td>
        <button onclick="confirmRowEdit(${rowIndex},${habitId},'${cat}')">&#10004;</button>
        <button onclick="cancelRowCreation(event)">&#10006;</button>
    </td>
    `;
    habitsTableBody.replaceChild(newRow,existingRow);
}

function confirmRowEdit(rowIndex, habitId,cat)
{
    const habitContainer = habitContainers[cat];
    const habitsTableBody = habitContainer.getElementById(`habitsTableBody_${cat}`);
    const habitNameInput = habitContainer.getElementById(`HabitName_${rowIndex}`);
    const habitDescInput = habitContainer.getElementById(`HabitDesc_${rowIndex}`);
    const frequencyInput = habitContainer.getElementById(`HabitFreq_${rowIndex}`);
    const timescaleInput = habitContainer.getElementById(`dropdown_${rowIndex}`)
    // const timescaleInput = document.getElementById(`HabitFreq_${rowIndex}`);

    var habitName = habitNameInput.value;
    var habitDesc = habitDescInput.value;
    var frequency = frequencyInput.value;
    var timescale = timescaleInput.value;

    const habit = habitsData.filter(c=>c.id === habitId)[0];
    if (habitName === "")
    {
    habitName = habit.name;
    }
    if (habitDesc === "")
    {
    habitDesc = habit.desc;
    }
    if (frequency === "")
    {
    frequency = habit.frequency;
    }

    const habitData = {
    habitName,
    habitDesc,
    frequency,
    timescale,
    cat
    };
    put(`/api/habits/${habitId}`,habitData);
    refreshTable();
}

function confirmRowCreation(rowIndex,cat) {
    const habitContainer = habitContainers[cat];
    const habitsTableBody = habitContainer.getElementById(`habitsTableBody_${cat}`);

    console.log("value is:",rowIndex)


    const habitNameInput = habitContainer.getElementById(`HabitName_${rowIndex}`);
    const habitDescInput = habitContainer.getElementById(`HabitDesc_${rowIndex}`);
    const frequencyInput = habitContainer.getElementById(`HabitFreq_${rowIndex}`);
    const timescaleInput = habitContainer.getElementById(`dropdown_${rowIndex}`)

    const habitName = habitNameInput.value;
    const habitDesc = habitDescInput.value;
    const frequency = frequencyInput.value;
    const timescale = timescaleInput.value;

    console.log('Habit data to be sent:', { habitName, habitDesc, frequency });


    const habitData = {
    habitName,
    habitDesc,
    frequency,
    timescale,
    cat
    };
    // var habitId = containsName(habitsData,habitName);
    // if (habitId >-1) {
    //     putHabit(habitId,habitData);
    //     return;
    // }
    // Send the habit information to the server to create the habit
    fetch('/api/habits', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(habitData)
    })
    .then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
    })
    .then(data => {
    console.log('Habit created successfully:', data);
    // Remove the row from the table
    //newRow.remove();
    })
    .catch(error => console.error('Error creating habit:', error));
refreshTable();
}

function deleteButton(habitsid)
{
const query_data = {habitsid};
fetch('/api/habits', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(query_data)
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
.then(data => {
  console.log('Habit deleted successfully:', data);
  refreshTable();
  // Remove the row from the table
  //newRow.remove();
})
.catch(error => console.error('Error deleting habit:', error));
}

// function editHabit(habitsid)
// {
// const query_data = {habitsid};
// fetch('/api/habits', {
//   method: 'PUT',
//   headers: {
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify(query_data)
// })
// .then(response => {
//   if (!response.ok) {
//     throw new Error('Network response was not ok');
//   }
//   return response.json();
// })
// .then(data => {
//   console.log('Habit edited successfully:', data);
//   refreshTable();
//   // Remove the row from the table
//   //newRow.remove();
// })
// .catch(error => console.error('Error deleting habit:', error));
// }



function cancelRowCreation(rowIndex) {
    // const rowToRemove = event.target.closest('tr');
    // rowToRemove.remove();
  // Remove the new row
    refreshTable();
  }

  async function refreshTable(){
    fetchHabits().then(()=> updateHabitCounts());

    //renderHabits();
    
  }

  function toggleVisibility(title)
  {
    if (visibilities[title] === "block")
    {
        visibilities[title] = "none";
    }
    else
    {
    visibilities[title] = "block";
    }
    refreshTable();
  }

  // Call the fetchHabits function to populate the table
    // fetchHabits();

    // // Initial rendering of habits and counts
    // renderHabits();
    // updateHabitCounts();

class HabitsTable extends HTMLElement {
    constructor(title) {
        super();
        
        const shadow = this.attachShadow({ mode: 'open' });
        // const title = title;
        const template = document.createElement('template');
        template.innerHTML = `
        <button onclick="toggleVisibility('${title}')">hide</button>
        <div id="habitsList_${title}">
        <h2>${title}</h2>
        <button onclick="addNewRow('${title}')">+</button>
        
        <table>
        <thead>
            <tr>
            <th>Habit Name</th>
            <th>Habit Description</th>
            <th>Frequency</th>
            <th>Timescale (per)</th>
            <th> Completed</th>
            <th> Count</th>
            <th> Reset Count</th>
            <th> Delete</th>
            <th> Edit </th>
            </tr>
        </thead>
        <tbody id="habitsTableBody_${title}">
            <!-- Habit data will be displayed here -->
        </tbody>
        </table>
        <h2>Habit Counts</h2>
        <div>
        <span>Total Habits: <span id="totalHabits">0</span></span>
        <span>Completed: <span id="completedHabits">0</span></span>
        <span>Not Completed: <span id="notCompletedHabits">0</span></span>
        </div>
    </div>
        `;
    
        const templateContent = template.content.cloneNode(true);
        shadow.appendChild(templateContent);
    }

    getElementById(id) {
        return this.shadowRoot.getElementById(id);
    }


    row_template(habit)
    {
        const habitRow = document.createElement('tr');
        // habitRow.classList.add('green-row');
        habitRow.id = habit.idhabit;
        //habitRow.className = 'blank-row';

        if (habit.habit_done)
        {
        habitRow.style.backgroundColor = "lightgreen";
        }
        else
        {
        }
        
        habitRow.innerHTML = `
        <td>${habit.habit_name}</td>
        <td>${habit.habit_desc}</td>
        <td>${habit.frequency}</td>
        <td>${habit.timescale}</td>
        <td><button onclick="toggleHabitStatus(${habit.idhabit})">Done</button></td>
        <td>${habit.count}</td>
        <td><button onclick="resetHabitCount(${habit.idhabit})">Reset</button></td>
        <td><button onclick="deleteButton(${habit.idhabit})">&#128465</button></td>
        <td><button onclick="editCurrentRow(${habit.idhabit})">&#128393</button></td>
        `;
        return habitRow;
    }
    
}