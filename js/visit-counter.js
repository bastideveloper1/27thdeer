// Actualmente fuera de la web

// Contador de visitas global (simulado)
(function() {
    // Obtener o inicializar datos del mes global
    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const storedData = JSON.parse(localStorage.getItem('globalVisitCounter') || '{}');
    
    let currentMonth = storedData.currentMonth || monthKey;
    let count = storedData.count || 0;
    
    // Si cambió el mes, reiniciar contador a 0
    if (currentMonth !== monthKey) {
        count = 0; // Reiniciar a 0
        currentMonth = monthKey;
        localStorage.setItem('globalVisitCounter', JSON.stringify({
            currentMonth: currentMonth,
            count: count,
            lastUpdate: Date.now()
        }));
    }
    
    const counterElement = document.getElementById('counterNumber');
    
    if (!counterElement) return;
    
    // Simular incremento inicial basado en hora del día
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const hourOfDay = now.getHours();
    
    // Calcular progreso del mes (0 a 1)
    const monthProgress = currentDay / daysInMonth;
    
    // Calcular base esperado según progreso del mes y hora
    const baseVisits = Math.floor(monthProgress * 8000); // 0-8000 base
    
    // Ajustar según hora del día (más visitas en horas pico)
    let hourMultiplier = 1;
    if (hourOfDay >= 10 && hourOfDay <= 14) hourMultiplier = 1.5; // Mediodía
    else if (hourOfDay >= 18 && hourOfDay <= 22) hourMultiplier = 1.3; // Tarde/noche
    else if (hourOfDay >= 0 && hourOfDay <= 6) hourMultiplier = 0.3; // Madrugada
    
    const expectedCount = Math.floor(baseVisits * hourMultiplier);
    
    // Si el contador está muy bajo, actualizarlo al valor esperado
    if (count < expectedCount) {
        count = expectedCount + Math.floor(Math.random() * 100); // Pequeña variación
    }
    
    // Incremento por visita real
    if (count < 10000) {
        count++;
    }
    
    // Guardar en localStorage
    const data = {
        currentMonth: currentMonth,
        count: count,
        lastUpdate: Date.now()
    };
    localStorage.setItem('globalVisitCounter', JSON.stringify(data));
    
    // Actualizar display con formato
    counterElement.textContent = count.toLocaleString();
    
    // Animación inicial
    counterElement.style.opacity = '0';
    setTimeout(() => {
        counterElement.style.transition = 'opacity 0.5s ease';
        counterElement.style.opacity = '1';
    }, 100);
    
    // Incremento simulado de otros usuarios
    function simulateOtherUsers() {
        // Si ya llegamos a 10,000, no incrementar más
        if (count >= 10000) return;
        
        // Calcular días transcurridos y días totales del mes
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        
        // Calcular progreso del mes (0 a 1)
        const monthProgress = currentDay / daysInMonth;
        
        // Calcular rango máximo basado en el progreso del mes
        const maxPossible = Math.min(10000, 100 + (monthProgress * 9900)); // 100 a 10,000 gradualmente
        
        // Simular visitas de otros usuarios
        const hourOfDay = now.getHours();
        let visitProbability = 0.3; // Base 30%
        
        // Ajustar probabilidad según hora
        if (hourOfDay >= 10 && hourOfDay <= 14) visitProbability = 0.6; // Mediodía
        else if (hourOfDay >= 18 && hourOfDay <= 22) visitProbability = 0.5; // Tarde/noche
        else if (hourOfDay >= 0 && hourOfDay <= 6) visitProbability = 0.1; // Madrugada
        
        if (Math.random() < visitProbability) {
            const maxIncrement = Math.floor(maxPossible - count);
            if (maxIncrement > 0) {
                // Incrementos más grandes para simular múltiples usuarios
                const randomIncrement = Math.floor(Math.random() * Math.min(maxIncrement, 20)) + 1;
                count = Math.min(count + randomIncrement, 10000);
                
                localStorage.setItem('globalVisitCounter', JSON.stringify({
                    currentMonth: currentMonth,
                    count: count,
                    lastUpdate: Date.now()
                }));
                counterElement.textContent = count.toLocaleString();
                
                // Efecto sutil de incremento
                counterElement.style.color = '#FFD700';
                counterElement.style.textShadow = '0 0 12px rgba(255, 215, 0, 0.6)';
                setTimeout(() => {
                    counterElement.style.color = '#FFD700';
                    counterElement.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
                }, 200);
            }
        }
    }
    
    // Simular visitas de otros usuarios cada 30 segundos - 2 minutos
    function scheduleNextSimulation() {
        const delay = 30000 + Math.random() * 90000; // 30s - 2min
        setTimeout(() => {
            simulateOtherUsers();
            scheduleNextSimulation();
        }, delay);
    }
    
    // Iniciar la simulación
    scheduleNextSimulation();
})();
