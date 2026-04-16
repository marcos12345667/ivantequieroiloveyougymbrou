const meals = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"];
let data = JSON.parse(localStorage.getItem('gymData')) || {
    macros: { p: 0, c: 0, f: 0, k: 0 },
    workouts: []
};

// Inicializar Iconos
lucide.createIcons();

function init() {
    const container = document.getElementById('meal-container');
    container.innerHTML = '';

    meals.forEach(meal => {
        const div = document.createElement('div');
        div.className = "glass-card p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-colors";
        div.innerHTML = `
            <span class="font-bold text-gray-300 w-32">${meal}</span>
            <div class="grid grid-cols-4 gap-2 w-full max-w-md text-center">
                <input type="number" placeholder="P" class="input-dark text-xs p-1 text-center" onchange="updateMacros()">
                <input type="number" placeholder="C" class="input-dark text-xs p-1 text-center" onchange="updateMacros()">
                <input type="number" placeholder="G" class="input-dark text-xs p-1 text-center" onchange="updateMacros()">
                <input type="number" placeholder="Kcal" class="input-dark text-xs p-1 text-center border-red-900" onchange="updateMacros()">
            </div>
        `;
        container.appendChild(div);
    });
    
    renderWorkouts();
}

function updateMacros() {
    let p=0, c=0, f=0, k=0;
    document.querySelectorAll('input[type="number"]').forEach((input, index) => {
        const val = parseFloat(input.value) || 0;
        if(index % 4 === 0) p += val;
        if(index % 4 === 1) c += val;
        if(index % 4 === 2) f += val;
        if(index % 4 === 3) k += val;
    });

    // Animación de números rápida
    document.getElementById('prot-total').innerText = `${p}g`;
    document.getElementById('carb-total').innerText = `${c}g`;
    document.getElementById('fat-total').innerText = `${f}g`;
    document.getElementById('kcal-total').innerText = k;
}

function addWorkout() {
    const input = document.getElementById('workout-input');
    if(input.value.trim() === "") return;
    
    data.workouts.unshift({
        id: Date.now(),
        text: input.value,
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    
    input.value = "";
    save();
    renderWorkouts();
}

function renderWorkouts() {
    const list = document.getElementById('workout-list');
    list.innerHTML = data.workouts.map(w => `
        <li class="flex justify-between items-center bg-white/5 p-3 rounded-lg border-l-4 border-red-500 animate-in fade-in slide-in-from-left duration-300">
            <span class="text-sm">${w.text}</span>
            <span class="text-[10px] text-gray-500 font-mono">${w.date}</span>
        </li>
    `).join('');
}

function save() {
    localStorage.setItem('gymData', JSON.stringify(data));
}

init();
