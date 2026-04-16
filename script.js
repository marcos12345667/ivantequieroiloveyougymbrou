const mealNames = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
let db = JSON.parse(localStorage.getItem('ironEliteDB')) || {};

const dateInput = document.getElementById('date-selector');
dateInput.value = new Date().toISOString().split('T')[0];

document.getElementById('add-ex-btn').onclick = addExercise;
dateInput.onchange = loadDay;

function init() { loadDay(); }

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

function renderMeals() {
    const date = dateInput.value;
    const container = document.getElementById('meal-container');
    container.innerHTML = db[date].meals.map((meal, i) => `
        <div class="glass-card p-4 space-y-3">
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
                <span class="text-[10px] font-black accent-red uppercase italic">${meal.name}</span>
                <input type="text" value="${meal.food || ''}" placeholder="¿Qué has comido?" 
                    oninput="updateMeal(${i}, 'food', this.value)" 
                    class="bg-transparent border-none text-xs font-semibold text-right w-2/3 p-0 focus:ring-0">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] text-gray-600 text-center font-bold">P</span>
                    <input type="number" value="${meal.p}" oninput="updateMeal(${i}, 'p', this.value)" class="text-center py-2 text-xs font-bold">
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] text-gray-600 text-center font-bold">C</span>
                    <input type="number" value="${meal.c}" oninput="updateMeal(${i}, 'c', this.value)" class="text-center py-2 text-xs font-bold">
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] text-gray-600 text-center font-bold">G</span>
                    <input type="number" value="${meal.f || meal.g || 0}" oninput="updateMeal(${i}, 'f', this.value)" class="text-center py-2 text-xs font-bold">
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] text-red-900 text-center font-black italic">KCAL</span>
                    <input type="number" value="${meal.k}" oninput="updateMeal(${i}, 'k', this.value)" class="text-center py-2 text-xs font-black border-red-900/20">
                </div>
            </div>
        </div>
    `).join('');
}

function updateMeal(i, field, val) {
    db[dateInput.value].meals[i][field] = field === 'food' ? val : (parseFloat(val) || 0);
    save(); calculateTotals();
}

function calculateTotals() {
    const day = db[dateInput.value];
    const t = day.meals.reduce((a, b) => ({
        p: a.p + (parseFloat(b.p) || 0), c: a.c + (parseFloat(b.c) || 0), f: a.f + (parseFloat(b.f) || 0), k: a.k + (parseFloat(b.k) || 0)
    }), { p: 0, c: 0, f: 0, k: 0 });
    document.getElementById('t-p').innerText = t.p + 'g';
    document.getElementById('t-c').innerText = t.c + 'g';
    document.getElementById('t-g').innerText = t.f + 'g';
    document.getElementById('t-k').innerText = t.k;
}

function addExercise() {
    db[dateInput.value].exercises.push({ name: "NUEVO EJERCICIO", sets: [{ kg: 0, reps: 0 }] });
    save(); renderWorkout();
}

function renderWorkout() {
    const date = dateInput.value;
    const container = document.getElementById('workout-container');
    container.innerHTML = (db[date].exercises || []).map((ex, exIdx) => `
        <div class="glass-card p-4 space-y-4 border-l-4 border-red-600">
            <div class="flex justify-between items-center">
                <input type="text" value="${ex.name}" oninput="db['${date}'].exercises[${exIdx}].name=this.value; save()" 
                    class="bg-transparent border-none p-0 text-base font-black uppercase italic w-full focus:ring-0">
                <button onclick="removeEx(${exIdx})" class="text-gray-700 hover:text-red-500 ml-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="space-y-2">
                <div class="grid grid-cols-4 gap-2 table-header text-center"><span>Serie</span><span>Kg</span><span>Reps</span><span></span></div>
                ${ex.sets.map((set, sIdx) => `
                    <div class="grid grid-cols-4 gap-2 items-center">
                        <div class="text-[10px] text-gray-500 font-bold bg-white/5 py-2 rounded text-center">${sIdx+1}</div>
                        <input type="number" value="${set.kg}" oninput="updateSet(${exIdx}, ${sIdx}, 'kg', this.value)" class="text-center text-xs py-2 font-bold">
                        <input type="number" value="${set.reps}" oninput="updateSet(${exIdx}, ${sIdx}, 'reps', this.value)" class="text-center text-xs py-2 font-bold">
                        <button onclick="removeSet(${exIdx}, ${sIdx})" class="text-gray-800 hover:text-red-500 flex justify-center"><i data-lucide="x-circle" class="w-4 h-4"></i></button>
                    </div>
                `).join('')}
            </div>
            <button onclick="addSet(${exIdx})" class="w-full py-2 bg-white/5 border border-dashed border-gray-800 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest">+ Añadir Serie</button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addSet(exIdx) { db[dateInput.value].exercises[exIdx].sets.push({ kg: 0, reps: 0 }); save(); renderWorkout(); }
function updateSet(exIdx, sIdx, f, v) { db[dateInput.value].exercises[exIdx].sets[sIdx][f] = parseFloat(v) || 0; save(); }
function removeSet(exIdx, sIdx) { db[dateInput.value].exercises[exIdx].sets.splice(sIdx, 1); save(); renderWorkout(); }
function removeEx(exIdx) { if(confirm('¿Eliminar ejercicio?')) { db[dateInput.value].exercises.splice(exIdx, 1); save(); renderWorkout(); } }
function save() { localStorage.setItem('ironEliteDB', JSON.stringify(db)); }

init();
