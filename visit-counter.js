// Simulador de contador de visitas
(function() {
    // Obtener o inicializar datos del mes
    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const storedData = JSON.parse(localStorage.getItem('visitCounterData') || '{}');
    
    let currentMonth = storedData.currentMonth || monthKey;
    let count = storedData.count || 0;
    
    // Si cambió el mes, reiniciar contador a 0
    if (currentMonth !== monthKey) {
        count = 0; // Reiniciar a 0
        currentMonth = monthKey;
        localStorage.setItem('visitCounterData', JSON.stringify({
            currentMonth: currentMonth,
            count: count,
            lastUpdate: Date.now()
        }));
    }
    
    const counterElement = document.getElementById('counterNumber');
    
    if (!counterElement) return;
    
    // Incrementar contador por visita real
    if (count < 10000) {
        count++;
    }
    
    // Guardar en localStorage
    const data = {
        currentMonth: currentMonth,
        count: count,
        lastUpdate: Date.now()
    };
    localStorage.setItem('visitCounterData', JSON.stringify(data));
    
    // Actualizar display con formato
    counterElement.textContent = count.toLocaleString();
    
    // Animación inicial
    counterElement.style.opacity = '0';
    setTimeout(() => {
        counterElement.style.transition = 'opacity 0.5s ease';
        counterElement.style.opacity = '1';
    }, 100);
    
    // Incremento aleatorio durante el mes
    function randomIncrement() {
        // Si ya llegamos a 10,000, no incrementar más
        if (count >= 10000) return;
        
        // Calcular días transcurridos y días totales del mes
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        
        // Calcular progreso del mes (0 a 1)
        const monthProgress = currentDay / daysInMonth;
        
        // Calcular rango máximo basado en el progreso del mes
        // Al inicio del mes: máximo bajo, al final: máximo alto
        const maxPossible = Math.min(10000, 100 + (monthProgress * 9900)); // 100 a 10,000 gradualmente
        
        // Generar incremento aleatorio
        const maxIncrement = Math.floor(maxPossible - count);
        if (maxIncrement > 0) {
            const randomIncrement = Math.floor(Math.random() * Math.min(maxIncrement, 50)) + 1; // 1-50 por vez
            count = Math.min(count + randomIncrement, 10000);
            
            localStorage.setItem('visitCounterData', JSON.stringify({
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
    
    // Incremento aleatorio cada 2-8 minutos (más frecuente para crecimiento visible)
    function scheduleNextIncrement() {
        const delay = 2 * 60 * 1000 + Math.random() * 6 * 60 * 1000; // 2-8 minutos
        setTimeout(() => {
            randomIncrement();
            scheduleNextIncrement();
        }, delay);
    }
    
    // Iniciar el ciclo aleatorio
    scheduleNextIncrement();
})();
