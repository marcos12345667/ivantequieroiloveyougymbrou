const mealNames = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
let db = JSON.parse(localStorage.getItem('ironEliteDB')) || {};

const dateInput = document.getElementById('date-selector');
dateInput.value = new Date().toISOString().split('T')[0];

function init() {
    loadDay();
    lucide.createIcons();
}

function loadDay() {
    const date = dateInput.value;
    if (!db[date]) {
        db[date] = {
            meals: mealNames.map(name => ({ name, food: "", p: 0, c: 0, f: 0, k: 0 })),
            exercises: []
        };
    }
    renderMeals();
    renderWorkout();
    calculateTotals();
}

// --- LÓGICA DE NUTRICIÓN ---
function renderMeals() {
    const date = dateInput.value;
    const container = document.getElementById('meal-container');
    container.innerHTML = db[date].meals.map((meal, i) => `
        <div class="glass-card p-3 rounded-lg flex flex-col gap-2">
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-black accent-red tracking-tighter">${meal.name}</span>
                <input type="text" value="${meal.food}" placeholder="Ej: Pollo y Arroz" 
                    onchange="updateMeal(${i}, 'food', this.value)" class="w-1/2 text-right bg-transparent border-none text-xs">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <input type="number" value="${meal.p}" placeholder="P" onchange="updateMeal(${i}, 'p', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.c}" placeholder="C" onchange="updateMeal(${i}, 'c', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.f}" placeholder="G" onchange="updateMeal(${i}, 'f', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.k}" placeholder="Kcal" onchange="updateMeal(${i}, 'k', this.value)" class="text-center text-xs border-red-900/30">
            </div>
        </div>
    `).join('');
}

function updateMeal(i, field, val) {
    db[dateInput.value].meals[i][field] = field === 'food' ? val : parseFloat(val) || 0;
    save(); calculateTotals();
}

function calculateTotals() {
    const day = db[dateInput.value];
    const t = day.meals.reduce((a, b) => ({ p: a.p + b.p, c: a.c + b.c, f: a.f + b.f, k: a.k + b.k }), { p:0, c:0, f:0, k:0 });
    document.getElementById('t-p').innerText = t.p + 'g';
    document.getElementById('t-c').innerText = t.c + 'g';
    document.getElementById('t-g').innerText = t.g + 'g';
    document.getElementById('t-k').innerText = t.k;
}

// --- LÓGICA DE GIMNASIO (ESTILO HEAVY) ---
function addExercise() {
    db[dateInput.value].exercises.push({ name: "Nuevo Ejercicio", sets: [{ kg: 0, reps: 0 }] });
    save(); renderWorkout();
}

function addSet(exIdx) {
    db[dateInput.value].exercises[exIdx].sets.push({ kg: 0, reps: 0 });
    save(); renderWorkout();
}

function updateSet(exIdx, setIdx, field, val) {
    db[dateInput.value].exercises[exIdx].sets[setIdx][field] = parseFloat(val) || 0;
    save();
}

function renderWorkout() {
    const container = document.getElementById('workout-container');
    const exercises = db[dateInput.value].exercises;
    
    container.innerHTML = exercises.map((ex, exIdx) => `
        <div class="glass-card p-4 rounded-xl space-y-3 border-l-4 border-red-600">
            <input type="text" value="${ex.name}" onchange="db['${dateInput.value}'].exercises[${exIdx}].name=this.value; save()" 
                class="font-black italic uppercase bg-transparent border-none p-0 text-white focus:ring-0">
            
            <div class="w-full">
                <div class="grid grid-cols-4 mb-2 table-header text-center">
                    <span>Serie</span><span>Kg</span><span>Reps</span><span></span>
                </div>
                ${ex.sets.map((set, setIdx) => `
                    <div class="grid grid-cols-4 gap-2 mb-2 items-center">
                        <div class="text-center text-xs font-bold text-gray-500">${setIdx + 1}</div>
                        <input type="number" value="${set.kg}" onchange="updateSet(${exIdx}, ${setIdx}, 'kg', this.value)" class="text-center text-xs">
                        <input type="number" value="${set.reps}" onchange="updateSet(${exIdx}, ${setIdx}, 'reps', this.value)" class="text-center text-xs">
                        <button onclick="removeSet(${exIdx}, ${setIdx})" class="text-[10px] text-gray-600 hover:text-red-500">Eliminar</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="addSet(${exIdx})" class="w-full py-1 border border-dashed border-gray-700 rounded text-[10px] text-gray-500 hover:border-red-500 hover:text-red-500 transition-all">
                + AÑADIR SERIE
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function removeSet(exIdx, setIdx) {
    db[dateInput.value].exercises[exIdx].sets.splice(setIdx, 1);
    save(); renderWorkout();
}

function save() { localStorage.setItem('ironEliteDB', JSON.stringify(db)); }

init();
