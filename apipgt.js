async function askYandexGPT(question, options = {}) {
    // Укажите ваш реальный Cloudflare Worker URL
    const CLOUDFLARE_WORKER_URL = 'https://plain-bush-9339.cr4zy228007.workers.dev';
    
    // Параметры запроса
    const config = {
        model: options.model || 'yandexgpt-lite',
        temperature: options.temperature || 0.6,
        maxTokens: options.maxTokens || 50,
        stream: options.stream || false
    };
    
    // Добавляем инструкцию для краткого ответа
    question = question + ': выбери один ответ или ответь максимально коротко.';
    
    console.log(`📤 Отправляю запрос через Cloudflare Worker: "${question.substring(0, 50)}..."`);
    
    try {
        // Отправка запроса к Cloudflare Worker
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question,
                model: config.model,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                stream: config.stream
            })
        });
        
        // Проверка статуса ответа
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Парсинг ответа
        const data = await response.json();
        
        // Проверка структуры ответа от Worker
        if (!data.success) {
            throw new Error(data.error || 'Unknown error from Worker');
        }
        
        // Извлечение текста ответа
        const answer = data.answer;
        
        console.log('✅ Ответ получен через Cloudflare:', answer);
        
        return answer;
        
    } catch (error) {
        console.error('❌ Ошибка при запросе к Cloudflare Worker:', error.message);
        return `Ошибка: ${error.message}`;
    }
}