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
        <div class="glass-card p-4 space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-black accent-red uppercase tracking-tighter italic">${meal.name}</span>
                <input type="text" value="${meal.food || ''}" placeholder="Nombre de la comida" oninput="updateMeal(${i}, 'food', this.value)" class="bg-transparent border-none text-right text-xs p-0 w-1/2 focus:ring-0 italic">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <div class="flex flex-col gap-1"><span class="text-[8px] text-gray-600 text-center font-bold">P</span><input type="number" value="${meal.p}" oninput="updateMeal(${i}, 'p', this.value)" class="text-center text-xs py-2"></div>
                <div class="flex flex-col gap-1"><span class="text-[8px] text-gray-600 text-center font-bold">C</span><input type="number" value="${meal.c}" oninput="updateMeal(${i}, 'c', this.value)" class="text-center text-xs py-2"></div>
                <div class="flex flex-col gap-1"><span class="text-[8px] text-gray-600 text-center font-bold">G</span><input type="number" value="${meal.f || 0}" oninput="updateMeal(${i}, 'f', this.value)" class="text-center text-xs py-2"></div>
                <div class="flex flex-col gap-1"><span class="text-[8px] text-red-900 text-center font-black italic italic">KCAL</span><input type="number" value="${meal.k}" oninput="updateMeal(${i}, 'k', this.value)" class="text-center text-xs py-2 border-red-900/20 font-black"></div>
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
    document.getElementById('t-p').innerText = Math.round(t.p);
    document.getElementById('t-c').innerText = Math.round(t.c);
    document.getElementById('t-g').innerText = Math.round(t.f);
    document.getElementById('t-k').innerText = Math.round(t.k);
}

function addExercise() {
    db[dateInput.value].exercises.push({ name: "NUEVO EJERCICIO", sets: [{ kg: 0, reps: 0 }] });
    save(); renderWorkout();
}

function renderWorkout() {
    const date = dateInput.value;
    const container = document.getElementById('workout-container');
    container.innerHTML = (db[date].exercises || []).map((ex, exIdx) => `
        <div class="glass-card p-5 space-y-4 border-l-2 border-red-600">
            <div class="flex justify-between items-center">
                <input type="text" value="${ex.name}" oninput="db['${date}'].exercises[${exIdx}].name=this.value; save()" class="bg-transparent border-none p-0 font-black uppercase italic text-sm w-full focus:ring-0">
                <button onclick="removeEx(${exIdx})" class="text-gray-700 hover:text-red-500 ml-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="space-y-2">
                <div class="grid grid-cols-4 gap-2 table-header text-center"><span>Serie</span><span>Peso</span><span>Reps</span><span></span></div>
                ${ex.sets.map((set, sIdx) => `
                    <div class="grid grid-cols-4 gap-2 items-center">
                        <div class="text-[10px] text-gray-500 font-black bg-white/5 py-2 rounded text-center">${sIdx+1}</div>
                        <input type="number" value="${set.kg}" oninput="updateSet(${exIdx}, ${sIdx}, 'kg', this.value)" class="text-center text-xs py-2 font-bold" placeholder="Kg">
                        <input type="number" value="${set.reps}" oninput="updateSet(${exIdx}, ${sIdx}, 'reps', this.value)" class="text-center text-xs py-2 font-bold" placeholder="Reps">
                        <button onclick="removeSet(${exIdx}, ${sIdx})" class="flex justify-center"><i data-lucide="x-circle" class="w-4 h-4 text-gray-800 hover:text-red-500"></i></button>
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

async function analyzeWorkout() {
    const date = dateInput.value;
    const exercises = db[date]?.exercises || [];
    const responseDiv = document.getElementById('ai-response');
    const card = document.getElementById('ai-result-card');
    if (exercises.length === 0) return alert("Registra tu entrenamiento primero.");
    card.classList.remove('hidden');
    responseDiv.innerText = "Sincronizando con Iron Intelligence...";
    const dataText = exercises.map(ex => `${ex.name}: ${ex.sets.map(s => s.kg+"kg x "+s.reps).join(", ")}`).join("\n");
    const prompt = `Analiza este entreno de fuerza: ${dataText}. Dame puntuación (1-10), resumen y consejo. Tono motivador y agresivo tipo coach de élite. Max 60 palabras.`;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        responseDiv.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) {
        responseDiv.innerText = "Fallo de conexión. El servidor de IA está saturado.";
    }
}

function save() { localStorage.setItem('ironEliteDB', JSON.stringify(db)); }
init();
