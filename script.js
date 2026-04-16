const mealNames = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
let db = JSON.parse(localStorage.getItem('ironEliteDB')) || {};
const GEMINI_API_KEY = "AQ.Ab8RN6IUnh3CWttuuTxhkn6Jo_LHeqVbiq1OKD8MgtP9uEQsuQ"; 

const dateInput = document.getElementById('date-selector');
dateInput.value = new Date().toISOString().split('T')[0];

document.getElementById('add-ex-btn').onclick = addExercise;
document.getElementById('finish-btn').onclick = analyzeWorkout;
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
        <div class="space-y-2">
            <div class="flex justify-between items-center px-1">
                <span class="text-[10px] font-black accent-red uppercase italic w-24">${meal.name}</span>
                <input type="text" value="${meal.food || ''}" placeholder="Nombre de la comida" oninput="updateMeal(${i}, 'food', this.value)" class="bg-transparent border-none text-right text-xs p-0 flex-1 italic text-gray-400">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <input type="number" value="${meal.p}" placeholder="P" oninput="updateMeal(${i}, 'p', this.value)" class="text-center text-xs py-1.5">
                <input type="number" value="${meal.c}" placeholder="C" oninput="updateMeal(${i}, 'c', this.value)" class="text-center text-xs py-1.5">
                <input type="number" value="${meal.f || 0}" placeholder="G" oninput="updateMeal(${i}, 'f', this.value)" class="text-center text-xs py-1.5">
                <input type="number" value="${meal.k}" placeholder="Kcal" oninput="updateMeal(${i}, 'k', this.value)" class="text-center text-xs py-1.5 border-red-900/20 font-bold">
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
    document.getElementById('t-p').innerText = t.p;
    document.getElementById('t-c').innerText = t.c;
    document.getElementById('t-g').innerText = t.f;
    document.getElementById('t-k').innerText = t.k;
}

function addExercise() {
    db[dateInput.value].exercises.push({ name: "EJERCICIO", sets: [{ kg: 0, reps: 0 }] });
    save(); renderWorkout();
}

function renderWorkout() {
    const date = dateInput.value;
    const container = document.getElementById('workout-container');
    container.innerHTML = (db[date].exercises || []).map((ex, exIdx) => `
        <div class="glass-card p-4 space-y-3 border-l-2 border-red-600">
            <div class="flex justify-between items-center">
                <input type="text" value="${ex.name}" oninput="db['${date}'].exercises[${exIdx}].name=this.value; save()" class="bg-transparent border-none p-0 font-bold uppercase italic text-sm w-full">
                <button onclick="removeEx(${exIdx})" class="text-gray-700 hover:text-red-500 ml-2"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
            <div class="space-y-2">
                ${ex.sets.map((set, sIdx) => `
                    <div class="grid grid-cols-4 gap-2 items-center">
                        <div class="text-[10px] text-gray-500 font-bold text-center">${sIdx+1}</div>
                        <input type="number" value="${set.kg}" oninput="updateSet(${exIdx}, ${sIdx}, 'kg', this.value)" class="text-center text-xs py-1" placeholder="Kg">
                        <input type="number" value="${set.reps}" oninput="updateSet(${exIdx}, ${sIdx}, 'reps', this.value)" class="text-center text-xs py-1" placeholder="Reps">
                        <button onclick="removeSet(${exIdx}, ${sIdx})" class="text-center"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-gray-800 hover:text-red-500"></i></button>
                    </div>
                `).join('')}
            </div>
            <button onclick="addSet(${exIdx})" class="w-full py-1.5 bg-white/5 border border-dashed border-gray-800 rounded-lg text-[9px] font-bold text-gray-500 uppercase">+ Serie</button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addSet(exIdx) { db[dateInput.value].exercises[exIdx].sets.push({ kg: 0, reps: 0 }); save(); renderWorkout(); }
function updateSet(exIdx, sIdx, f, v) { db[dateInput.value].exercises[exIdx].sets[sIdx][f] = parseFloat(v) || 0; save(); }
function removeSet(exIdx, sIdx) { db[dateInput.value].exercises[exIdx].sets.splice(sIdx, 1); save(); renderWorkout(); }
function removeEx(exIdx) { if(confirm('¿Borrar ejercicio?')) { db[dateInput.value].exercises.splice(exIdx, 1); save(); renderWorkout(); } }

async function analyzeWorkout() {
    const date = dateInput.value;
    const exercises = db[date]?.exercises || [];
    const responseDiv = document.getElementById('ai-response');
    const card = document.getElementById('ai-result-card');
    
    if (exercises.length === 0) return alert("Registra tu entrenamiento primero.");

    card.classList.remove('hidden');
    responseDiv.innerText = "Analizando tu esfuerzo...";

    const dataText = exercises.map(ex => `${ex.name}: ${ex.sets.map(s => s.kg+"kg x "+s.reps).join(", ")}`).join("\n");
    const prompt = `Analiza este entreno de fuerza: ${dataText}. Puntuación 1-10, resumen y consejo. Tono motivador y agresivo. Max 50 palabras.`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        responseDiv.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) {
        responseDiv.innerText = "Error de conexión con la IA.";
    }
}

function save() { localStorage.setItem('ironEliteDB', JSON.stringify(db)); }
init();const mealNames = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
let db = JSON.parse(localStorage.getItem('ironEliteDB')) || {};

const GEMINI_API_KEY = "AQ.Ab8RN6IUnh3CWttuuTxhkn6Jo_LHeqVbiq1OKD8MgtP9uEQsuQ"; 

const dateInput = document.getElementById('date-selector');
dateInput.value = new Date().toISOString().split('T')[0];

document.getElementById('add-ex-btn').onclick = addExercise;
document.getElementById('finish-btn').onclick = analyzeWorkout;
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
        <div class="glass-card p-4 flex flex-col gap-3">
            <div class="flex justify-between items-center border-b border-white/5 pb-1">
                <span class="text-[10px] font-black accent-red uppercase">${meal.name}</span>
                <input type="text" value="${meal.food || ''}" placeholder="¿Qué has comido?" oninput="updateMeal(${i}, 'food', this.value)" class="bg-transparent border-none text-right text-xs p-0 w-1/2">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <input type="number" value="${meal.p}" placeholder="P" oninput="updateMeal(${i}, 'p', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.c}" placeholder="C" oninput="updateMeal(${i}, 'c', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.f || meal.g || 0}" placeholder="G" oninput="updateMeal(${i}, 'f', this.value)" class="text-center text-xs">
                <input type="number" value="${meal.k}" placeholder="Kcal" oninput="updateMeal(${i}, 'k', this.value)" class="text-center text-xs border-red-900/30">
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
    document.getElementById('t-p').innerText = t.p;
    document.getElementById('t-c').innerText = t.c;
    document.getElementById('t-g').innerText = t.f;
    document.getElementById('t-k').innerText = t.k;
}

function addExercise() {
    db[dateInput.value].exercises.push({ name: "EJERCICIO", sets: [{ kg: 0, reps: 0 }] });
    save(); renderWorkout();
}

function renderWorkout() {
    const date = dateInput.value;
    const container = document.getElementById('workout-container');
    container.innerHTML = (db[date].exercises || []).map((ex, exIdx) => `
        <div class="glass-card p-4 space-y-3 border-l-2 border-red-600">
            <div class="flex justify-between items-center">
                <input type="text" value="${ex.name}" oninput="db['${date}'].exercises[${exIdx}].name=this.value; save()" class="bg-transparent border-none p-0 font-bold uppercase italic text-sm">
                <button onclick="removeEx(${exIdx})" class="text-gray-600 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="space-y-2">
                ${ex.sets.map((set, sIdx) => `
                    <div class="grid grid-cols-4 gap-2 items-center">
                        <div class="text-[10px] text-gray-500 text-center font-bold">${sIdx+1}</div>
                        <input type="number" value="${set.kg}" oninput="updateSet(${exIdx}, ${sIdx}, 'kg', this.value)" class="text-center text-xs py-1" placeholder="Kg">
                        <input type="number" value="${set.reps}" oninput="updateSet(${exIdx}, ${sIdx}, 'reps', this.value)" class="text-center text-xs py-1" placeholder="Reps">
                        <button onclick="removeSet(${exIdx}, ${sIdx})" class="text-[8px] text-gray-700 uppercase font-bold">Quitar</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="addSet(${exIdx})" class="w-full py-2 bg-white/5 border border-dashed border-gray-800 rounded-lg text-[9px] font-bold text-gray-500">+ SERIE</button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addSet(exIdx) { db[dateInput.value].exercises[exIdx].sets.push({ kg: 0, reps: 0 }); save(); renderWorkout(); }
function updateSet(exIdx, sIdx, f, v) { db[dateInput.value].exercises[exIdx].sets[sIdx][f] = parseFloat(v) || 0; save(); }
function removeSet(exIdx, sIdx) { db[dateInput.value].exercises[exIdx].sets.splice(sIdx, 1); save(); renderWorkout(); }
function removeEx(exIdx) { if(confirm('¿Borrar ejercicio?')) { db[dateInput.value].exercises.splice(exIdx, 1); save(); renderWorkout(); } }

async function analyzeWorkout() {
    const date = dateInput.value;
    const exercises = db[date]?.exercises || [];
    if (exercises.length === 0) return alert("Sube el peso primero.");

    const card = document.getElementById('ai-result-card');
    const responseDiv = document.getElementById('ai-response');
    
    card.classList.remove('hidden');
    responseDiv.innerText = "Pensando...";

    const workoutData = exercises.map(ex => `${ex.name}: ${ex.sets.map(s => s.kg+"kg x "+s.reps).join(", ")}`).join("\n");
    const prompt = `Analiza este entreno: ${workoutData}. Dame puntuación (1-10), un resumen y un consejo. Máximo 50 palabras. Tono de gimnasio profesional y motivador.`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        responseDiv.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) {
        responseDiv.innerText = "Error de conexión con la IA.";
    }
}

function save() { localStorage.setItem('ironEliteDB', JSON.stringify(db)); }
init();const mealNames = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
let db = JSON.parse(localStorage.getItem('ironEliteDB')) || {};

// CONFIGURACIÓN IA GEMINI
const GEMINI_API_KEY = "AQ.Ab8RN6IUnh3CWttuuTxhkn6Jo_LHeqVbiq1OKD8MgtP9uEQsuQ"; 

const dateInput = document.getElementById('date-selector');
dateInput.value = new Date().toISOString().split('T')[0];

// Listeners
document.getElementById('add-ex-btn').onclick = addExercise;
document.getElementById('finish-btn').onclick = analyzeWorkout;
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

// --- NUTRICIÓN ---
function renderMeals() {
    const date = dateInput.value;
    const container = document.getElementById('meal-container');
    container.innerHTML = db[date].meals.map((meal, i) => `
        <div class="glass-card p-4 space-y-3">
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
                <span class="text-[10px] font-black text-red-600 italic uppercase">${meal.name}</span>
                <input type="text" value="${meal.food || ''}" placeholder="¿Qué has comido?" 
                    oninput="updateMeal(${i}, 'food', this.value)" 
                    class="bg-transparent border-none text-xs font-semibold text-right w-2/3 p-0 focus:ring-0">
            </div>
            <div class="grid grid-cols-4 gap-2 text-center">
                <div class="flex flex-col"><span class="text-[8px] text-gray-600 font-bold uppercase">P</span><input type="number" value="${meal.p}" oninput="updateMeal(${i}, 'p', this.value)" class="text-center py-2 text-xs font-bold"></div>
                <div class="flex flex-col"><span class="text-[8px] text-gray-600 font-bold uppercase">C</span><input type="number" value="${meal.c}" oninput="updateMeal(${i}, 'c', this.value)" class="text-center py-2 text-xs font-bold"></div>
                <div class="flex flex-col"><span class="text-[8px] text-gray-600 font-bold uppercase">G</span><input type="number" value="${meal.f || meal.g || 0}" oninput="updateMeal(${i}, 'f', this.value)" class="text-center py-2 text-xs font-bold"></div>
                <div class="flex flex-col"><span class="text-[8px] text-red-900 font-black italic">KCAL</span><input type="number" value="${meal.k}" oninput="updateMeal(${i}, 'k', this.value)" class="text-center py-2 text-xs font-black border-red-900/30"></div>
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
        p: a.p + (parseFloat(b.p) || 0), 
        c: a.c + (parseFloat(b.c) || 0), 
        f: a.f + (parseFloat(b.f || b.g) || 0), 
        k: a.k + (parseFloat(b.k) || 0)
    }), { p: 0, c: 0, f: 0, k: 0 });
    document.getElementById('t-p').innerText = Math.round(t.p);
    document.getElementById('t-c').innerText = Math.round(t.c);
    document.getElementById('t-g').innerText = Math.round(t.f);
    document.getElementById('t-k').innerText = Math.round(t.k);
}

// --- EJERCICIOS ---
function addExercise() {
    db[dateInput.value].exercises.push({ name: "NUEVO EJERCICIO", sets: [{ kg: 0, reps: 0 }] });
    save(); renderWorkout();
}

function renderWorkout() {
    const date = dateInput.value;
    const container = document.getElementById('workout-container');
    container.innerHTML = (db[date].exercises || []).map((ex, exIdx) => `
        <div class="glass-card p-4 space-y-4 border-l-2 border-red-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="flex justify-between items-center gap-4">
                <input type="text" value="${ex.name}" oninput="db['${date}'].exercises[${exIdx}].name=this.value; save()" class="bg-transparent border-none p-0 text-base font-black uppercase italic w-full">
                <button onclick="removeEx(${exIdx})" class="text-gray-700 hover:text-red-500"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
            <div class="space-y-2">
                ${ex.sets.map((set, sIdx) => `
                    <div class="grid grid-cols-4 gap-2 items-center text-center">
                        <div class="text-[10px] font-bold text-gray-500 bg-white/5 py-2 rounded">${sIdx + 1}</div>
                        <input type="number" value="${set.kg}" oninput="updateSet(${exIdx}, ${sIdx}, 'kg', this.value)" class="text-center py-2 text-sm font-bold" placeholder="Kg">
                        <input type="number" value="${set.reps}" oninput="updateSet(${exIdx}, ${sIdx}, 'reps', this.value)" class="text-center py-2 text-sm font-bold" placeholder="Reps">
                        <button onclick="removeSet(${exIdx}, ${sIdx})" class="flex justify-center text-gray-700 hover:text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                `).join('')}
            </div>
            <button onclick="addSet(${exIdx})" class="w-full py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">+ AÑADIR SERIE</button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addSet(exIdx) { db[dateInput.value].exercises[exIdx].sets.push({ kg: 0, reps: 0 }); save(); renderWorkout(); }
function updateSet(exIdx, sIdx, f, v) { db[dateInput.value].exercises[exIdx].sets[sIdx][f] = parseFloat(v) || 0; save(); }
function removeSet(exIdx, sIdx) { db[dateInput.value].exercises[exIdx].sets.splice(sIdx, 1); save(); renderWorkout(); }
function removeEx(exIdx) { if(confirm('¿Eliminar ejercicio?')) { db[dateInput.value].exercises.splice(exIdx, 1); save(); renderWorkout(); } }

// --- IA LOGIC ---
async function analyzeWorkout() {
    const date = dateInput.value;
    const exercises = db[date]?.exercises || [];
    if (exercises.length === 0) return alert("Registra tu esfuerzo primero.");

    document.getElementById('ai-modal').classList.remove('hidden');
    const responseDiv = document.getElementById('ai-response');
    responseDiv.innerText = "...";

    const workoutText = exercises.map(ex => `${ex.name}: ${ex.sets.map(s => s.kg+"kg x "+s.reps).join(", ")}`).join("\n");
    const prompt = `Analiza este entreno de gimnasio como un coach motivador y experto: \n${workoutText}\n Da: 1- Puntuación (1-10). 2- Resumen rápido. 3- Un consejo para la próxima vez. Máximo 60 palabras. Tono agresivo y pro.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text:
