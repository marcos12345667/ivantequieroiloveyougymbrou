const mealNames = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
let db = JSON.parse(localStorage.getItem('ironEliteDB')) || {};

const dateInput = document.getElementById('date-selector');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

// Event Listeners
document.getElementById('add-ex-btn').addEventListener('click', addExercise);
dateInput.addEventListener('change', loadDay);

function init() {
    loadDay();
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
    lucide.createIcons();
}

// --- NUTRICIÓN ---
function renderMeals() {
    const date = dateInput.value;
    const container = document.getElementById('meal-container');
    container.innerHTML = db[date].meals.map((meal, i) => `
        <div class="glass-card p-4 rounded-xl flex flex-col gap-3">
            <div class="flex flex-col md:flex-row justify-between gap-2">
                <span class="text-[10px] font-black accent-red uppercase italic">${meal.name}</span>
                <input type="text" value="${meal.food || ''}" placeholder="¿Qué has comido?" 
                    oninput="updateMeal(${i}, 'food', this.value)" 
                    class="bg-transparent border-b border-white/10 rounded-none p-0 text-sm focus:border-red-500 flex-1 md:max-w-[250px] md:text-right">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <input type="number" value="${meal.p}" placeholder="P" oninput="updateMeal(${i}, 'p', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.c}" placeholder="C" oninput="updateMeal(${i}, 'c', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.f}" placeholder="G" oninput="updateMeal(${i}, 'f', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.k}" placeholder="Kcal" oninput="updateMeal(${i}, 'k', this.value)" class="text-center text-xs border-red-500/20">
            </div>
        </div>
    `).join('');
}

function updateMeal(i, field, val) {
    const date = dateInput.value;
    db[date].meals[i][field] = field === 'food' ? val : (parseFloat(val) || 0);
    save();
    calculateTotals();
}

function calculateTotals() {
    const date = dateInput.value;
    const t = db[date].meals.reduce((a, b) => ({
        p: a.p + (parseFloat(b.p) || 0),
        c: a.c + (parseFloat(b.c) || 0),
        f: a.f + (parseFloat(b.f) || 0),
        k: a.k + (parseFloat(b.k) || 0)
    }), { p: 0, c: 0, f: 0, k: 0 });

    document.getElementById('t-p').innerText = t.p + 'g';
    document.getElementById('t-c').innerText = t.c + 'g';
    document.getElementById('t-g').innerText = t.g + 'g';
    document.getElementById('t-k').innerText = t.k;
}

// --- EJERCICIOS (TIPO HEAVY) ---
function addExercise() {
    const date = dateInput.value;
    db[date].exercises.push({
        name: "Nuevo Ejercicio",
        sets: [{ kg: 0, reps: 0 }]
    });
    save();
    renderWorkout();
}

function renderWorkout() {
    const date = dateInput.value;
    const container = document.getElementById('workout-container');
    const exercises = db[date].exercises || [];
    
    container.innerHTML = exercises.map((ex, exIdx) => `
        <div class="glass-card p-4 rounded-xl space-y-4 border-l-4 border-red-600 animate-in fade-in duration-300">
            <div class="flex justify-between items-center">
                <input type="text" value="${ex.name}" oninput="updateExName(${exIdx}, this.value)" 
                    class="font-black italic uppercase bg-transparent border-none p-0 text-white text-lg w-full">
                <button onclick="removeExercise(${exIdx})" class="text-gray-600 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            
            <div class="grid grid-cols-4 mb-2 table-header text-center px-2">
                <span>Set</span><span>Peso Kg</span><span>Reps</span><span></span>
            </div>
            
            <div id="sets-${exIdx}" class="space-y-2">
                ${ex.sets.map((set, setIdx) => `
                    <div class="grid grid-cols-4 gap-2 items-center">
                        <div class="text-center text-xs font-bold text-gray-600 bg-white/5 py-2 rounded">${setIdx + 1}</div>
                        <input type="number" value="${set.kg}" oninput="updateSet(${exIdx}, ${setIdx}, 'kg', this.value)" class="text-center text-sm font-bold">
                        <input type="number" value="${set.reps}" oninput="updateSet(${exIdx}, ${setIdx}, 'reps', this.value)" class="text-center text-sm font-bold">
                        <button onclick="removeSet(${exIdx}, ${setIdx})" class="text-gray-700 hover:text-red-500 text-[10px] uppercase font-bold">Quitar</button>
                    </div>
                `).join('')}
            </div>

            <button onclick="addSet(${exIdx})" class="w-full py-2 border border-dashed border-gray-800 rounded-lg text-[10px] text-gray-500 font-bold hover:bg-white/5 transition-all">
                + AÑADIR SERIE
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function updateExName(exIdx, val) {
    db[dateInput.value].exercises[exIdx].name = val;
    save();
}

function addSet(exIdx) {
    db[dateInput.value].exercises[exIdx].sets.push({ kg: 0, reps: 0 });
    save();
    renderWorkout();
}

function updateSet(exIdx, setIdx, field, val) {
    db[dateInput.value].exercises[exIdx].sets[setIdx][field] = parseFloat(val) || 0;
    save();
}

function removeSet(exIdx, setIdx) {
    db[dateInput.value].exercises[exIdx].sets.splice(setIdx, 1);
    save();
    renderWorkout();
}

function removeExercise(exIdx) {
    if(confirm('¿Eliminar ejercicio?')) {
        db[dateInput.value].exercises.splice(exIdx, 1);
        save();
        renderWorkout();
    }
}

function save() {
    localStorage.setItem('ironEliteDB', JSON.stringify(db));
}

// Iniciar app
init();
