const mealNames = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
// Estructura de datos: { "2023-10-27": { meals: [...], workouts: [...] } }
let db = JSON.parse(localStorage.getItem('ironDB')) || {};

// Al cargar, poner la fecha de hoy
const dateInput = document.getElementById('date-selector');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

function init() {
    lucide.createIcons();
    loadDay();
}

function loadDay() {
    const date = dateInput.value;
    if (!db[date]) {
        db[date] = {
            meals: mealNames.map(name => ({ name: name, food: "", p: 0, c: 0, f: 0, k: 0 })),
            workouts: []
        };
    }
    renderMeals(db[date].meals);
    renderWorkouts(db[date].workouts);
    calculateTotals();
}

function renderMeals(meals) {
    const container = document.getElementById('meal-container');
    container.innerHTML = meals.map((meal, index) => `
        <div class="glass-card p-4 rounded-xl flex flex-col gap-4 animate-in fade-in duration-500">
            <div class="flex justify-between items-center">
                <span class="text-red-500 font-black italic uppercase text-xs">${meal.name}</span>
                <input type="text" placeholder="¿Qué has comido?" 
                    value="${meal.food}" 
                    onchange="updateMealData(${index}, 'food', this.value)"
                    class="bg-transparent border-b border-white/10 outline-none text-sm w-2/3 text-right focus:border-red-500 transition-colors">
            </div>
            <div class="grid grid-cols-4 gap-2">
                <div class="flex flex-col"><label class="text-[9px] text-gray-500 uppercase">Prot</label>
                    <input type="number" value="${meal.p}" onchange="updateMealData(${index}, 'p', this.value)" class="input-dark text-center py-1 text-sm"></div>
                <div class="flex flex-col"><label class="text-[9px] text-gray-500 uppercase">Carb</label>
                    <input type="number" value="${meal.c}" onchange="updateMealData(${index}, 'c', this.value)" class="input-dark text-center py-1 text-sm"></div>
                <div class="flex flex-col"><label class="text-[9px] text-gray-500 uppercase">Fat</label>
                    <input type="number" value="${meal.f}" onchange="updateMealData(${index}, 'f', this.value)" class="input-dark text-center py-1 text-sm"></div>
                <div class="flex flex-col"><label class="text-[9px] text-gray-500 uppercase text-red-500/50">Kcal</label>
                    <input type="number" value="${meal.k}" onchange="updateMealData(${index}, 'k', this.value)" class="input-dark text-center py-1 text-sm border-red-500/20"></div>
            </div>
        </div>
    `).join('');
}

function updateMealData(index, field, value) {
    const date = dateInput.value;
    db[date].meals[index][field] = field === 'food' ? value : parseFloat(value) || 0;
    save();
    calculateTotals();
}

function calculateTotals() {
    const date = dateInput.value;
    const totals = db[date].meals.reduce((acc, curr) => {
        acc.p += curr.p; acc.c += curr.c; acc.f += curr.f; acc.k += curr.k;
        return acc;
    }, { p: 0, c: 0, f: 0, k: 0 });

    document.getElementById('prot-total').innerText = totals.p + 'g';
    document.getElementById('carb-total').innerText = totals.c + 'g';
    document.getElementById('fat-total').innerText = totals.f + 'g';
    document.getElementById('kcal-total').innerText = totals.k;
}

function addWorkout() {
    const date = dateInput.value;
    const input = document.getElementById('workout-input');
    if (!input.value) return;

    db[date].workouts.push({
        text: input.value,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    input.value = "";
    save();
    renderWorkouts(db[date].workouts);
}

function renderWorkouts(workouts) {
    const list = document.getElementById('workout-list');
    list.innerHTML = workouts.map(w => `
        <li class="flex justify-between items-center p-3 bg-white/5 rounded-lg border-l-2 border-red-500">
            <span class="text-sm font-medium">${w.text}</span>
            <span class="text-[10px] text-gray-500 font-mono italic">${w.time}</span>
        </li>
    `).reverse().join('');
}

function save() {
    localStorage.setItem('ironDB', JSON.stringify(db));
}

init();
